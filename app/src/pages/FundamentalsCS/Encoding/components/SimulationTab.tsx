import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { EncoderSimulator } from "../simulator/EncoderSimulator";

export function SimulationTab(props: ModuleSimulationTabProps) {
  return (
    <TopicSimulationTab
      {...props}
      emptyStateTextKey="simulation.emptyStates.encoding"
    >
      <EncoderSimulator
        selectedExercise={props.selectedExercise ?? props.selectedItem}
        onExitExercise={props.onExitExercise}
      />
    </TopicSimulationTab>
  );
}
