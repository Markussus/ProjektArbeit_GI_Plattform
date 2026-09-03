import type { ModuleExercisesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { InlineResetControl } from "@/components/shared/InlineResetControl";
import {
  TopicExercisesTab,
  type TopicExerciseGroup,
} from "@/components/shared/TopicExercisesTab/TopicExercisesTab";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import {
  createTrainingCenterIdentifier,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import { useTranslation } from "react-i18next";
import {
  automataExerciseScenarios,
  mealyExercises,
  mooreExercises,
} from "../exercises";

const EXERCISE_GROUPS: TopicExerciseGroup[] = [
  {
    id: "moore",
    titleKey: "moore-mealy.groups.moore.title",
    descriptionKey: "moore-mealy.groups.moore.exercisesDescription",
    exercises: mooreExercises,
  },
  {
    id: "mealy",
    titleKey: "moore-mealy.groups.mealy.title",
    descriptionKey: "moore-mealy.groups.mealy.exercisesDescription",
    exercises: mealyExercises,
  },
];

export function ExercisesTab(props: ModuleExercisesTabProps) {
  const { t } = useTranslation();

  const handleResetAllExercises = () => {
    for (const exercise of automataExerciseScenarios) {
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
      groups={EXERCISE_GROUPS}
      testId="moore-mealy-exercises-tab"
      testIdPrefix="automata-exercise-card"
      headerAction={
        <InlineResetControl
          label={t("common.trainingCenter.resetAllExercises")}
          confirmationText={t("common.trainingCenter.confirmResetAllExercises")}
          onConfirm={handleResetAllExercises}
          testId="automata-reset-all-exercises"
        />
      }
    />
  );
}
