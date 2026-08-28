import { useCallback, useRef, useState } from "react";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { Simulator, type SimulatorHandle } from "./simulator/Simulator";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const simulatorRef = useRef<SimulatorHandle | null>(null);
  const [isSimulatorReady, setIsSimulatorReady] = useState(false);

  const handleReset = () => {
    simulatorRef.current?.resetStoredState();
  };

  const handleSimulatorRef = useCallback((handle: SimulatorHandle | null) => {
    simulatorRef.current = handle;
    setIsSimulatorReady(handle !== null);
  }, []);

  return (
    <TopicSimulationTab
      {...props}
      emptyStateTextKey="common.simulation.emptyStates.number"
      onReset={handleReset}
      resetDisabled={!isSimulatorReady}
    >
      <Simulator
        ref={handleSimulatorRef}
        selectedExercise={props.selectedExercise ?? props.selectedItem}
        onExitExercise={props.onExitExercise}
      />
    </TopicSimulationTab>
  );
}
