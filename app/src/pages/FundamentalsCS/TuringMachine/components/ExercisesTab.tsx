import type { ModuleExercisesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicExercisesTab } from "@/components/shared/TopicExercisesTab/TopicExercisesTab";
import { turingMachineExercises } from "../exercises";

export function ExercisesTab(props: ModuleExercisesTabProps) {
  return (
    <TopicExercisesTab
      {...props}
      exercises={turingMachineExercises}
      testId="tm-exercises-tab"
      testIdPrefix="tm-exercise-card"
    />
  );
}
