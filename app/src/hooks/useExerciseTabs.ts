import { useState } from "react";
import type { Example, Exercise, TopicItem } from "@/types/exercise";

export type ModuleTabId = "overview" | "exercises" | "examples" | "simulation";

export function useExerciseTabs(initialTab: ModuleTabId = "overview") {
  const [activeTab, setActiveTab] = useState<ModuleTabId>(initialTab);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [selectedExample, setSelectedExample] = useState<Example | null>(null);
  const [simulationExercise, setSimulationExercise] = useState<Exercise | null>(
    null,
  );
  const [simulationItem, setSimulationItem] = useState<TopicItem | null>(null);

  const selectExercise = (exercise: Exercise) => {
    // A stable exercise id avoids losing the selection when labels change due to i18n.
    setSelectedExercise((prev) => (prev?.id === exercise.id ? null : exercise));
  };

  const openInSimulation = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setSimulationExercise(exercise);
    setSimulationItem(exercise);
    setActiveTab("simulation");
  };

  const selectExample = (example: Example) => {
    setSelectedExample((prev) => (prev?.id === example.id ? null : example));
  };

  const openExampleInSimulation = (example: Example) => {
    setSelectedExample(example);
    setSimulationItem(example);
    setSimulationExercise(null);
    setActiveTab("simulation");
  };

  const clearSimulationExercise = () => {
    setSimulationExercise(null);
    setSelectedExercise(null);
  };

  const clearSimulationItem = () => {
    setSimulationItem(null);
    setSelectedExample(null);
  };

  const clearSimulationSelection = () => {
    setSelectedExercise(null);
    setSelectedExample(null);
    setSimulationExercise(null);
    setSimulationItem(null);
  };

  return {
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
  };
}
