import type { ModuleExercisesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { InlineResetControl } from "@/components/shared/InlineResetControl";
import { TopicExercisesTab } from "@/components/shared/TopicExercisesTab/TopicExercisesTab";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import {
  createTrainingCenterIdentifier,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import { useTranslation } from "react-i18next";
import { mooreExerciseScenarios, mooreMealyExercises } from "../exercises";

export function ExercisesTab(props: ModuleExercisesTabProps) {
  const { t } = useTranslation();

  const handleResetAllExercises = () => {
    for (const exercise of mooreExerciseScenarios) {
      trainingCenterStorage.delete(
        createTrainingCenterIdentifier(
          TOPIC_STORAGE_IDS.mooreMealy,
          exercise.storageId,
        ),
      );
    }
  };

  return (
    <TopicExercisesTab
      {...props}
      exercises={mooreMealyExercises}
      testId="moore-exercises-tab"
      testIdPrefix="moore-exercise-card"
      headerAction={
        <InlineResetControl
          label={t("common.trainingCenter.resetAllExercises")}
          confirmationText={t("common.trainingCenter.confirmResetAllExercises")}
          onConfirm={handleResetAllExercises}
          testId="moore-reset-all-exercises"
        />
      }
    />
  );
}
