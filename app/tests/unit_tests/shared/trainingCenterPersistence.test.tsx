/** @vitest-environment jsdom */

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useState } from "react";
import { useTrainingCenterPersistence } from "@/hooks/useTrainingCenterPersistence";
import {
  SIMULATOR_TASK_STORAGE_ID,
  createTrainingCenterIdentifier,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";

const TOPIC = 1;

/** Verbatim codec, so the assertions are about persistence, not encoding. */
const textCodec: ISimulatorTransferCodec<string> = {
  exportValue: (value) => Promise.resolve(btoa(value).replace(/=+$/u, "")),
  importValue: (serialized) => Promise.resolve(atob(serialized)),
};

/**
 * A minimal editor on the shared persistence, standing in for the FA and RL
 * simulators: it holds a draft, restores one on mount, and unmounts to flush.
 */
function DraftEditor({
  taskStorageId,
  initialDraft = "",
  enabled = true,
}: {
  taskStorageId?: number;
  initialDraft?: string;
  enabled?: boolean;
}) {
  const [draft, setDraft] = useState(initialDraft);
  useTrainingCenterPersistence({
    topicStorageId: TOPIC,
    taskStorageId,
    codec: textCodec,
    value: draft,
    onRestore: setDraft,
    enabled,
  });

  return <output data-testid="draft">{draft}</output>;
}

/** Autosave flushes on unmount; awaiting a tick lets that promise settle. */
async function mountThenUnmount(
  ui: Parameters<typeof render>[0],
): Promise<void> {
  const view = render(ui);
  await act(async () => undefined);
  view.unmount();
  await act(async () => undefined);
}

function slot(taskStorageId: number): string {
  return createTrainingCenterIdentifier(TOPIC, taskStorageId);
}

beforeEach(() => trainingCenterStorage.deleteAll());
afterEach(() => {
  cleanup();
  trainingCenterStorage.deleteAll();
});

describe("useTrainingCenterPersistence", () => {
  it("restores the draft saved in the same slot", async () => {
    await mountThenUnmount(
      <DraftEditor taskStorageId={3} initialDraft="ends with 01" />,
    );

    const view = render(<DraftEditor taskStorageId={3} />);
    await act(async () => undefined);

    expect(view.getByTestId("draft").textContent).toBe("ends with 01");
  });

  it("keeps each task's draft separate", async () => {
    await mountThenUnmount(
      <DraftEditor taskStorageId={3} initialDraft="answer for three" />,
    );
    await mountThenUnmount(
      <DraftEditor taskStorageId={4} initialDraft="answer for four" />,
    );

    // The regression this whole change exists to prevent: one shared slot let
    // the second exercise overwrite the first.
    const view = render(<DraftEditor taskStorageId={3} />);
    await act(async () => undefined);

    expect(view.getByTestId("draft").textContent).toBe("answer for three");
  });

  it("keeps an exercise draft out of the free simulator's slot", async () => {
    await mountThenUnmount(
      <DraftEditor taskStorageId={3} initialDraft="exercise work" />,
    );

    expect(trainingCenterStorage.load(slot(SIMULATOR_TASK_STORAGE_ID))).toBe(
      "",
    );
    expect(trainingCenterStorage.load(slot(3))).not.toBe("");
  });

  it("defaults to the free simulator's slot when given no task", async () => {
    await mountThenUnmount(<DraftEditor initialDraft="free mode work" />);

    expect(
      trainingCenterStorage.load(slot(SIMULATOR_TASK_STORAGE_ID)),
    ).not.toBe("");
  });

  it("neither saves nor restores when disabled", async () => {
    await mountThenUnmount(
      <DraftEditor
        taskStorageId={3}
        initialDraft="example demo"
        enabled={false}
      />,
    );

    expect(trainingCenterStorage.load(slot(3))).toBe("");
  });

  it("does not overwrite work done while the read was still in flight", async () => {
    await mountThenUnmount(
      <DraftEditor taskStorageId={3} initialDraft="saved earlier" />,
    );

    // Reading storage is asynchronous. Someone who starts typing — or reveals a
    // solution — in that window must keep what they did.
    function EagerEditor() {
      const [draft, setDraft] = useState("");
      useTrainingCenterPersistence({
        topicStorageId: TOPIC,
        taskStorageId: 3,
        codec: textCodec,
        value: draft,
        onRestore: setDraft,
      });
      return (
        <button data-testid="act" onClick={() => setDraft("typed just now")}>
          {draft}
        </button>
      );
    }

    const view = render(<EagerEditor />);
    act(() => view.getByTestId("act").click());
    await act(async () => undefined);

    expect(view.getByTestId("act").textContent).toBe("typed just now");
  });

  it("clears only its own slot", async () => {
    await mountThenUnmount(
      <DraftEditor taskStorageId={3} initialDraft="three" />,
    );
    await mountThenUnmount(
      <DraftEditor taskStorageId={4} initialDraft="four" />,
    );

    function ClearHarness() {
      const { clear } = useTrainingCenterPersistence({
        topicStorageId: TOPIC,
        taskStorageId: 3,
        codec: textCodec,
        value: "",
        onRestore: () => undefined,
        // Restoring would refill the draft and save it straight back.
        restoreOnMount: false,
      });
      return <button data-testid="clear" onClick={clear} />;
    }

    const view = render(<ClearHarness />);
    await act(async () => undefined);
    act(() => view.getByTestId("clear").click());

    expect(trainingCenterStorage.load(slot(3))).toBe("");
    expect(trainingCenterStorage.load(slot(4))).not.toBe("");
  });
});
