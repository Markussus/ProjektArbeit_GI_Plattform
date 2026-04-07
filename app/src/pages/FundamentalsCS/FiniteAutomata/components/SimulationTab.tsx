import type { ModuleSimulationTabProps } from "@/features/modules/ModuleTopicPage";
import { TopicSimulationTab } from "@/features/modules/TopicSimulationTab";

export function SimulationTab(props: ModuleSimulationTabProps) {
  return (
    <TopicSimulationTab
      {...props}
      emptyStateTextKey="simulation.emptyStates.automata"
    />
  );
}
