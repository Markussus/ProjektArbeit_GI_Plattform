import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { FASimulator } from "./Simulator/FASimulator";
import { FAExerciseWorkspacePanel } from "./Simulator/presentation/FAExerciseWorkspacePanel";
import type { FAProgram } from "./Simulator/domain/faTypes";
import { findFAExercise } from "../exercises/faExerciseDefinitions";
import { useFASimulatorStore } from "../store/faSimulatorStore";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const activeExerciseId = useFASimulatorStore((s) => s.activeExerciseId);
  const setActiveExercise = useFASimulatorStore((s) => s.setActiveExercise);
  const studentProgram = useFASimulatorStore((s) => s.studentProgram);
  const loadExample = useFASimulatorStore((s) => s.loadExample);
  const setPendingInputWord = useFASimulatorStore((s) => s.setPendingInputWord);

  const activeExercise = activeExerciseId
    ? findFAExercise(activeExerciseId)
    : undefined;

  // The FA panel above is the only "selected exercise" display we use here.
  // Suppress the shared workspace card unconditionally so closing an exercise
  // doesn't leak the parent's last-selected exercise back into view.
  const selectedExercise = null;

  const handleLoadSolution = (solution: FAProgram) => {
    const seedInput =
      activeExercise?.exampleWords?.accept.find((w) => w.length > 0) ?? "";
    loadExample(solution, seedInput);
  };

  const handleExitExercise = () => {
    setActiveExercise(null);
  };

  return (
    <div className="space-y-4">
      {activeExercise && (
        // key forces a fresh mount when switching between exercises, so the
        // panel's local hint/solution state never carries over.
        <FAExerciseWorkspacePanel
          key={activeExercise.id}
          exercise={activeExercise}
          studentProgram={studentProgram ?? activeExercise.starter}
          onLoadSolution={handleLoadSolution}
          onLoadExampleWord={setPendingInputWord}
          onExit={handleExitExercise}
        />
      )}
      <TopicSimulationTab
        {...props}
        selectedExercise={selectedExercise}
        emptyStateTextKey="simulation.emptyStates.automata"
      >
        <FASimulator />
      </TopicSimulationTab>
    </div>
  );
}
