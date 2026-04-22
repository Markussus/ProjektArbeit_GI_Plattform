import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { JavaMonacoEditor } from "./JavaMonacoEditor";

export function SimulationTab(props: ModuleSimulationTabProps) {
  return (
    <TopicSimulationTab
      {...props}
      emptyStateTextKey="simulation.emptyStates.java"
    >
      <JavaMonacoEditor
        selectedExercise={props.selectedExercise}
        isFocused={props.isFocused}
      />
    </TopicSimulationTab>
  );
}
