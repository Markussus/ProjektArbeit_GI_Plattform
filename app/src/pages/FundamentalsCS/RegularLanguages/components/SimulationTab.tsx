import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { SolutionCheckDialog } from "@/components/shared/SolutionCheckDialog";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import type { RLCheckResult } from "./Simulator/domain/rlSolutionChecker";
import { findRLExercise } from "../exercises/rlExerciseDefinitions";
import { findRLExample } from "./Simulator/config/rlExamples";
import { RLSimulator, type RLSimulatorHandle } from "./Simulator/RLSimulator";
import { RLCheckSummary } from "./RLCheckSummary";

/**
 * Simulation tab: the simulator plus an exercise's header buttons. Only the two
 * grammar directions are gradable, so word recognition gets no check button.
 */
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
            <RLCheckSummary
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
