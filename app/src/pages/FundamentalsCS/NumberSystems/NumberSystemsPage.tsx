import { ModuleTopicPage } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { ExamplesTab } from "./components/ExamplesTab";
import { ExercisesTab } from "./components/ExercisesTab";
import { OverviewTab } from "./components/OverviewTab";
import { SimulationTab } from "./components/SimulationTab";

// Exported because moduleCatalog.tsx loads this component dynamically via
// `(await import(".../NumberSystemsPage")).NumberSystemsPage`.
export function NumberSystemsPage() {
  return (
    <ModuleTopicPage
      titleKey="number-systems.title"
      descriptionKey="number-systems.description"
      overviewTab={OverviewTab}
      exercisesTab={ExercisesTab}
      examplesTab={ExamplesTab}
      simulationTab={SimulationTab}
    />
  );
}
