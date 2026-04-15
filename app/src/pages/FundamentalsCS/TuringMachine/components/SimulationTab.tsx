import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { TMSimulator } from "./Simulator/TMSimulator.tsx";

export function SimulationTab(props: ModuleSimulationTabProps) {
  return (
    <TopicSimulationTab
      {...props}
      emptyStateTextKey="simulation.emptyStates.turing"
    >
      <TMSimulator />
    </TopicSimulationTab>
  );
}
