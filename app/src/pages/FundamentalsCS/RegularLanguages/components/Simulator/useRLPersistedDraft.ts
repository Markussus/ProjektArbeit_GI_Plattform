import { useCallback } from "react";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import { useTrainingCenterPersistence } from "@/hooks/useTrainingCenterPersistence";
import type { RLExerciseDefinition } from "../../exercises/rlExerciseDefinitions";
import { rlDraftTransferCodec } from "./domain/rlDraftTransfer";

/** What the caller can do with the saved draft; restoring happens on its own. */
export interface RLPersistedDraft {
  clear: () => void;
}

/**
 * Persists the answer a learner is writing for one exercise, in that exercise's
 * own Training Center slot. Passing no exercise disables it, which is what free
 * mode (persisted per mode by `useRLPersistedSource`) and examples want.
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
