import type { ModuleExercisesTabProps } from "@/features/modules/ModuleTopicPage";
import { TopicExercisesTab } from "@/features/modules/TopicExercisesTab";
import { dnfExercises } from "../exercises";

export function ExercisesTab(props: ModuleExercisesTabProps) {
  return <TopicExercisesTab {...props} exercises={dnfExercises} />;
}
