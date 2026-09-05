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
import { RL_STORAGE_TASK_IDS } from "./Simulator/useRLPersistedSource";

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

  const handleResetAllExercises = () => {
    for (const taskStorageId of Object.values(RL_STORAGE_TASK_IDS)) {
      trainingCenterStorage.delete(
        createTrainingCenterIdentifier(
          TOPIC_STORAGE_IDS.regularLanguages,
          taskStorageId,
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
