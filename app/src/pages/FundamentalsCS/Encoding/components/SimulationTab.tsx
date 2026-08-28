import { useCallback, useRef, useState } from "react";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import {
  EncoderSimulator,
  type EncoderSimulatorHandle,
} from "../simulator/EncoderSimulator";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const simulatorRef = useRef<EncoderSimulatorHandle | null>(null);
  const [isSimulatorReady, setIsSimulatorReady] = useState(false);

  const handleReset = () => {
    simulatorRef.current?.resetStoredState();
  };

  const handleSimulatorRef = useCallback(
    (handle: EncoderSimulatorHandle | null) => {
      simulatorRef.current = handle;
      setIsSimulatorReady(handle !== null);
    },
    [],
  );

  return (
    <TopicSimulationTab
      {...props}
      emptyStateTextKey="common.simulation.emptyStates.encoding"
      onReset={handleReset}
      resetDisabled={!isSimulatorReady}
    >
      <EncoderSimulator
        ref={handleSimulatorRef}
        selectedExercise={props.selectedExercise ?? props.selectedItem}
        onExitExercise={props.onExitExercise}
      />
    </TopicSimulationTab>
  );
}
