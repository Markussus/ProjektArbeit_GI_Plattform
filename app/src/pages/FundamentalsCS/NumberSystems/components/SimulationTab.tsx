import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { Simulator } from "./simulator/Simulator";

export function SimulationTab(props: ModuleSimulationTabProps) {
  return (
    <TopicSimulationTab
      {...props}
      emptyStateTextKey="simulation.emptyStates.number"
    >
      <Simulator
        selectedExercise={props.selectedExercise}
        onExitExercise={props.onExitExercise}
      />
    </TopicSimulationTab>
  );
}
