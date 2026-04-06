import type { Exercise } from "@/components/shared/ExerciseCard/ExerciseCard";
import { SimulationWorkspace } from "@/components/shared/SimulationWorkspace/SimulationWorkspace";

interface SimulationTabProps {
  selectedExercise: Exercise | null;
}

export function SimulationTab({ selectedExercise }: SimulationTabProps) {
  return (
    <SimulationWorkspace
      selectedExercise={selectedExercise}
      placeholderText="The Finite Automata simulator will be available here."
    />
  );
}
