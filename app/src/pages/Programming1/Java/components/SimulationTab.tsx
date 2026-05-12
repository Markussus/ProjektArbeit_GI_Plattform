import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { JavaSimulator } from "./Simulator/JavaSimulator";

export function SimulationTab(props: ModuleSimulationTabProps) {
  return (
    <TopicSimulationTab
      {...props}
      emptyStateTextKey="simulation.emptyStates.java"
    >
      <JavaSimulator
        selectedExercise={props.selectedExercise}
        isFocused={props.isFocused}
      />
    </TopicSimulationTab>
  );
}
