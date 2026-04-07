import type { ModuleExercisesTabProps } from "@/features/modules/ModuleTopicPage";
import { TopicExercisesTab } from "@/features/modules/TopicExercisesTab";
import { finiteAutomataExercises } from "../exercises";

export function ExercisesTab(props: ModuleExercisesTabProps) {
  return <TopicExercisesTab {...props} exercises={finiteAutomataExercises} />;
}
