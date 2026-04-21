import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { DnfBuilder } from "./DnfBuilder/DnfBuilder";

export function SimulationTab(props: ModuleSimulationTabProps) {
  return (
    <TopicSimulationTab
      {...props}
      emptyStateTextKey="simulation.emptyStates.dnf"
    >
      <DnfBuilder selectedExercise={props.selectedExercise} />
    </TopicSimulationTab>
  );
}
