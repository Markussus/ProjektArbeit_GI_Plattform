import { useCallback } from "react";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import { useTrainingCenterPersistence } from "@/hooks/useTrainingCenterPersistence";
import type { RLExerciseDefinition } from "../../exercises/rlExerciseDefinitions";
import { rlDraftTransferCodec } from "./domain/rlDraftTransfer";

export interface RLPersistedDraft {
  /** Drop this exercise's saved draft. */
  clear: () => void;
}

/**
 * Persists the answer a learner is writing for one Regular Languages exercise,
 * in that exercise's own Training Center slot — the same per-task persistence
 * the Turing Machine and Java modules give their exercises.
 *
 * Passing no exercise disables the whole thing, which is what free mode and
 * examples want: free mode persists per simulator mode instead
 * (see `useRLPersistedSource`), and examples never persist anywhere.
 */
export function useRLPersistedDraft({
  exercise,
  draft,
  onRestore,
}: {
  exercise?: RLExerciseDefinition | null;
  draft: string;
  onRestore: (restored: string) => void;
}): RLPersistedDraft {
  const handleRestore = useCallback(
    (restored: string) => onRestore(restored),
    [onRestore],
  );

  const { clear } = useTrainingCenterPersistence({
    topicStorageId: TOPIC_STORAGE_IDS.regularLanguages,
    taskStorageId: exercise?.storageId,
    codec: rlDraftTransferCodec,
    value: draft,
    onRestore: handleRestore,
    enabled: Boolean(exercise),
    // The mode panels own the header transfer box; an exercise draft is
    // persisted but not exported through it.
    transferEnabled: false,
  });

  return { clear };
}
