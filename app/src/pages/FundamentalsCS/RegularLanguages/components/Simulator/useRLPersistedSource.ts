import { useEffect, useMemo, useRef, useState } from "react";
import { TOPIC_STORAGE_IDS } from "@/data/moduleCatalog";
import { useTrainingCenterAutoSave } from "@/hooks/useTrainingCenterAutoSave";
import {
  createTrainingCenterIdentifier,
  createTrainingCenterTransferCodec,
  loadTrainingCenterValue,
} from "@/lib/trainingCenter";
import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";

/**
 * Dedicated Training Center task slots for the Regular Languages simulator
 * modes. Each mode keeps its own source so switching modes doesn't clobber the
 * other's saved work. RL exercises don't persist per-task progress, so these
 * task ids never collide with exercise slots within the topic.
 */
export const RL_STORAGE_TASK_IDS = {
  grammarToLanguage: 0,
  languageToGrammar: 1,
  recognizeWord: 2,
} as const;

interface UseRLPersistedSourceOptions {
  /** One of {@link RL_STORAGE_TASK_IDS}. */
  taskStorageId: number;
  /** Codec used both for the export/import box and for persistence. */
  codec: ISimulatorTransferCodec<string>;
  /** The current editable source text. */
  source: string;
  /** Adopt a restored source on mount. */
  setSource: (value: string) => void;
  /**
   * Whether an example/exercise seeded this mode. A seed takes priority over a
   * previously saved source, so the restore is skipped when one is present.
   */
  hasSeed: boolean;
}

/**
 * Persists a single RL simulator source to local storage using the same
 * Training Center mechanism as the Turing Machine module: restore on mount,
 * autosave while editing, and wrap the codec so the export/import box writes
 * through to storage. Returns the storage-aware transfer codec.
 */
export function useRLPersistedSource({
  taskStorageId,
  codec,
  source,
  setSource,
  hasSeed,
}: UseRLPersistedSourceOptions): ISimulatorTransferCodec<string> {
  const identifier = useMemo(
    () =>
      createTrainingCenterIdentifier(
        TOPIC_STORAGE_IDS.regularLanguages,
        taskStorageId,
      ),
    [taskStorageId],
  );
  const storageCodec = useMemo(
    () => createTrainingCenterTransferCodec(identifier, codec),
    [identifier, codec],
  );

  // A seed (from an example/exercise) takes priority over a saved source, so
  // storage is considered ready immediately in that case.
  const [isStorageReady, setIsStorageReady] = useState(hasSeed);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    // A seeded source is already in place; don't restore over it.
    if (hasSeed) {
      return;
    }

    let isCancelled = false;
    void loadTrainingCenterValue(identifier, codec)
      .then((storedSource) => {
        if (!isCancelled && storedSource) {
          setSource(storedSource);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!isCancelled) {
          setIsStorageReady(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [codec, hasSeed, identifier, setSource]);

  useTrainingCenterAutoSave({
    identifier,
    value: source,
    codec,
    enabled: isStorageReady,
  });

  return storageCodec;
}
