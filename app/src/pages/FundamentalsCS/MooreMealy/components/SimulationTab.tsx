import type { Exercise } from "@/components/shared/ExerciseCard/ExerciseCard";
import { SimulationWorkspace } from "@/components/shared/SimulationWorkspace/SimulationWorkspace";

interface SimulationTabProps {
  selectedExercise: Exercise | null;
  isFocused: boolean;
  onToggleFocus: () => void;
}

export function SimulationTab({
  selectedExercise,
  isFocused,
  onToggleFocus,
}: SimulationTabProps) {
  return (
    <SimulationWorkspace
      selectedExercise={selectedExercise}
      emptyStateText="The Moore & Mealy simulator will be available here."
      isFocused={isFocused}
      onToggleFocus={onToggleFocus}
    />
  );
}
