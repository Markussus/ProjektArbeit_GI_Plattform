import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader/PageHeader";
import { TabNavigation } from "@/components/shared/TabNavigation/TabNavigation";
import type { Exercise } from "@/components/shared/ExerciseCard/ExerciseCard";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import { OverviewTab } from "./components/OverviewTab";
import { ExercisesTab } from "./components/ExercisesTab";
import { ExamplesTab } from "./components/ExamplesTab";
import { SimulationTab } from "./components/SimulationTab";

export function NumberSystemsPage() {
  const { t } = useTranslation();
  const setSidebarCollapsed = useUiStore((state) => state.setSidebarCollapsed);

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [simulationExercise, setSimulationExercise] = useState<Exercise | null>(
    null,
  );
  const [isSimulationFocused, setIsSimulationFocused] = useState(false);

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise((prev) =>
      prev?.title === exercise.title ? null : exercise,
    );
  };

  const handleOpenExerciseInSimulation = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setSimulationExercise(exercise);
    setActiveTab("simulation");
  };

  const handleToggleSimulationFocus = () => {
    setIsSimulationFocused((prev) => {
      const next = !prev;
      if (next) {
        setSidebarCollapsed(true);
      }
      return next;
    });
  };

  const handleTabChange = (tab: string) => {
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
        <PageHeader
          title={t("number.title")}
          description={t("number.description")}
        />
      )}

      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === "overview" && <OverviewTab />}

      {activeTab === "exercises" && (
        <ExercisesTab
          selectedExercise={selectedExercise}
          onSelectExercise={handleSelectExercise}
          onOpenExerciseInSimulation={handleOpenExerciseInSimulation}
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
