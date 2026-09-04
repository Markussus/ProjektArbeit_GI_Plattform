/** @vitest-environment jsdom */

import {
  act,
  cleanup,
  render,
  renderHook,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  exportValue: (value) =>
    Promise.resolve(`T${btoa(value).replace(/=+$/u, "")}`),
  importValue: (serialized) => Promise.resolve(atob(serialized.slice(1))),
};

/**
 * A minimal editor on the shared persistence, standing in for the FA and RL
 * simulators: it holds a draft and exposes the restored value plus readiness.
 */
interface DraftEditorProps {
  taskStorageId?: number;
  initialDraft?: string;
  enabled?: boolean;
  intervalMs?: number;
  restoreOnMount?: boolean;
}

function DraftEditor({
  taskStorageId,
  initialDraft = "",
  enabled = true,
  intervalMs,
  restoreOnMount = true,
}: DraftEditorProps) {
  const [draft, setDraft] = useState(initialDraft);
  const { isReady } = useTrainingCenterPersistence({
    topicStorageId: TOPIC,
    taskStorageId,
    codec: textCodec,
    value: draft,
    onRestore: setDraft,
    enabled,
    intervalMs,
    restoreOnMount,
  });

  return (
    <output data-testid="draft" data-storage-ready={isReady}>
      {draft}
    </output>
  );
}

/** Seed a slot through the hook's awaitable API, without starting autosave. */
async function saveDraft({
  taskStorageId,
  initialDraft = "",
}: Pick<DraftEditorProps, "taskStorageId" | "initialDraft">): Promise<void> {
  const { result, unmount } = renderHook(() =>
    useTrainingCenterPersistence({
      topicStorageId: TOPIC,
      taskStorageId,
      codec: textCodec,
      value: initialDraft,
      onRestore: () => undefined,
      enabled: false,
    }),
  );

  await act(async () => {
    await result.current.save();
  });

  unmount();
}

function slot(taskStorageId: number): string {
  return createTrainingCenterIdentifier(TOPIC, taskStorageId);
}

beforeEach(() => {
  const storage = new MemoryStorage();
  vi.stubGlobal("localStorage", storage);
  trainingCenterStorage.deleteAll();
});
afterEach(async () => {
  cleanup();
  // Cleanup autosaves are intentionally fire-and-forget. Let their promises
  // settle before the final wipe so they cannot leak into the following test.
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  trainingCenterStorage.deleteAll();
  vi.unstubAllGlobals();
});

describe("useTrainingCenterPersistence", () => {
  it("restores the draft saved in the same slot", async () => {
    await saveDraft({ taskStorageId: 3, initialDraft: "ends with 01" });

    const view = render(<DraftEditor taskStorageId={3} />);
    await waitFor(() =>
      expect(view.getByTestId("draft").textContent).toBe("ends with 01"),
    );
  });

  it("restores an intentionally empty draft", async () => {
    await saveDraft({ taskStorageId: 3 });

    const view = render(
      <DraftEditor taskStorageId={3} initialDraft="starter code" />,
    );
    await waitFor(() => expect(view.getByTestId("draft").textContent).toBe(""));
  });

  it("keeps each task's draft separate", async () => {
    await saveDraft({ taskStorageId: 3, initialDraft: "answer for three" });
    await saveDraft({ taskStorageId: 4, initialDraft: "answer for four" });

    // The regression this whole change exists to prevent: one shared slot let
    // the second exercise overwrite the first.
    const view = render(<DraftEditor taskStorageId={3} />);
    await waitFor(() =>
      expect(view.getByTestId("draft").textContent).toBe("answer for three"),
    );
  });

  it("keeps an exercise draft out of the free simulator's slot", async () => {
    await saveDraft({ taskStorageId: 3, initialDraft: "exercise work" });

    expect(trainingCenterStorage.load(slot(SIMULATOR_TASK_STORAGE_ID))).toBe(
      "",
    );
    expect(trainingCenterStorage.load(slot(3))).not.toBe("");
  });

  it("defaults to the free simulator's slot when given no task", async () => {
    await saveDraft({ initialDraft: "free mode work" });

    expect(
      trainingCenterStorage.load(slot(SIMULATOR_TASK_STORAGE_ID)),
    ).not.toBe("");
  });

  it("neither saves nor restores when disabled", async () => {
    const view = render(
      <DraftEditor
        taskStorageId={3}
        initialDraft="example demo"
        enabled={false}
      />,
    );
    view.unmount();

    expect(trainingCenterStorage.load(slot(3))).toBe("");
  });

  it("does not overwrite work done while the read was still in flight", async () => {
    await saveDraft({ taskStorageId: 3, initialDraft: "saved earlier" });

    let finishRestore: (() => void) | undefined;
    const delayedTextCodec: ISimulatorTransferCodec<string> = {
      exportValue: textCodec.exportValue,
      importValue: (serialized) =>
        new Promise((resolve) => {
          finishRestore = () => resolve(atob(serialized.slice(1)));
        }),
    };

    // Reading storage is asynchronous. Someone who starts typing — or reveals a
    // solution — in that window must keep what they did.
    function EagerEditor() {
      const [draft, setDraft] = useState("");
      useTrainingCenterPersistence({
        topicStorageId: TOPIC,
        taskStorageId: 3,
        codec: delayedTextCodec,
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
    await act(async () => finishRestore?.());

    expect(view.getByTestId("act").textContent).toBe("typed just now");
  });

  it("uses a caller-specific autosave interval", async () => {
    vi.useFakeTimers();

    try {
      render(
        <DraftEditor
          taskStorageId={3}
          initialDraft="save quickly"
          intervalMs={25}
          restoreOnMount={false}
        />,
      );

      await act(async () => {
        vi.advanceTimersByTime(24);
      });
      expect(trainingCenterStorage.load(slot(3))).toBe("");

      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      expect(trainingCenterStorage.load(slot(3))).not.toBe("");
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears only its own slot", async () => {
    await saveDraft({ taskStorageId: 3, initialDraft: "three" });
    await saveDraft({ taskStorageId: 4, initialDraft: "four" });

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

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}
