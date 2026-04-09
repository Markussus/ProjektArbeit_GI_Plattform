import type { ModuleExercisesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicExercisesTab } from "@/components/shared/TopicExercisesTab/TopicExercisesTab";
import { mooreMealyExercises } from "../exercises";

export function ExercisesTab(props: ModuleExercisesTabProps) {
  return <TopicExercisesTab {...props} exercises={mooreMealyExercises} />;
}
