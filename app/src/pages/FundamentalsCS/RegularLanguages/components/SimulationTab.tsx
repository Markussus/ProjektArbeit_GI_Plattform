import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { SolutionCheckDialog } from "@/components/shared/SolutionCheckDialog";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import {
  checkLanguageExercise,
  type RLCheckResult,
} from "./Simulator/domain/rlSolutionChecker";
import { findRLExercise } from "../exercises/rlExerciseDefinitions";
import { useRLSimulatorStore } from "../store/rlSimulatorStore";
import { RLSimulator } from "./Simulator/RLSimulator";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const { t } = useTranslation();
  const setActiveExercise = useRLSimulatorStore((s) => s.setActiveExercise);
  const loadScenario = useRLSimulatorStore((s) => s.loadScenario);

  // The opened exercise (if any) drives the action buttons. Examples still flow
  // through the shared "Selected example" card with no actions.
  const activeExercise = props.selectedExercise
    ? findRLExercise(props.selectedExercise.id)
    : undefined;

  const [checkResult, setCheckResult] = useState<RLCheckResult | null>(null);

  // Keep the store flag in sync with what is actually displayed.
  useEffect(() => {
    setActiveExercise(activeExercise?.id ?? null);
  }, [activeExercise?.id, setActiveExercise]);

  // Reveal: load the worked input into the simulator so it derives the answer
  // (grammar → enumerated language, or language → derived grammar).
  const handleLoadSolution = () => {
    if (!activeExercise) {
      return;
    }
    loadScenario({ mode: activeExercise.mode, ...activeExercise.seed });
  };

  // Auto-checking only applies to the Language → Grammar exercises, where the
  // reference solution is a concrete grammar we can recognise words against.
  const canCheck = activeExercise?.category === "languageToGrammar";

  const handleCheckSolution = () => {
    if (!activeExercise) {
      return;
    }
    const studentSource =
      useRLSimulatorStore.getState().studentLanguageSource ?? "";
    setCheckResult(
      checkLanguageExercise(
        studentSource,
        activeExercise.solution,
        activeExercise.seed.languageSource ?? "",
      ),
    );
  };

  const headerActions = activeExercise ? (
    <>
      <button
        type="button"
        onClick={handleLoadSolution}
        data-testid="rl-load-solution"
        className="border-border bg-background text-foreground hover:bg-muted inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium"
      >
        {t("rl.exerciseWorkspace.showSolution", "Load solution")}
      </button>
      {canCheck && (
        <button
          type="button"
          onClick={handleCheckSolution}
          data-testid="rl-check-solution"
          className="bg-brand text-brand-foreground inline-flex items-center rounded-md px-3 py-2 text-sm font-medium hover:opacity-90"
        >
          {t("rl.exerciseWorkspace.check", "Check Solution")}
        </button>
      )}
    </>
  ) : null;

  return (
    <>
      <TopicSimulationTab
        {...props}
        selectedItem={props.selectedItem}
        selectedItemActions={headerActions}
        emptyStateTextKey="simulation.emptyStates.regularLanguages"
      >
        <RLSimulator />
      </TopicSimulationTab>

      <SolutionCheckDialog
        open={checkResult !== null}
        title={t("rl.exerciseWorkspace.check", "Check Solution")}
        onClose={() => setCheckResult(null)}
        testId="rl-solution-check-dialog"
        summary={checkResult && <CheckSummary result={checkResult} />}
        tableTestIdPrefix="rl-solution-check-table"
        headers={[]}
        rows={[]}
      />
    </>
  );
}

function formatWords(words: string[]): string {
  return words.map((word) => (word === "" ? "ε" : word)).join(", ");
}

function CheckSummary({ result }: { result: RLCheckResult }) {
  const { t } = useTranslation();

  if (result.status === "invalid") {
    const messageKey =
      result.reason === "studentNotEnumerated"
        ? "rl.exerciseWorkspace.checkInvalidFormat"
        : result.reason === "reference"
          ? "rl.exerciseWorkspace.checkUnavailable"
          : "rl.exerciseWorkspace.checkEmpty";
    return <p className="text-muted-foreground text-sm">{t(messageKey)}</p>;
  }

  if (result.status === "match") {
    return (
      <div>
        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
          {t("rl.exerciseWorkspace.checkMatch")}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("rl.exerciseWorkspace.checkMatchDetail")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-destructive text-sm font-semibold">
        {t("rl.exerciseWorkspace.checkMismatch")}
      </p>
      {result.wrong.length > 0 && (
        <p className="text-muted-foreground mt-1 text-sm">
          {t("rl.exerciseWorkspace.checkWrong", {
            words: formatWords(result.wrong),
          })}
        </p>
      )}
      {result.missing.length > 0 && (
        <p className="text-muted-foreground mt-1 text-sm">
          {t("rl.exerciseWorkspace.checkMissing", {
            words: formatWords(result.missing),
          })}
        </p>
      )}
    </div>
  );
}
