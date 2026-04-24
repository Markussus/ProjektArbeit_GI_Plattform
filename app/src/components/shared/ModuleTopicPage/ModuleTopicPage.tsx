import type { ComponentType } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageIntro } from "@/components/shared/PageIntro/PageIntro";
import { TabNavigation } from "@/components/shared/TabNavigation/TabNavigation";
import { useExerciseTabs, type ModuleTabId } from "@/hooks/useExerciseTabs";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import type { Exercise } from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";

export interface ModuleExercisesTabProps {
  selectedExercise: Exercise | null;
  onSelectExercise: (exercise: Exercise) => void;
  onOpenExerciseInSimulation: (exercise: Exercise) => void;
}

export interface ModuleExamplesTabProps {
  onSwitchToSimulation: () => void;
}

export interface ModuleSimulationTabProps {
  selectedExercise: Exercise | null;
  isFocused: boolean;
  onToggleFocus: () => void;
}

interface ModuleTopicPageProps {
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  overviewTab: ComponentType;
  exercisesTab: ComponentType<ModuleExercisesTabProps>;
  examplesTab: ComponentType<ModuleExamplesTabProps>;
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
        // Focus mode is meant to maximize the workspace, so the sidebar is
        // collapsed proactively instead of waiting for a separate user action.
        setSidebarCollapsed(true);
      }
      return next;
    });
  };

  const handleTabChange = (tab: ModuleTabId) => {
    setActiveTab(tab);
    if (tab !== "simulation") {
      // Leaving the simulation tab should always restore the regular page layout.
      setIsSimulationFocused(false);
    }
  };

  const renderActiveTab = () => {
    if (activeTab === "overview") {
      return <OverviewTab />;
    }

    if (activeTab === "exercises") {
      return (
        <ExercisesTab
          selectedExercise={selectedExercise}
          onSelectExercise={selectExercise}
          onOpenExerciseInSimulation={openInSimulation}
        />
      );
    }

    if (activeTab === "examples") {
      return (
        <ExamplesTab
          onSwitchToSimulation={() => handleTabChange("simulation")}
        />
      );
    }

    if (activeTab === "simulation") {
      return (
        <SimulationTab
          selectedExercise={simulationExercise}
          isFocused={isSimulationFocused}
          onToggleFocus={handleToggleSimulationFocus}
        />
      );
    }

    return null;
  };

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out",
        isSimulationFocused ? "p-4 md:p-5" : "p-8",
      )}
    >
      {!isSimulationFocused && (
        <PageIntro title={t(titleKey)} description={t(descriptionKey)} />
      )}

      <TabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={tabs}
      />

      {renderActiveTab()}
    </div>
  );
}
