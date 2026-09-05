/** @vitest-environment jsdom */

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TRAINING_CENTER_STORAGE_KEY,
  createTopicIdentifier,
  createTrainingCenterIdentifier,
  createTrainingCenterTransferCodec,
  exportAndStoreTrainingCenterValue,
  exportTrainingCenterValue,
  loadTrainingCenterValue,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import {
  DEFAULT_TRAINING_CENTER_AUTO_SAVE_INTERVAL,
  useTrainingCenterAutoSave,
} from "@/hooks/useTrainingCenterAutoSave";
import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";

describe("training center storage", () => {
  beforeEach(() => {
    const storage = new MemoryStorage();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: storage,
    });
    vi.stubGlobal("localStorage", storage);
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("stores values in one list and overwrites matching identifiers", () => {
    const firstIdentifier = createTrainingCenterIdentifier(1, 2);
    const secondIdentifier = createTrainingCenterIdentifier(1, 3);

    trainingCenterStorage.store(`${firstIdentifier}first`);
    trainingCenterStorage.store(`${secondIdentifier}second`);
    trainingCenterStorage.store(`${firstIdentifier}updated`);

    expect(trainingCenterStorage.load(firstIdentifier)).toBe(
      `${firstIdentifier}updated`,
    );
    expect(
      JSON.parse(
        window.localStorage.getItem(TRAINING_CENTER_STORAGE_KEY) ?? "",
      ),
    ).toEqual([`${firstIdentifier}updated`, `${secondIdentifier}second`]);
  });

  it("returns an empty string when no matching value exists", () => {
    expect(trainingCenterStorage.load(createTrainingCenterIdentifier(2))).toBe(
      "",
    );
  });

  it("deletes one identifier, one topic, or the complete list", () => {
    const topicOneTask = createTrainingCenterIdentifier(1, 0);
    const topicOneSimulator = createTrainingCenterIdentifier(1);
    const topicTwoTask = createTrainingCenterIdentifier(2, 0);

    trainingCenterStorage.store(`${topicOneTask}task`);
    trainingCenterStorage.store(`${topicOneSimulator}simulator`);
    trainingCenterStorage.store(`${topicTwoTask}other`);

    trainingCenterStorage.delete(topicOneTask);
    expect(trainingCenterStorage.load(topicOneTask)).toBe("");
    expect(trainingCenterStorage.load(topicOneSimulator)).not.toBe("");

    trainingCenterStorage.deleteAll(createTopicIdentifier(1));
    expect(trainingCenterStorage.load(topicOneSimulator)).toBe("");
    expect(trainingCenterStorage.load(topicTwoTask)).not.toBe("");

    trainingCenterStorage.deleteAll();
    expect(window.localStorage.getItem(TRAINING_CENTER_STORAGE_KEY)).toBeNull();
  });

  it("exports with the identifier, stores the result, and imports its payload", async () => {
    const identifier = createTrainingCenterIdentifier(7, 4);
    const codec: ISimulatorTransferCodec<string> = {
      exportValue: vi.fn(async (value) => `encoded-${value}`),
      importValue: vi.fn(async (value) => `decoded-${value}`),
    };

    await expect(
      exportAndStoreTrainingCenterValue(identifier, "source", codec),
    ).resolves.toBe(`${identifier}encoded-source`);
    await expect(loadTrainingCenterValue(identifier, codec)).resolves.toBe(
      "decoded-encoded-source",
    );
  });

  it("exports a current simulator snapshot without changing LocalStorage", async () => {
    const identifier = createTrainingCenterIdentifier(7);
    const codec: ISimulatorTransferCodec<string> = {
      exportValue: vi.fn(async (value) => `encoded-${value}`),
      importValue: vi.fn(),
    };

    await expect(
      exportTrainingCenterValue(identifier, "live-state", codec),
    ).resolves.toBe(`${identifier}encoded-live-state`);
    expect(trainingCenterStorage.load(identifier)).toBe("");
  });

  it("returns null without importing when no saved value exists", async () => {
    const codec: ISimulatorTransferCodec<string> = {
      exportValue: vi.fn(),
      importValue: vi.fn(),
    };

    await expect(
      loadTrainingCenterValue(createTrainingCenterIdentifier(3), codec),
    ).resolves.toBeNull();
    expect(codec.importValue).not.toHaveBeenCalled();
  });

  it("creates a prefixed transfer codec bound to one storage identifier", async () => {
    const identifier = createTrainingCenterIdentifier(7, 2);
    const otherIdentifier = createTrainingCenterIdentifier(7, 3);
    const codec: ISimulatorTransferCodec<string> = {
      exportValue: async (value) => `encoded-${value}`,
      importValue: async (value) => `decoded-${value}`,
    };
    const storageCodec = createTrainingCenterTransferCodec(identifier, codec);

    await expect(storageCodec.exportValue("source")).resolves.toBe(
      `${identifier}encoded-source`,
    );
    await expect(
      storageCodec.importValue(`${identifier}encoded-source`),
    ).resolves.toBe("decoded-encoded-source");
    await expect(
      storageCodec.importValue(`${otherIdentifier}encoded-source`),
    ).rejects.toThrow("training_center_transfer_identifier_invalid");
  });

  it("provides manual saving and automatically saves every ten seconds", async () => {
    vi.useFakeTimers();
    const identifier = createTrainingCenterIdentifier(4);
    const codec: ISimulatorTransferCodec<string> = {
      exportValue: vi.fn(async (value) => `encoded-${value}`),
      importValue: vi.fn(),
    };
    const { result, unmount } = renderHook(() =>
      useTrainingCenterAutoSave({
        identifier,
        value: "state",
        codec,
      }),
    );

    await act(async () => {
      await result.current();
    });
    expect(codec.exportValue).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(DEFAULT_TRAINING_CENTER_AUTO_SAVE_INTERVAL);
      await Promise.resolve();
    });

    expect(codec.exportValue).toHaveBeenCalledTimes(2);
    expect(trainingCenterStorage.load(identifier)).toBe(
      `${identifier}encoded-state`,
    );

    act(() => {
      unmount();
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(codec.exportValue).toHaveBeenCalledTimes(3);
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
