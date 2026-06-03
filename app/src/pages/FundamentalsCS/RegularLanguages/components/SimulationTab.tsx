import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { findRLExercise } from "../exercises/rlExerciseDefinitions";
import { useRLSimulatorStore } from "../store/rlSimulatorStore";
import { RLSimulator } from "./Simulator/RLSimulator";
import { RLExerciseWorkspacePanel } from "./Simulator/presentation/RLExerciseWorkspacePanel";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const activeExerciseId = useRLSimulatorStore((s) => s.activeExerciseId);
  const setActiveExercise = useRLSimulatorStore((s) => s.setActiveExercise);
  const loadScenario = useRLSimulatorStore((s) => s.loadScenario);

  const activeExercise = activeExerciseId
    ? findRLExercise(activeExerciseId)
    : undefined;

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
          onExit={() => setActiveExercise(null)}
        />
      )}
      <TopicSimulationTab
        {...props}
        // The workspace panel above is our exercise header; suppress the
        // shared one so it isn't duplicated.
        selectedExercise={null}
        emptyStateTextKey="simulation.emptyStates.regularLanguages"
      >
        <RLSimulator />
      </TopicSimulationTab>
    </div>
  );
}
