import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useActiveSimulatorTransfer } from "@/hooks/useActiveSimulatorTransfer";
import { useTrainingCenterAutoSave } from "@/hooks/useTrainingCenterAutoSave";
import {
  SIMULATOR_TASK_STORAGE_ID,
  createTrainingCenterIdentifier,
  loadTrainingCenterValue,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";

export interface UseTrainingCenterPersistenceOptions<TValue> {
  /** Topic identifier from `TOPIC_STORAGE_IDS`. */
  topicStorageId: number;
  /**
   * Task slot. Defaults to `SIMULATOR_TASK_STORAGE_ID` (the free simulator).
   * For exercises pass the exercise's `storageId`.
   */
  taskStorageId?: number;
  /** Codec used to serialize/deserialize this simulator's state. */
  codec: ISimulatorTransferCodec<TValue>;
  /** Current state to persist on autosave ticks. */
  value: TValue;
  /** Called when a stored draft for this slot has been restored. */
  onRestore: (restored: TValue) => void;
  /**
   * Turn persistence on or off. Defaults to true. Setting this to false skips
   * restoring on mount and stops autosaving (useful for non-persisted walkthroughs).
   */
  enabled?: boolean;
  /**
   * Whether to attempt restoring a stored value when mounting. Defaults to true.
   * Disabling this is useful when the caller wants to handle restoring itself
   * (e.g. before initial state is populated).
   */
  restoreOnMount?: boolean;
  /**
   * The value registered with the header transfer box for export/import.
   * Defaults to `value`. Provide this when the wire format differs from the
   * saved draft (e.g. when export should only run on committed states).
   */
  transferValue?: TValue;
  /** Whether the simulator should register with the header transfer box. */
  transferEnabled?: boolean;
  /** Override the shared autosave interval when a simulator needs it. */
  intervalMs?: number;
  /**
   * Whether autosaving is enabled when the hook is ready. Defaults to true.
   * Useful when an untouched or reset state should not immediately write to storage.
   */
  autoSaveEnabled?: boolean;
}

export interface TrainingCenterPersistence {
  /** The full slot identifier (`{topic}{task}`). */
  identifier: string;
  /**
   * Whether the initial restore check has completed. Components can use this
   * to delay autosaving until the stored value has been loaded, so the first
   * read can't be overwritten by the initial value.
   */
  isReady: boolean;
  /** Drop the stored draft for this slot. */
  clear: () => void;
  /** Force an immediate save, outside the autosave interval. */
  save: () => Promise<string>;
}

/**
 * The Training Center persistence every topic needs: one storage slot per task,
 * restored on mount, autosaved while editing, and registered with the header
 * transfer box for export/import directions.
 *
 * Topics previously hand-rolled these four steps, which is how Finite Automata
 * ended up sharing a single slot across all its exercises and Regular Languages
 * kept no exercise progress at all.
 */
export function useTrainingCenterPersistence<TValue>({
  topicStorageId,
  taskStorageId = SIMULATOR_TASK_STORAGE_ID,
  codec,
  value,
  onRestore,
  enabled = true,
  restoreOnMount = true,
  transferValue,
  transferEnabled = true,
  intervalMs,
  autoSaveEnabled = true,
}: UseTrainingCenterPersistenceOptions<TValue>): TrainingCenterPersistence {
  const identifier = useMemo(
    () => createTrainingCenterIdentifier(topicStorageId, taskStorageId),
    [topicStorageId, taskStorageId],
  );

  const shouldRestore = enabled && restoreOnMount;
  // With nothing to read back, the slot is ready to be autosaved at once.
  const [isReady, setIsReady] = useState(!shouldRestore);

  // Keeping the callback in a ref lets the restore effect depend on the slot
  // alone; an inline `onRestore` would otherwise re-read on every render.
  const onRestoreRef = useRef(onRestore);
  useEffect(() => {
    onRestoreRef.current = onRestore;
  }, [onRestore]);

  // The value this slot started from, and what it holds right now. Reading
  // storage is asynchronous, so a learner can type — or reveal a solution —
  // before the read lands; adopting it then would throw that work away.
  const pristineValueRef = useRef(value);
  const currentValueRef = useRef(value);
  useEffect(() => {
    currentValueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!shouldRestore) {
      setIsReady(true);
      return;
    }

    let isCancelled = false;
    setIsReady(false);
    pristineValueRef.current = currentValueRef.current;

    void loadTrainingCenterValue(identifier, codec)
      .then((restored) => {
        const isUntouched = Object.is(
          currentValueRef.current,
          pristineValueRef.current,
        );
        if (!isCancelled && isUntouched && restored !== null) {
          onRestoreRef.current(restored);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!isCancelled) {
          setIsReady(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [codec, shouldRestore, identifier]);

  useActiveSimulatorTransfer({
    identifier,
    value: transferValue ?? value,
    codec,
    enabled: transferEnabled,
  });

  const save = useTrainingCenterAutoSave({
    identifier,
    value,
    codec,
    enabled: enabled && isReady && autoSaveEnabled,
    intervalMs,
  });

  const clear = useCallback(() => {
    if (enabled) {
      trainingCenterStorage.delete(identifier);
    }
  }, [enabled, identifier]);

  return { identifier, isReady, clear, save };
}
