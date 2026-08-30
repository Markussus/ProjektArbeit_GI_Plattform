import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { SolutionCheckDialog } from "@/components/shared/SolutionCheckDialog";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import type { RLCheckResult } from "./Simulator/domain/rlSolutionChecker";
import { findRLExercise } from "../exercises/rlExerciseDefinitions";
import { findRLExample } from "./Simulator/config/rlExamples";
import { RLSimulator, type RLSimulatorHandle } from "./Simulator/RLSimulator";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const { t } = useTranslation();
  const simulatorRef = useRef<RLSimulatorHandle>(null);

  const activeExercise = useMemo(
    () =>
      props.selectedExercise ? findRLExercise(props.selectedExercise.id) : null,
    [props.selectedExercise],
  );

  const activeExample = useMemo(
    () => (props.selectedItem ? findRLExample(props.selectedItem.id) : null),
    [props.selectedItem],
  );

  const [checkResult, setCheckResult] = useState<RLCheckResult | null>(null);

  const isGrammarExercise = activeExercise?.mode === "grammarToLanguage";
  const isLanguageExercise = activeExercise?.mode === "languageToGrammar";
  const canCheck = isGrammarExercise || isLanguageExercise;

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
        data-testid="rl-load-solution"
        className="border-border bg-background text-foreground hover:bg-muted inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium"
      >
        {t("regular-languages.exerciseWorkspace.showSolution", "Load solution")}
      </button>
      {canCheck && (
        <button
          type="button"
          onClick={handleCheckSolution}
          data-testid="rl-check-solution"
          className="bg-brand text-brand-foreground inline-flex items-center rounded-md px-3 py-2 text-sm font-medium hover:opacity-90"
        >
          {t("regular-languages.exerciseWorkspace.check", "Check Solution")}
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
        emptyStateTextKey="common.simulation.emptyStates.regularLanguages"
        onReset={() => {
          setCheckResult(null);
          simulatorRef.current?.resetStoredState();
        }}
      >
        <RLSimulator
          key={activeExercise?.id ?? activeExample?.id ?? "__rl-free-mode__"}
          ref={simulatorRef}
          exercise={activeExercise}
          example={activeExample}
          onExitExercise={props.onExitExercise}
          importedTaskStorageId={props.importedTaskStorageId}
        />
      </TopicSimulationTab>

      <SolutionCheckDialog
        open={checkResult !== null}
        title={t("regular-languages.exerciseWorkspace.check", "Check Solution")}
        onClose={() => setCheckResult(null)}
        testId="rl-solution-check-dialog"
        summary={
          checkResult && (
            <CheckSummary
              result={checkResult}
              isGrammarExercise={isGrammarExercise}
            />
          )
        }
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

function CheckSummary({
  result,
  isGrammarExercise,
}: {
  result: RLCheckResult;
  isGrammarExercise: boolean;
}) {
  const { t } = useTranslation();

  if (result.status === "invalid") {
    const messageKey =
      result.reason === "studentParse"
        ? "regular-languages.exerciseWorkspace.checkInvalidGrammar"
        : result.reason === "reference"
          ? "regular-languages.exerciseWorkspace.checkUnavailable"
          : "regular-languages.exerciseWorkspace.checkEmpty";
    return <p className="text-muted-foreground text-sm">{t(messageKey)}</p>;
  }

  if (result.status === "match") {
    return (
      <div>
        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
          {t("regular-languages.exerciseWorkspace.checkMatch")}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {t(
            isGrammarExercise
              ? "regular-languages.exerciseWorkspace.checkMatchDetailG2L"
              : "regular-languages.exerciseWorkspace.checkMatchDetailL2G",
          )}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-destructive text-sm font-semibold">
        {t("regular-languages.exerciseWorkspace.checkMismatch")}
      </p>
      {result.wrong.length > 0 && (
        <p className="text-muted-foreground mt-1 text-sm">
          {t(
            isGrammarExercise
              ? "regular-languages.exerciseWorkspace.checkWrongG2L"
              : "regular-languages.exerciseWorkspace.checkWrongL2G",
            { words: formatWords(result.wrong) },
          )}
        </p>
      )}
      {result.missing.length > 0 && (
        <p className="text-muted-foreground mt-1 text-sm">
          {t(
            isGrammarExercise
              ? "regular-languages.exerciseWorkspace.checkMissingG2L"
              : "regular-languages.exerciseWorkspace.checkMissingL2G",
            { words: formatWords(result.missing) },
          )}
        </p>
      )}
    </div>
  );
}
