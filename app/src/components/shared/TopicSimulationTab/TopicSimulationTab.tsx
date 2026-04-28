import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { SimulationWorkspace } from "@/components/shared/SimulationWorkspace/SimulationWorkspace";
import type { Exercise } from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";

interface TopicSimulationTabProps {
  emptyStateTextKey: TranslationKey;
  selectedExercise: Exercise | null;
  initialSource?: string | null;
  isFocused: boolean;
  onToggleFocus: () => void;
  children?: ReactNode;
}

export function TopicSimulationTab({
  emptyStateTextKey,
  selectedExercise,
  isFocused,
  onToggleFocus,
  children,
}: TopicSimulationTabProps) {
  const { t } = useTranslation();

  return (
    <SimulationWorkspace
      selectedExercise={selectedExercise}
      emptyStateText={t(emptyStateTextKey)}
      isFocused={isFocused}
      onToggleFocus={onToggleFocus}
    >
      {children}
    </SimulationWorkspace>
  );
}
