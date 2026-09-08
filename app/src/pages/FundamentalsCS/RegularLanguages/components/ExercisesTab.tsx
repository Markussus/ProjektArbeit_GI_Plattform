import { useTranslation } from "react-i18next";
import { InlineResetControl } from "@/components/shared/InlineResetControl";
import type { ModuleExercisesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import {
  TopicExercisesTab,
  type TopicExerciseGroup,
} from "@/components/shared/TopicExercisesTab/TopicExercisesTab";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import {
  createTrainingCenterIdentifier,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import type { Exercise } from "@/types/exercise";
import {
  rlExercises,
  type RLExerciseCategory,
} from "../exercises/rlExerciseDefinitions";

/** Section order on the page — one block per kind of task. */
const CATEGORY_ORDER: RLExerciseCategory[] = [
  "grammarToLanguage",
  "languageToGrammar",
  "applied",
];

export function ExercisesTab(props: ModuleExercisesTabProps) {
  const { t } = useTranslation();

  const handleOpen = (exercise: Exercise) => {
    props.onOpenExerciseInSimulation(exercise);
  };

  // Clears every exercise's saved draft, and only those — the free simulator's
  // three mode slots keep their work, which this control doesn't claim to touch.
  const handleResetAllExercises = () => {
    for (const exercise of rlExercises) {
      trainingCenterStorage.delete(
        createTrainingCenterIdentifier(
          TOPIC_STORAGE_IDS.regularLanguages,
          exercise.storageId,
        ),
      );
    }
  };

  const groups: TopicExerciseGroup[] = CATEGORY_ORDER.map((category) => ({
    id: category,
    titleKey:
      `regular-languages.exercises.categories.${category}.title` as const,
    descriptionKey:
      `regular-languages.exercises.categories.${category}.description` as const,
    exercises: rlExercises.filter((def) => def.category === category),
  })).filter((group) => group.exercises.length > 0);

  return (
    <TopicExercisesTab
      {...props}
      groups={groups}
      testId="rl-exercises-tab"
      onOpenExerciseInSimulation={handleOpen}
      headerAction={
        <InlineResetControl
          label={t("common.trainingCenter.resetAllExercises")}
          confirmationText={t("common.trainingCenter.confirmResetAllExercises")}
          onConfirm={handleResetAllExercises}
          testId="rl-reset-all-exercises"
        />
      }
    />
  );
}
