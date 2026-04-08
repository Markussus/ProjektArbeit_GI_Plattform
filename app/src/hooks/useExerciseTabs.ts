import { useState } from "react";
import type { Exercise } from "@/types/exercise";

export type ModuleTabId = "overview" | "exercises" | "examples" | "simulation";

export function useExerciseTabs(initialTab: ModuleTabId = "overview") {
  const [activeTab, setActiveTab] = useState<ModuleTabId>(initialTab);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [simulationExercise, setSimulationExercise] = useState<Exercise | null>(
    null,
  );

  const selectExercise = (exercise: Exercise) => {
    setSelectedExercise((prev) =>
      prev?.title === exercise.title ? null : exercise,
    );
  };

  const openInSimulation = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setSimulationExercise(exercise);
    setActiveTab("simulation");
  };

  return {
    activeTab,
    setActiveTab,
    selectedExercise,
    simulationExercise,
    selectExercise,
    openInSimulation,
  };
}
