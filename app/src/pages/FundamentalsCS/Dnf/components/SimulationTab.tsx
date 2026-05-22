import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { DnfSimulator } from "./DnfSimulator";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const selectedExercise = props.selectedExercise;

  return (
    <TopicSimulationTab
      {...props}
      emptyStateTextKey="simulation.emptyStates.dnf"
    >
      <DnfSimulator
        selectedExercise={selectedExercise}
        onExitExercise={props.onExitExercise}
      />
    </TopicSimulationTab>
  );
}
