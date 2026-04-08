import type { ComponentType } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageIntro } from "@/components/shared/PageIntro/PageIntro";
import { TabNavigation } from "@/components/shared/TabNavigation/TabNavigation";
import { useExerciseTabs, type ModuleTabId } from "@/hooks/useExerciseTabs";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import type { Exercise } from "@/types/exercise";

export interface ModuleExercisesTabProps {
  selectedExercise: Exercise | null;
  onSelectExercise: (exercise: Exercise) => void;
  onOpenExerciseInSimulation: (exercise: Exercise) => void;
}

export interface ModuleSimulationTabProps {
  selectedExercise: Exercise | null;
  isFocused: boolean;
  onToggleFocus: () => void;
}

interface ModuleTopicPageProps {
  titleKey: string;
  descriptionKey: string;
  overviewTab: ComponentType;
  exercisesTab: ComponentType<ModuleExercisesTabProps>;
  examplesTab: ComponentType;
  simulationTab: ComponentType<ModuleSimulationTabProps>;
  tabs?: ModuleTabId[];
}

export function ModuleTopicPage({
  titleKey,
  descriptionKey,
  overviewTab: OverviewTab,
  exercisesTab: ExercisesTab,
  examplesTab: ExamplesTab,
  simulationTab: SimulationTab,
  tabs,
}: ModuleTopicPageProps) {
  const { t } = useTranslation();
  const tk = (key: string) => t(key as never);
  const setSidebarCollapsed = useUiStore((state) => state.setSidebarCollapsed);
  const [isSimulationFocused, setIsSimulationFocused] = useState(false);
  const {
    activeTab,
    setActiveTab,
    selectedExercise,
    simulationExercise,
    selectExercise,
    openInSimulation,
  } = useExerciseTabs();

  const handleToggleSimulationFocus = () => {
    setIsSimulationFocused((prev) => {
      const next = !prev;
      if (next) {
        setSidebarCollapsed(true);
      }
      return next;
    });
  };

  const handleTabChange = (tab: ModuleTabId) => {
    setActiveTab(tab);
    if (tab !== "simulation") {
      setIsSimulationFocused(false);
    }
  };

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out",
        isSimulationFocused ? "p-4 md:p-5" : "p-8",
      )}
    >
      {!isSimulationFocused && (
        <PageIntro title={tk(titleKey)} description={tk(descriptionKey)} />
      )}

      <TabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={tabs}
      />

      {activeTab === "overview" && <OverviewTab />}

      {activeTab === "exercises" && (
        <ExercisesTab
          selectedExercise={selectedExercise}
          onSelectExercise={selectExercise}
          onOpenExerciseInSimulation={openInSimulation}
        />
      )}

      {activeTab === "examples" && <ExamplesTab />}

      {activeTab === "simulation" && (
        <SimulationTab
          selectedExercise={simulationExercise}
          isFocused={isSimulationFocused}
          onToggleFocus={handleToggleSimulationFocus}
        />
      )}
    </div>
  );
}
