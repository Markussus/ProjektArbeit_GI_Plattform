import type { ModuleExercisesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { InlineResetControl } from "@/components/shared/InlineResetControl";
import { TopicExercisesTab } from "@/components/shared/TopicExercisesTab/TopicExercisesTab";
import { TOPIC_STORAGE_IDS } from "@/data/moduleCatalog";
import {
  createTrainingCenterIdentifier,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import { useTranslation } from "react-i18next";
import { turingMachineExercises as exerciseDefinitions } from "../exercises";
import { turingMachineExercises } from "../scenarios";

export function ExercisesTab(props: ModuleExercisesTabProps) {
  const { t } = useTranslation();

  const handleResetAllExercises = () => {
    for (const exercise of turingMachineExercises) {
      trainingCenterStorage.delete(
        createTrainingCenterIdentifier(
          TOPIC_STORAGE_IDS.turingMachine,
          exercise.storageId,
        ),
      );
    }
  };

  return (
    <TopicExercisesTab
      {...props}
      exercises={exerciseDefinitions}
      testId="tm-exercises-tab"
      testIdPrefix="tm-exercise-card"
      headerAction={
        <InlineResetControl
          label={t("common.trainingCenter.resetAllExercises")}
          confirmationText={t("common.trainingCenter.confirmResetAllExercises")}
          onConfirm={handleResetAllExercises}
          testId="tm-reset-all-exercises"
        />
      }
    />
  );
}
