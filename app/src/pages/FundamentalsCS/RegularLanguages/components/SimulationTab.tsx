import { useEffect } from "react";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { findRLExercise } from "../exercises/rlExerciseDefinitions";
import { useRLSimulatorStore } from "../store/rlSimulatorStore";
import { RLSimulator } from "./Simulator/RLSimulator";
import { RLExerciseWorkspacePanel } from "./Simulator/presentation/RLExerciseWorkspacePanel";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const setActiveExercise = useRLSimulatorStore((s) => s.setActiveExercise);
  const loadScenario = useRLSimulatorStore((s) => s.loadScenario);

  // Drive the exercise panel from the page-level selection rather than a
  // separate store flag, so it never lingers after the exercise is exited, a
  // tab switch is confirmed, or an example is opened in its place.
  const activeExercise = props.selectedExercise
    ? findRLExercise(props.selectedExercise.id)
    : undefined;

  // Keep the store flag in sync with what is actually displayed.
  useEffect(() => {
    setActiveExercise(activeExercise?.id ?? null);
  }, [activeExercise?.id, setActiveExercise]);

  // Reveal: load the worked input into the simulator so it derives the answer
  // (grammar → enumerated language, or language → derived grammar).
  const handleLoadSolution = () => {
    if (!activeExercise) return;
    loadScenario({ mode: activeExercise.mode, ...activeExercise.seed });
  };

  return (
    <div className="space-y-4">
      {activeExercise && (
        // key forces a fresh mount when switching exercises, so the panel's
        // local hint/solution state never carries over.
        <RLExerciseWorkspacePanel
          key={activeExercise.id}
          exercise={activeExercise}
          onLoadSolution={handleLoadSolution}
          onExit={() => {
            setActiveExercise(null);
            props.onExitExercise?.();
          }}
        />
      )}
      <TopicSimulationTab
        {...props}
        // The workspace panel above is our exercise header; suppress the
        // shared one so it isn't duplicated.
        selectedExercise={null}
        // Likewise suppress the shared "Selected exercise" card while an
        // exercise is active, so it isn't shown twice. Examples still fall
        // through to the shared card.
        selectedItem={activeExercise ? null : props.selectedItem}
        emptyStateTextKey="simulation.emptyStates.regularLanguages"
      >
        <RLSimulator />
      </TopicSimulationTab>
    </div>
  );
}
