import { useTranslation } from "react-i18next";
import type { Exercise } from "@/components/shared/ExerciseCard/ExerciseCard";
import { SimulationWorkspace } from "@/components/shared/SimulationWorkspace/SimulationWorkspace";

interface TopicSimulationTabProps {
  emptyStateTextKey: string;
  selectedExercise: Exercise | null;
  isFocused: boolean;
  onToggleFocus: () => void;
}

export function TopicSimulationTab({
  emptyStateTextKey,
  selectedExercise,
  isFocused,
  onToggleFocus,
}: TopicSimulationTabProps) {
  const { t } = useTranslation();

  return (
    <SimulationWorkspace
      selectedExercise={selectedExercise}
      emptyStateText={t(emptyStateTextKey as never)}
      isFocused={isFocused}
      onToggleFocus={onToggleFocus}
    />
  );
}
