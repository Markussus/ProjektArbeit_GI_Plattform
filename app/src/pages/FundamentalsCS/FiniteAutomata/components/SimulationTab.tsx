import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog/ConfirmDialog";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { SolutionCheckDialog } from "@/components/shared/SolutionCheckDialog";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { FASimulator, type FASimulatorHandle } from "./Simulator/FASimulator";
import type { FAProgram } from "./Simulator/domain/faTypes";
import {
  validateAgainstSolution,
  type ValidationResult,
} from "./Simulator/domain/faExerciseValidation";
import { findFAExercise } from "../exercises/faExerciseDefinitions";
import { useFASimulatorStore } from "../store/faSimulatorStore";

type CheckResult = ValidationResult | "unbuilt";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const { t } = useTranslation();
  const setActiveExercise = useFASimulatorStore((s) => s.setActiveExercise);
  const loadExample = useFASimulatorStore((s) => s.loadExample);
  const simulatorRef = useRef<FASimulatorHandle>(null);

  // The opened exercise (if any) drives the action buttons. Examples still flow
  // through the shared "Selected example" card with no actions.
  const activeExercise = props.selectedExercise
    ? findFAExercise(props.selectedExercise.id)
    : undefined;

  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  // Revealing the solution overwrites whatever the learner has built, so it
  // asks first.
  const [confirmLoadSolution, setConfirmLoadSolution] = useState(false);

  // Keep the store flag in sync so other consumers agree with what is shown.
  useEffect(() => {
    setActiveExercise(activeExercise?.id ?? null);
  }, [activeExercise?.id, setActiveExercise]);

  const handleLoadSolution = () => {
    setConfirmLoadSolution(false);
    if (!activeExercise) {
      return;
    }
    const seedInput =
      activeExercise.exampleWords?.accept.find((w) => w.length > 0) ?? "";
    loadExample(activeExercise.solution, seedInput);
  };

  const handleCheckSolution = () => {
    if (!activeExercise) {
      return;
    }
    const studentProgram =
      useFASimulatorStore.getState().studentProgram ?? activeExercise.starter;

    if (isUnbuilt(studentProgram)) {
      setCheckResult("unbuilt");
      return;
    }

    setCheckResult(
      validateAgainstSolution(studentProgram, activeExercise.solution, {
        maxLen: activeExercise.maxTestLen ?? 4,
      }),
    );
  };

  const headerActions = activeExercise ? (
    <>
      <button
        type="button"
        onClick={() => setConfirmLoadSolution(true)}
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
        onReset={() => simulatorRef.current?.resetStoredState()}
      >
        <FASimulator ref={simulatorRef} />
      </TopicSimulationTab>

      <SolutionCheckDialog
        open={checkResult !== null}
        title={t("finite-automata.exerciseWorkspace.check")}
        onClose={() => setCheckResult(null)}
        testId="fa-solution-check-dialog"
        summary={checkResult && <CheckSummary result={checkResult} />}
        tableTestIdPrefix="fa-solution-check-table"
        headers={[]}
        rows={[]}
      />

      <ConfirmDialog
        isOpen={confirmLoadSolution}
        title={t("finite-automata.exerciseWorkspace.confirmTitle")}
        description={t("finite-automata.exerciseWorkspace.confirmBody")}
        confirmLabel={t("finite-automata.exerciseWorkspace.confirmYes")}
        cancelLabel={t("finite-automata.exerciseWorkspace.confirmNo")}
        onConfirm={handleLoadSolution}
        onCancel={() => setConfirmLoadSolution(false)}
        variant="warning"
        testId="fa-load-solution-confirm"
      />
    </>
  );
}

/** A "fresh starter" automaton has no accept states and no transitions. */
function isUnbuilt(program: FAProgram): boolean {
  const noAccept = program.acceptStates.length === 0;
  const noTransitions = Object.values(program.transitions).every(
    (row) => Object.keys(row).length === 0,
  );
  return noAccept && noTransitions;
}

function CheckSummary({ result }: { result: CheckResult }) {
  const { t } = useTranslation();

  if (result === "unbuilt") {
    return (
      <div>
        <p className="text-foreground text-sm font-semibold">
          {t("finite-automata.exerciseWorkspace.unbuiltTitle")}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("finite-automata.exerciseWorkspace.unbuiltBody")}
        </p>
      </div>
    );
  }

  if (result.structuralIssues.length > 0) {
    return (
      <div>
        <p className="text-destructive text-sm font-semibold">
          {t("finite-automata.exerciseWorkspace.structuralFail")}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("finite-automata.exerciseWorkspace.structuralHint")}
        </p>
      </div>
    );
  }

  if (result.passed) {
    return (
      <div>
        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
          {t("finite-automata.exerciseWorkspace.passed")}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("finite-automata.exerciseWorkspace.passedDetail", {
            n: result.passedCount,
            total: result.total,
          })}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-destructive text-sm font-semibold">
        {t("finite-automata.exerciseWorkspace.failed")}
      </p>
      <p className="text-muted-foreground mt-1 text-sm">
        {t("finite-automata.exerciseWorkspace.failedDetail", {
          passed: result.passedCount,
          total: result.total,
          failed: result.failedCount,
        })}
      </p>
      {result.firstFailure && (
        <p className="text-muted-foreground mt-2 text-sm">
          {t("finite-automata.exerciseWorkspace.counterexample")}{" "}
          <span className="text-foreground font-mono">
            {result.firstFailure.word === "" ? "ε" : result.firstFailure.word}
          </span>{" "}
          ({t("finite-automata.exerciseWorkspace.expected")}{" "}
          {result.firstFailure.expected
            ? t("finite-automata.exerciseWorkspace.accept")
            : t("finite-automata.exerciseWorkspace.reject")}
          , {t("finite-automata.exerciseWorkspace.got")}{" "}
          {result.firstFailure.got
            ? t("finite-automata.exerciseWorkspace.accept")
            : t("finite-automata.exerciseWorkspace.reject")}
          )
        </p>
      )}
    </div>
  );
}
