import { useEffect } from "react";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { FASimulator } from "./Simulator/FASimulator";
import { FAExerciseWorkspacePanel } from "./Simulator/presentation/FAExerciseWorkspacePanel";
import type { FAProgram } from "./Simulator/domain/faTypes";
import { findFAExercise } from "../exercises/faExerciseDefinitions";
import { useFASimulatorStore } from "../store/faSimulatorStore";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const setActiveExercise = useFASimulatorStore((s) => s.setActiveExercise);
  const studentProgram = useFASimulatorStore((s) => s.studentProgram);
  const loadExample = useFASimulatorStore((s) => s.loadExample);
  const setPendingInputWord = useFASimulatorStore((s) => s.setPendingInputWord);

  // Drive the exercise panel from the page-level selection rather than a
  // separate store flag. The page clears `selectedExercise` whenever the
  // exercise is exited, a tab switch is confirmed, or an example is opened in
  // its place — so the workspace panel never lingers behind those actions.
  const activeExercise = props.selectedExercise
    ? findFAExercise(props.selectedExercise.id)
    : undefined;

  // Keep the store flag in sync so other store consumers (e.g. solution
  // seeding) agree with what is actually displayed.
  useEffect(() => {
    setActiveExercise(activeExercise?.id ?? null);
  }, [activeExercise?.id, setActiveExercise]);

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
    props.onExitExercise?.();
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
        // While an exercise is active the workspace panel above is its header,
        // so suppress the shared "Selected exercise" card to avoid showing it
        // twice. Examples still fall through to the shared card.
        selectedItem={activeExercise ? null : props.selectedItem}
        emptyStateTextKey="simulation.emptyStates.automata"
      >
        <FASimulator />
      </TopicSimulationTab>
    </div>
  );
}
