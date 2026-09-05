import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { PageIntro } from "@/components/shared/PageIntro/PageIntro";
import { TabNavigation } from "@/components/shared/TabNavigation/TabNavigation";
import { useExerciseTabs, type ModuleTabId } from "@/hooks/useExerciseTabs";
import { cn } from "@/lib/utils";
import {
  createTrainingCenterExerciseFromImport,
  resolveTrainingCenterImportForPath,
  type TrainingCenterImportRouteState,
} from "@/lib/trainingCenter/trainingCenterImportNavigation";
import { trainingCenterStorage } from "@/lib/trainingCenter";
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
  importedTaskStorageId?: number;
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
  clearSimulationSelectionOnTabExit?: boolean;
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
  clearSimulationSelectionOnTabExit = false,
}: ModuleTopicPageProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const setSidebarCollapsed = useUiStore((state) => state.setSidebarCollapsed);
  const [isSimulationFocused, setIsSimulationFocused] = useState(false);
  const [simulationImport, setSimulationImport] = useState({
    revision: 0,
    taskStorageId: undefined as number | undefined,
  });
  const consumedImportValueRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
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
    clearSimulationSelection,
  } = useExerciseTabs();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const routeState = location.state as TrainingCenterImportRouteState | null;
    const storageValue = routeState?.trainingCenterImport?.storageValue;

    if (!storageValue) {
      consumedImportValueRef.current = null;
      return;
    }

    if (consumedImportValueRef.current === storageValue) {
      return;
    }

    const parsed = resolveTrainingCenterImportForPath(
      location.pathname,
      storageValue,
    );

    if (!parsed) {
      return;
    }

    const exercise = createTrainingCenterExerciseFromImport(parsed, t);
    const importTimeoutId = window.setTimeout(() => {
      consumedImportValueRef.current = storageValue;
      // Unmount the previous simulator first. Its auto-save cleanup must finish
      // before the imported value becomes authoritative on a same-route import.
      clearSimulationSelection();
      setActiveTab("overview");

      window.setTimeout(() => {
        if (!isMountedRef.current) {
          return;
        }

        trainingCenterStorage.store(storageValue);
        setSimulationImport((current) => ({
          revision: current.revision + 1,
          taskStorageId: parsed.taskStorageId,
        }));

        if (exercise) {
          openInSimulation(exercise);
        } else {
          setActiveTab("simulation");
        }

        navigate(location.pathname, { replace: true, state: null });
      }, 0);
    }, 0);

    return () => {
      window.clearTimeout(importTimeoutId);
    };
  }, [
    clearSimulationSelection,
    location.pathname,
    location.state,
    navigate,
    openInSimulation,
    setActiveTab,
    t,
  ]);

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
    applyTabChange(tab);
  };

  const applyTabChange = (tab: ModuleTabId) => {
    if (
      clearSimulationSelectionOnTabExit &&
      activeTab === "simulation" &&
      tab !== "simulation"
    ) {
      clearSimulationSelection();
    }

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
          selectedExample={selectedExample}
          onSelectExample={selectExample}
          onOpenExampleInSimulation={openExampleInSimulation}
        />
      );
    }

    if (activeTab === "simulation") {
      return (
        <SimulationTab
          key={`simulation-import-${simulationImport.revision}`}
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
          importedTaskStorageId={simulationImport.taskStorageId}
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
    </div>
  );
}
