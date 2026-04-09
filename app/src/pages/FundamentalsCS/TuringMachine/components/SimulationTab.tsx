import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { DemoSimulator } from "./Simulator/DemoSimulator";

export function SimulationTab(props: ModuleSimulationTabProps) {
  return (
    <TopicSimulationTab
      {...props}
      emptyStateTextKey="simulation.emptyStates.turing"
    >
      <DemoSimulator />
    </TopicSimulationTab>
  );
}
