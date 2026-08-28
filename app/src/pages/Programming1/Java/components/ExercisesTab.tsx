import type { ModuleExercisesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { InlineResetControl } from "@/components/shared/InlineResetControl";
import { TopicExercisesTab } from "@/components/shared/TopicExercisesTab/TopicExercisesTab";
import { TOPIC_STORAGE_IDS } from "@/data/moduleCatalog";
import {
  createTrainingCenterIdentifier,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import { useTranslation } from "react-i18next";
import {
  javaProgrammingExerciseDefinitions,
  javaProgrammingExercises,
} from "../exercises";

export function ExercisesTab(props: ModuleExercisesTabProps) {
  const { t } = useTranslation();

  const handleResetAllExercises = () => {
    for (const exercise of javaProgrammingExercises) {
      trainingCenterStorage.delete(
        createTrainingCenterIdentifier(
          TOPIC_STORAGE_IDS.javaProgramming,
          exercise.storageId,
        ),
      );
    }
  };

  return (
    <TopicExercisesTab
      {...props}
      exercises={javaProgrammingExerciseDefinitions}
      testId="java-exercises-tab"
      testIdPrefix="java-exercise-card"
      headerAction={
        <InlineResetControl
          label={t("common.trainingCenter.resetAllExercises")}
          confirmationText={t("common.trainingCenter.confirmResetAllExercises")}
          onConfirm={handleResetAllExercises}
          testId="java-reset-all-exercises"
        />
      }
    />
  );
}
