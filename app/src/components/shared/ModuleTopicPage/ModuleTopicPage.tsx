import type { ComponentType } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageIntro } from "@/components/shared/PageIntro/PageIntro";
import { TabNavigation } from "@/components/shared/TabNavigation/TabNavigation";
import { useExerciseTabs, type ModuleTabId } from "@/hooks/useExerciseTabs";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog/ConfirmDialog";
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
  onOpenExampleInSimulation?: (exercise: Exercise) => void;
}

export interface ModuleSimulationTabProps {
  selectedExercise: Exercise | null;
  isFocused: boolean;
  onToggleFocus: () => void;
  /** Callback um den Übungsmodus vollständig zu verlassen (setzt simulationExercise auf null) */
  onExitExercise?: () => void;
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

  // Tab-Wechsel Confirm Dialog state
  const [showTabExitConfirm, setShowTabExitConfirm] = useState(false);
  const [pendingTab, setPendingTab] = useState<ModuleTabId | null>(null);

  const {
    activeTab,
    setActiveTab,
    selectedExercise,
    simulationExercise,
    selectExercise,
    openInSimulation,
    clearSimulationExercise,
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

  /** Verlässt den Übungsmodus: räumt simulationExercise + selectedExercise auf */
  const handleExitExercise = () => {
    clearSimulationExercise();
  };

  /**
   * Tab-Klick Handler.
   * - Wenn Übung aktiv und User auf einen anderen Tab wechseln will → Warnung.
   * - Wenn User den aktiven Simulation-Tab nochmal tippt während Übung aktiv → Warnung zum Verlassen.
   */
  const handleTabChange = (tab: ModuleTabId) => {
    const exerciseIsActive =
      !!simulationExercise && !simulationExercise.id.includes(".example");

    if (exerciseIsActive && tab !== activeTab) {
      // Wechsel zu anderem Tab – Warnung
      setPendingTab(tab);
      setShowTabExitConfirm(true);
      return;
    }

    if (exerciseIsActive && tab === activeTab && tab === "simulation") {
      // Simulation-Tab nochmal anklicken während Übung aktiv → Verlassen-Warnung
      setPendingTab(null);
      setShowTabExitConfirm(true);
      return;
    }

    applyTabChange(tab);
  };

  const applyTabChange = (tab: ModuleTabId) => {
    setActiveTab(tab);
    if (tab !== "simulation") {
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
      return <ExamplesTab onOpenExampleInSimulation={openInSimulation} />;
    }

    if (activeTab === "simulation") {
      return (
        <SimulationTab
          selectedExercise={simulationExercise}
          isFocused={isSimulationFocused}
          onToggleFocus={handleToggleSimulationFocus}
          onExitExercise={simulationExercise ? handleExitExercise : undefined}
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

      {/* Übungsmodus-Verlassen Bestätigungsdialog (Tab-Wechsel) */}
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
      />
    </div>
  );
}
