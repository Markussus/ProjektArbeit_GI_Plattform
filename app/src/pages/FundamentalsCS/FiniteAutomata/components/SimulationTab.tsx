import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { SolutionCheckDialog } from "@/components/shared/SolutionCheckDialog";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import {
  FASimulator,
  type FASimulatorHandle,
  type FACheckResult,
} from "./Simulator/FASimulator";
import { findFAExercise } from "../exercises/faExerciseDefinitions";
import { findFAExample } from "./Simulator/config/faExamples";
import { FACheckSummary } from "./FACheckSummary";

/** Simulation tab: the simulator plus an exercise's header buttons. */
export function SimulationTab(props: ModuleSimulationTabProps) {
  const { t } = useTranslation();
  const simulatorRef = useRef<FASimulatorHandle>(null);

  const activeExercise = useMemo(
    () =>
      props.selectedExercise ? findFAExercise(props.selectedExercise.id) : null,
    [props.selectedExercise],
  );

  const activeExample = useMemo(
    () => (props.selectedItem ? findFAExample(props.selectedItem.id) : null),
    [props.selectedItem],
  );

  const [checkResult, setCheckResult] = useState<FACheckResult | null>(null);

  const handleLoadSolution = () => {
    simulatorRef.current?.loadSolution();
  };

  const handleCheckSolution = () => {
    const result = simulatorRef.current?.checkSolution();
    if (result) {
      setCheckResult(result);
    }
  };

  const headerActions = activeExercise ? (
    <>
      <button
        type="button"
        onClick={handleLoadSolution}
        data-testid="fa-load-solution"
        className="border-border bg-background text-foreground hover:bg-muted inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium"
      >
        {t("finite-automata.exerciseWorkspace.showSolution")}
      </button>
      <button
        type="button"
        onClick={handleCheckSolution}
        data-testid="fa-check-solution"
        className="bg-brand text-brand-foreground inline-flex items-center rounded-md px-3 py-2 text-sm font-medium hover:opacity-90"
      >
        {t("finite-automata.exerciseWorkspace.check")}
      </button>
    </>
  ) : null;

  return (
    <>
      <TopicSimulationTab
        {...props}
        selectedItem={props.selectedItem}
        selectedItemActions={headerActions}
        emptyStateTextKey="common.simulation.emptyStates.automata"
        onReset={() => {
          setCheckResult(null);
          simulatorRef.current?.resetStoredState();
        }}
      >
        <FASimulator
          key={activeExercise?.id ?? activeExample?.id ?? "__fa-free-mode__"}
          ref={simulatorRef}
          exercise={activeExercise}
          example={activeExample}
        />
      </TopicSimulationTab>

      <SolutionCheckDialog
        open={checkResult !== null}
        title={t("finite-automata.exerciseWorkspace.check")}
        onClose={() => setCheckResult(null)}
        testId="fa-solution-check-dialog"
        summary={checkResult && <FACheckSummary result={checkResult} />}
        tableTestIdPrefix="fa-solution-check-table"
        headers={[]}
        rows={[]}
      />
    </>
  );
}
