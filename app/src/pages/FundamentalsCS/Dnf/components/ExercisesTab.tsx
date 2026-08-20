import type { ModuleExercisesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { InlineResetControl } from "@/components/shared/InlineResetControl";
import {
  TopicExercisesTab,
  type TopicExerciseGroup,
} from "@/components/shared/TopicExercisesTab/TopicExercisesTab";
import { TOPIC_STORAGE_IDS } from "@/data/moduleCatalog";
import {
  createTrainingCenterIdentifier,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import { useTranslation } from "react-i18next";
import { dnfExercises } from "../exercises";

const DNF_EXERCISE_GROUPS: TopicExerciseGroup[] = [
  {
    id: "expression_to_truth_table",
    titleKey: "dnf.taskGroups.expression_to_truth_table.title",
    descriptionKey: "dnf.taskGroups.expression_to_truth_table.description",
    exercises: dnfExercises.filter(
      (exercise) => exercise.mode === "expression_to_truth_table",
    ),
  },
  {
    id: "truth_table_to_dnf",
    titleKey: "dnf.taskGroups.truth_table_to_dnf.title",
    descriptionKey: "dnf.taskGroups.truth_table_to_dnf.description",
    exercises: dnfExercises.filter(
      (exercise) => exercise.mode === "truth_table_to_dnf",
    ),
  },
];

export function ExercisesTab(props: ModuleExercisesTabProps) {
  const { t } = useTranslation();

  const handleResetAllExercises = () => {
    for (const exercise of dnfExercises) {
      trainingCenterStorage.delete(
        createTrainingCenterIdentifier(
          TOPIC_STORAGE_IDS.dnf,
          exercise.storageId,
        ),
      );
    }
  };

  return (
    <TopicExercisesTab
      {...props}
      groups={DNF_EXERCISE_GROUPS}
      testId="dnf-exercises-tab"
      testIdPrefix="dnf-exercise-card"
      headerAction={
        <InlineResetControl
          label={t("trainingCenter.resetAllExercises")}
          confirmationText={t("trainingCenter.confirmResetAllExercises")}
          onConfirm={handleResetAllExercises}
          testId="dnf-reset-all-exercises"
        />
      }
    />
  );
}
