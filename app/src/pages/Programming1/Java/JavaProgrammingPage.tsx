import { ModuleTopicPage } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { ExamplesTab } from "./components/ExamplesTab";
import { ExercisesTab } from "./components/ExercisesTab";
import { OverviewTab } from "./components/OverviewTab";
import { SimulationTab } from "./components/SimulationTab";
import { JavaExecutionProvider } from "./components/Simulator/application/JavaExecutionContext";

export function JavaProgrammingPage() {
  return (
    <JavaExecutionProvider>
      <ModuleTopicPage
        testId="java-topic-page"
        titleKey="java.title"
        descriptionKey="java.description"
        overviewTab={OverviewTab}
        exercisesTab={ExercisesTab}
        examplesTab={ExamplesTab}
        simulationTab={SimulationTab}
        confirmExerciseTabExit={false}
        clearSimulationSelectionOnTabExit
      />
    </JavaExecutionProvider>
  );
}
