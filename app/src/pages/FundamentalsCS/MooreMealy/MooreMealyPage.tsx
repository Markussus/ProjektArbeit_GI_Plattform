import { ModuleTopicPage } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { ExamplesTab } from "./components/ExamplesTab";
import { ExercisesTab } from "./components/ExercisesTab";
import { OverviewTab } from "./components/OverviewTab";
import { SimulationTab } from "./components/SimulationTab";

export function MooreMealyPage() {
  return (
    <ModuleTopicPage
      titleKey="moore.title"
      descriptionKey="moore.description"
      overviewTab={OverviewTab}
      exercisesTab={ExercisesTab}
      examplesTab={ExamplesTab}
      simulationTab={SimulationTab}
      confirmExerciseTabExit={false}
      clearSimulationSelectionOnTabExit
    />
  );
}
