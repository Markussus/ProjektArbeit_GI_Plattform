/** @vitest-environment jsdom */

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  useActiveSimulatorTransfer,
  useActiveSimulatorTransferStore,
} from "@/hooks/useActiveSimulatorTransfer";
import { createTrainingCenterIdentifier } from "@/lib/trainingCenter";
import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";

describe("active simulator transfer registry", () => {
  beforeEach(() => {
    useActiveSimulatorTransferStore.setState({ activeTransfer: null });
  });

  afterEach(() => {
    cleanup();
    useActiveSimulatorTransferStore.setState({ activeTransfer: null });
  });

  it("exports the latest rendered simulator state and unregisters on unmount", async () => {
    const identifier = createTrainingCenterIdentifier(7);
    const codec: ISimulatorTransferCodec<string> = {
      exportValue: async (value) => `encoded-${value}`,
      importValue: async (value) => value,
    };
    const { rerender, unmount } = renderHook(
      ({ value }) => useActiveSimulatorTransfer({ identifier, value, codec }),
      { initialProps: { value: "first" } },
    );

    rerender({ value: "latest" });

    await expect(
      useActiveSimulatorTransferStore.getState().activeTransfer?.exportValue(),
    ).resolves.toBe(`${identifier}encoded-latest`);

    act(() => unmount());
    expect(
      useActiveSimulatorTransferStore.getState().activeTransfer,
    ).toBeNull();
  });

  it("does not let an older cleanup remove a newer registration", () => {
    const unregisterFirst = useActiveSimulatorTransferStore
      .getState()
      .register(async () => "first");
    const unregisterSecond = useActiveSimulatorTransferStore
      .getState()
      .register(async () => "second");

    unregisterFirst();
    expect(
      useActiveSimulatorTransferStore.getState().activeTransfer,
    ).not.toBeNull();

    unregisterSecond();
    expect(
      useActiveSimulatorTransferStore.getState().activeTransfer,
    ).toBeNull();
  });
});
