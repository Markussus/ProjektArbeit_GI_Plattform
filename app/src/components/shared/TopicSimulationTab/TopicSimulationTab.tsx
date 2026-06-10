import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { SimulationWorkspace } from "@/components/shared/SimulationWorkspace/SimulationWorkspace";
import type { Exercise, TopicItem } from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";

interface TopicSimulationTabProps {
  emptyStateTextKey: TranslationKey;
  selectedExercise: Exercise | null;
  selectedItem?: TopicItem | null;
  isFocused: boolean;
  onToggleFocus: () => void;
  onReset?: () => void;
  resetDisabled?: boolean;
  selectedItemActions?: ReactNode;
  children?: ReactNode;
}

export function TopicSimulationTab({
  emptyStateTextKey,
  selectedExercise,
  selectedItem,
  isFocused,
  onToggleFocus,
  onReset,
  resetDisabled,
  selectedItemActions,
  children,
}: TopicSimulationTabProps) {
  const { t } = useTranslation();

  return (
    <SimulationWorkspace
      selectedExercise={selectedExercise}
      selectedItem={selectedItem}
      selectedItemActions={selectedItemActions}
      emptyStateText={t(emptyStateTextKey)}
      isFocused={isFocused}
      onToggleFocus={onToggleFocus}
      onReset={onReset}
      resetDisabled={resetDisabled}
    >
      {children}
    </SimulationWorkspace>
  );
}
