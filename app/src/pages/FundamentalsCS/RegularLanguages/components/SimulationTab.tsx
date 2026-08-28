import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog/ConfirmDialog";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { SolutionCheckDialog } from "@/components/shared/SolutionCheckDialog";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import {
  checkGrammarEnumerationExercise,
  checkLanguageToGrammarExercise,
  G2L_EXERCISE_ENUMERATION,
  type RLCheckResult,
} from "./Simulator/domain/rlSolutionChecker";
import { enumerateLanguage } from "./Simulator/domain/rlLanguageOps";
import { parseGrammar } from "./Simulator/domain/rlGrammarValidation";
import { findRLExercise } from "../exercises/rlExerciseDefinitions";
import { useRLSimulatorStore } from "../store/rlSimulatorStore";
import { RLSimulator, type RLSimulatorHandle } from "./Simulator/RLSimulator";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const { t } = useTranslation();
  const setActiveExercise = useRLSimulatorStore((s) => s.setActiveExercise);
  const revealEnumeration = useRLSimulatorStore((s) => s.revealEnumeration);
  const revealGrammar = useRLSimulatorStore((s) => s.revealGrammar);
  const simulatorRef = useRef<RLSimulatorHandle>(null);

  // The opened exercise (if any) drives the action buttons. Examples still flow
  // through the shared "Selected example" card with no actions.
  const activeExercise = props.selectedExercise
    ? findRLExercise(props.selectedExercise.id)
    : undefined;

  const [checkResult, setCheckResult] = useState<RLCheckResult | null>(null);
  // Revealing the solution overwrites the learner's draft, so it asks first.
  const [confirmLoadSolution, setConfirmLoadSolution] = useState(false);

  // Keep the store flag in sync with what is actually displayed.
  useEffect(() => {
    setActiveExercise(activeExercise?.id ?? null);
  }, [activeExercise?.id, setActiveExercise]);

  // Each exercise type gets its own reveal/check path: Grammar → Language keeps
  // the grammar fixed and asks for the language; Language → Grammar keeps the
  // language fixed and asks for a grammar.
  const isGrammarExercise = activeExercise?.mode === "grammarToLanguage";
  const isLanguageExercise = activeExercise?.mode === "languageToGrammar";

  // Reveal: Grammar → Language drops the enumerated words into the learner's
  // list; Language → Grammar drops the reference grammar into the editor.
  const handleLoadSolution = () => {
    setConfirmLoadSolution(false);
    if (!activeExercise) {
      return;
    }
    if (isGrammarExercise) {
      const parsed = parseGrammar(activeExercise.seed.grammarSource ?? "");
      if (!parsed.ok || !parsed.grammar) {
        return;
      }
      const { words } = enumerateLanguage(
        parsed.grammar,
        G2L_EXERCISE_ENUMERATION,
      );
      revealEnumeration(words.map((w) => (w === "" ? "ε" : w)).join(", "));
      return;
    }
    if (isLanguageExercise && activeExercise.referenceGrammar) {
      revealGrammar(activeExercise.referenceGrammar);
    }
  };

  // Auto-checking applies to both guided exercise types.
  const canCheck = isGrammarExercise || isLanguageExercise;

  const handleCheckSolution = () => {
    if (!activeExercise) {
      return;
    }
    const studentSource =
      useRLSimulatorStore.getState().exerciseDrafts[activeExercise.id] ?? "";
    if (isGrammarExercise) {
      setCheckResult(
        checkGrammarEnumerationExercise(
          studentSource,
          activeExercise.seed.grammarSource ?? "",
        ),
      );
      return;
    }
    setCheckResult(
      checkLanguageToGrammarExercise(
        studentSource,
        activeExercise.seed.languageSource ?? "",
        activeExercise.rejectWords ?? [],
      ),
    );
  };

  const headerActions = activeExercise ? (
    <>
      <button
        type="button"
        onClick={() => setConfirmLoadSolution(true)}
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
        onReset={() => simulatorRef.current?.resetStoredState()}
      >
        <RLSimulator
          ref={simulatorRef}
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

      <ConfirmDialog
        isOpen={confirmLoadSolution}
        title={t("regular-languages.exerciseWorkspace.confirmTitle")}
        description={t("regular-languages.exerciseWorkspace.confirmBody")}
        confirmLabel={t("regular-languages.exerciseWorkspace.confirmYes")}
        cancelLabel={t("regular-languages.exerciseWorkspace.confirmNo")}
        onConfirm={handleLoadSolution}
        onCancel={() => setConfirmLoadSolution(false)}
        variant="warning"
        testId="rl-load-solution-confirm"
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
