import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { ExpressionBuilder } from "./ExpressionBuilder/ExpressionBuilder";
import { DnfBuilder } from "./DnfBuilder/DnfBuilder";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const selectedExercise = props.selectedExercise;

  return (
    <TopicSimulationTab
      {...props}
      emptyStateTextKey="simulation.emptyStates.dnf"
    >
      {selectedExercise ? (
        <DnfBuilder
          key={selectedExercise.id}
          selectedExercise={selectedExercise}
        />
      ) : (
        <ExpressionBuilder key="free-expr" />
      )}
    </TopicSimulationTab>
  );
}
