import { useTranslation } from "react-i18next";
import type { ModuleExercisesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { InlineResetControl } from "@/components/shared/InlineResetControl";
import { TopicExercisesTab } from "@/components/shared/TopicExercisesTab/TopicExercisesTab";
import { TOPIC_STORAGE_IDS } from "@/data/moduleCatalog";
import {
  createTrainingCenterIdentifier,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import { numberSystemsExercises } from "../exercises";

export function ExercisesTab(props: ModuleExercisesTabProps) {
  const { t } = useTranslation();

  const handleResetAllExercises = () => {
    for (let i = 0; i < numberSystemsExercises.length; i++) {
      trainingCenterStorage.delete(
        createTrainingCenterIdentifier(TOPIC_STORAGE_IDS.numberSystems, i),
      );
    }
  };

  return (
    <TopicExercisesTab
      {...props}
      exercises={numberSystemsExercises}
      testId="ns-exercises-tab"
      headerAction={
        <InlineResetControl
          label={t("trainingCenter.resetAllExercises")}
          confirmationText={t("trainingCenter.confirmResetAllExercises")}
          onConfirm={handleResetAllExercises}
          testId="ns-reset-all-exercises"
        />
      }
    />
  );
}
