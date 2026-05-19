import type { ModuleExercisesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicExercisesTab } from "@/components/shared/TopicExercisesTab/TopicExercisesTab";
import type { Exercise } from "@/types/exercise";
import {
  faExercises,
  findFAExercise,
} from "../exercises/faExerciseDefinitions";
import { useFASimulatorStore } from "../store/faSimulatorStore";

export function ExercisesTab(props: ModuleExercisesTabProps) {
  const setActiveExercise = useFASimulatorStore((s) => s.setActiveExercise);
  const loadExample = useFASimulatorStore((s) => s.loadExample);

  const handleOpen = (exercise: Exercise) => {
    const def = findFAExercise(exercise.id);
    if (def) {
      setActiveExercise(def.id);
      // Prefill the simulator input with a representative accept word so the
      // user can immediately run the example through the automaton.
      const seedInput =
        def.exampleWords?.accept.find((w) => w.length > 0) ?? "";
      loadExample(def.starter, seedInput);
    }
    props.onOpenExerciseInSimulation(exercise);
  };

  return (
    <TopicExercisesTab
      {...props}
      exercises={faExercises}
      onOpenExerciseInSimulation={handleOpen}
    />
  );
}
