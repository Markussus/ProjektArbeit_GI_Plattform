import type { ModuleExercisesTabProps } from "@/features/modules/ModuleTopicPage";
import { TopicExercisesTab } from "@/features/modules/TopicExercisesTab";
import { mooreMealyExercises } from "../exercises";

export function ExercisesTab(props: ModuleExercisesTabProps) {
  return <TopicExercisesTab {...props} exercises={mooreMealyExercises} />;
}
