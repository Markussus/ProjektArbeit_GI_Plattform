import { useTranslation } from "react-i18next";
import { SimulationWorkspace } from "@/components/shared/SimulationWorkspace/SimulationWorkspace";
import type { Exercise } from "@/types/exercise";

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
