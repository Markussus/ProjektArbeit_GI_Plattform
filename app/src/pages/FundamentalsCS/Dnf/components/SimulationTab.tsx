import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { DnfSimulator } from "./DnfSimulator";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const selectedExercise = props.selectedExercise;
  const selectedExample =
    props.selectedItem?.kind === "example" ? props.selectedItem : null;

  return (
    <TopicSimulationTab
      {...props}
      emptyStateTextKey="simulation.emptyStates.dnf"
    >
      <DnfSimulator
        key={selectedExercise?.id ?? selectedExample?.id ?? "free-mode"}
        selectedExercise={selectedExercise}
        selectedExample={selectedExample}
        onExitExercise={props.onExitExercise}
        onExitExample={props.onExitExample}
      />
    </TopicSimulationTab>
  );
}
