import type { ModuleExercisesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicExercisesTab } from "@/components/shared/TopicExercisesTab/TopicExercisesTab";
import { javaProgrammingExerciseDefinitions } from "../exercises";

export function ExercisesTab(props: ModuleExercisesTabProps) {
  return (
    <TopicExercisesTab
      {...props}
      exercises={javaProgrammingExerciseDefinitions}
      testId="java-exercises-tab"
      testIdPrefix="java-exercise-card"
    />
  );
}
