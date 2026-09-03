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
  /** One of {@link TOPIC_STORAGE_IDS}. */
  topicStorageId: number;
  /**
   * The exercise's own `storageId`, so each task keeps its own slot. Omit for
   * the free simulator, which lands on {@link SIMULATOR_TASK_STORAGE_ID}.
   */
  taskStorageId?: number;
  codec: ISimulatorTransferCodec<TValue>;
  /** The live draft: autosaved, and exported by the header transfer box. */
  value: TValue;
  /** Adopt the draft restored on mount. */
  onRestore: (restored: TValue) => void;
  /**
   * False for read-only scenarios — examples are pristine demonstrations
   * everywhere in the app, so they neither restore nor autosave.
   */
  enabled?: boolean;
  /**
   * False when the caller already has a value that outranks the stored one — a
   * seeded example grammar, say. Autosave still runs; only the read is skipped.
   */
  restoreOnMount?: boolean;
  /**
   * What the transfer box exports, when that differs from the autosaved draft
   * (the FA simulator exports the applied program while simulating).
   */
  transferValue?: TValue;
  /**
   * False for a slot that is mounted but not on screen. The RL simulator keeps
   * all three mode panels mounted, and only the visible one should own the
   * header transfer box.
   */
  transferEnabled?: boolean;
}

export interface TrainingCenterPersistence {
  /** Identifier of the slot this draft occupies. */
  identifier: string;
  /**
   * Whether the restore attempt has settled. Autosave waits for it, so a slow
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
 * transfer box for export/import.
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
        if (!isCancelled && isUntouched && restored) {
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
    enabled: enabled && isReady,
  });

  const clear = useCallback(() => {
    if (enabled) {
      trainingCenterStorage.delete(identifier);
    }
  }, [enabled, identifier]);

  return { identifier, isReady, clear, save };
}
