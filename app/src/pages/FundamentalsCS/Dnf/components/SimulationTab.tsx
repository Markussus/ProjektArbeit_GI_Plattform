import { useCallback, useRef, useState } from "react";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { DnfSimulator, type DnfSimulatorHandle } from "./DnfSimulator";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const simulatorRef = useRef<DnfSimulatorHandle | null>(null);
  const [isSimulatorReady, setIsSimulatorReady] = useState(false);
  const selectedExercise = props.selectedExercise;
  const selectedExample =
    props.selectedItem?.kind === "example" ? props.selectedItem : null;
  const handleSimulatorRef = useCallback(
    (handle: DnfSimulatorHandle | null) => {
      simulatorRef.current = handle;
      setIsSimulatorReady(handle !== null);
    },
    [],
  );

  return (
    <TopicSimulationTab
      {...props}
      emptyStateTextKey="simulation.emptyStates.dnf"
      onReset={() => simulatorRef.current?.resetStoredState()}
      resetDisabled={!isSimulatorReady}
    >
      <DnfSimulator
        key={selectedExercise?.id ?? selectedExample?.id ?? "free-mode"}
        ref={handleSimulatorRef}
        selectedExercise={selectedExercise}
        selectedExample={selectedExample}
        onExitExercise={props.onExitExercise}
        onExitExample={props.onExitExample}
      />
    </TopicSimulationTab>
  );
}
