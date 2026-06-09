import type { ComponentType } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageIntro } from "@/components/shared/PageIntro/PageIntro";
import { TabNavigation } from "@/components/shared/TabNavigation/TabNavigation";
import { useExerciseTabs, type ModuleTabId } from "@/hooks/useExerciseTabs";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog/ConfirmDialog";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import type { Example, Exercise, TopicItem } from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";

export interface ModuleExercisesTabProps {
  selectedExercise: Exercise | null;
  onSelectExercise: (exercise: Exercise) => void;
  onOpenExerciseInSimulation: (exercise: Exercise) => void;
}

export interface ModuleExamplesTabProps {
  selectedExample: Example | null;
  onSelectExample: (example: Example) => void;
  onOpenExampleInSimulation: (example: Example) => void;
}

export interface ModuleSimulationTabProps {
  selectedExercise: Exercise | null;
  selectedItem?: TopicItem | null;
  isFocused: boolean;
  onToggleFocus: () => void;
  onExitExercise?: () => void;
  onExitExample?: () => void;
}

interface ModuleTopicPageProps {
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  overviewTab: ComponentType;
  exercisesTab: ComponentType<ModuleExercisesTabProps>;
  examplesTab: ComponentType<ModuleExamplesTabProps>;
  simulationTab: ComponentType<ModuleSimulationTabProps>;
  tabs?: ModuleTabId[];
  testId?: string;
}

export function ModuleTopicPage({
  titleKey,
  descriptionKey,
  overviewTab: OverviewTab,
  exercisesTab: ExercisesTab,
  examplesTab: ExamplesTab,
  simulationTab: SimulationTab,
  tabs,
  testId,
}: ModuleTopicPageProps) {
  const { t } = useTranslation();
  const setSidebarCollapsed = useUiStore((state) => state.setSidebarCollapsed);
  const [isSimulationFocused, setIsSimulationFocused] = useState(false);

  const [showTabExitConfirm, setShowTabExitConfirm] = useState(false);
  const [pendingTab, setPendingTab] = useState<ModuleTabId | null>(null);

  const {
    activeTab,
    setActiveTab,
    selectedExercise,
    selectedExample,
    simulationExercise,
    simulationItem,
    selectExercise,
    openInSimulation,
    selectExample,
    openExampleInSimulation,
    clearSimulationExercise,
    clearSimulationItem,
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

  const handleExitExercise = () => {
    clearSimulationExercise();
  };

  const handleTabChange = (tab: ModuleTabId) => {
    const exerciseIsActive =
      !!simulationExercise && !simulationExercise.id.includes(".example");

    if (exerciseIsActive && tab !== activeTab) {
      setPendingTab(tab);
      setShowTabExitConfirm(true);
      return;
    }

    if (exerciseIsActive && tab === activeTab && tab === "simulation") {
      setPendingTab(null);
      setShowTabExitConfirm(true);
      return;
    }

    applyTabChange(tab);
  };

  const applyTabChange = (tab: ModuleTabId) => {
    setActiveTab(tab);
    if (tab !== "simulation") {
      // Leaving the simulation tab should always restore the regular page layout.
      setIsSimulationFocused(false);
    }
  };

  const handleTabExitConfirm = () => {
    setShowTabExitConfirm(false);
    clearSimulationExercise();
    const target = pendingTab ?? activeTab;
    setPendingTab(null);
    applyTabChange(target);
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
          selectedExample={selectedExample}
          onSelectExample={selectExample}
          onOpenExampleInSimulation={openExampleInSimulation}
        />
      );
    }

    if (activeTab === "simulation") {
      return (
        <SimulationTab
          selectedExercise={simulationExercise}
          selectedItem={simulationItem}
          isFocused={isSimulationFocused}
          onToggleFocus={handleToggleSimulationFocus}
          onExitExercise={simulationExercise ? handleExitExercise : undefined}
          onExitExample={
            simulationItem && !simulationExercise
              ? clearSimulationItem
              : undefined
          }
        />
      );
    }

    return null;
  };

  return (
    <div
      data-testid={testId}
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

      <ConfirmDialog
        isOpen={showTabExitConfirm}
        title={t("simulator.validation.exitTabTitle")}
        description={t("simulator.validation.exitTabDesc")}
        confirmLabel={t("simulator.validation.exitTabConfirm")}
        onConfirm={handleTabExitConfirm}
        onCancel={() => {
          setShowTabExitConfirm(false);
          setPendingTab(null);
        }}
        variant="warning"
        testId="module-tab-exit-confirm"
      />
    </div>
  );
}
