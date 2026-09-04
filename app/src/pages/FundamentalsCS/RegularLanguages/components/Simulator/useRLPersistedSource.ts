import { useCallback } from "react";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import { useTrainingCenterPersistence } from "@/hooks/useTrainingCenterPersistence";
import { SIMULATOR_TASK_STORAGE_ID } from "@/lib/trainingCenter";
import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";

/**
 * Dedicated Training Center task slots for the Regular Languages simulator
 * modes. Each mode keeps its own source so switching modes doesn't clobber the
 * other's saved work.
 *
 * They sit at the top of the task range because the low ids belong to the
 * exercises, which are numbered from 0 like every other topic's. The default
 * mode takes {@link SIMULATOR_TASK_STORAGE_ID}, so a shared free-mode grammar
 * imports as "the simulator" rather than as a task.
 */
export const RL_STORAGE_TASK_IDS = {
  grammarToLanguage: SIMULATOR_TASK_STORAGE_ID,
  languageToGrammar: SIMULATOR_TASK_STORAGE_ID - 1,
  recognizeWord: SIMULATOR_TASK_STORAGE_ID - 2,
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
   * Whether an example seeded this mode. A seed takes priority over a
   * previously saved source, so the restore is skipped when one is present.
   */
  hasSeed: boolean;
  /** Whether this mode's panel is the visible one. */
  transferActive?: boolean;
}

/**
 * Persists one free-mode Regular Languages source through the shared Training
 * Center persistence every topic uses. Returns the identifier of its slot.
 */
export function useRLPersistedSource({
  taskStorageId,
  codec,
  source,
  setSource,
  hasSeed,
  transferActive = true,
}: UseRLPersistedSourceOptions): string {
  const handleRestore = useCallback(
    (restored: string) => setSource(restored),
    [setSource],
  );

  const { identifier } = useTrainingCenterPersistence({
    topicStorageId: TOPIC_STORAGE_IDS.regularLanguages,
    taskStorageId,
    codec,
    value: source,
    onRestore: handleRestore,
    restoreOnMount: !hasSeed,
    transferEnabled: transferActive,
  });

  return identifier;
}
