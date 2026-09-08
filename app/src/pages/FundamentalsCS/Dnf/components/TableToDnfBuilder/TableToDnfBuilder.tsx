import { useEffect, useMemo, useState } from "react";
import { Lightbulb, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { buildTruthTableDisplay } from "../DnfBuilder/adapters/truthTableAdapter";
import { analyzeDnfTruthTable } from "../DnfBuilder/application/dnfAnalysis";
import { buildDnfFollowUpConfiguration } from "../DnfBuilder/application/dnfFollowUp";
import { useDnfSimplification } from "../DnfBuilder/application/useDnfSimplification";
import { formatBooleanExpressionForDisplay } from "../DnfBuilder/domain/booleanExpression";
import { normalizeBooleanOperatorAliases } from "../DnfBuilder/domain/booleanSyntax";
import {
  checkDnfExerciseAttempt,
  type DnfExerciseCheckResult,
} from "../DnfBuilder/domain/dnfExerciseCheck";
import { checkDnfSimplification } from "../DnfBuilder/domain/dnfSimplificationCheck";
import { computeSmallestBooleanExpression } from "../DnfBuilder/domain/minimalExpression";
import type { DnfTruthTableTransferDraft } from "../DnfBuilder/domain/dnfTransfer";
import { createTruthTableFromResults } from "../DnfBuilder/domain/truthTable";
import { DnfExerciseWorkspace } from "../DnfBuilder/presentation/DnfExerciseWorkspace";
import { DnfFollowUpSections } from "../DnfBuilder/presentation/DnfFollowUpSections";
import {
  EDITABLE_TABLE_MAX_VARIABLE_COUNT,
  EDITABLE_TABLE_MIN_VARIABLE_COUNT,
  TableSetup,
} from "./TableSetup";
const editableVariableNames = ["a", "b", "c", "d", "e", "f", "g", "h"];

interface TableToDnfBuilderProps {
  initialValue?: DnfTruthTableTransferDraft;
  onTransferValueChange?: (value: DnfTruthTableTransferDraft) => void;
  onUserChange?: () => void;
  seedInitialFeedback?: boolean;
}

export function TableToDnfBuilder({
  initialValue,
  onTransferValueChange,
  onUserChange,
  seedInitialFeedback = false,
}: TableToDnfBuilderProps) {
  const { t } = useTranslation();
  const initialVariableCount = clampVariableCount(
    initialValue?.variableCount ?? 3,
  );
  const [variableCount, setVariableCount] = useState(initialVariableCount);
  const [resultValues, setResultValues] = useState<boolean[]>(() =>
    initialValue?.resultValues &&
    initialValue.resultValues.length === 2 ** initialVariableCount
      ? [...initialValue.resultValues]
      : Array.from({ length: 2 ** initialVariableCount }, () => false),
  );
  const [committed, setCommitted] = useState(initialValue?.committed ?? false);
  const [showSolution, setShowSolution] = useState(false);
  const [solutionLoadedVersion, setSolutionLoadedVersion] = useState(0);
  const [showFullTable, setShowFullTable] = useState(false);
  const [dnfAnswer, setDnfAnswer] = useState(initialValue?.dnfAnswer ?? "");
  const truthTable = useMemo(
    () =>
      createTruthTableFromResults(
        editableVariableNames.slice(0, variableCount),
        resultValues,
      ),
    [resultValues, variableCount],
  );
  const analysis = useMemo(
    () => analyzeDnfTruthTable(truthTable),
    [truthTable],
  );
  const [feedback, setFeedback] = useState<DnfExerciseCheckResult | null>(() =>
    seedInitialFeedback &&
    analysis.status === "valid" &&
    (initialValue?.dnfAnswer ?? "").trim().length > 0
      ? checkDnfExerciseAttempt(
          analysis.truthTable,
          [],
          initialValue?.dnfAnswer ?? "",
          { checkTruthTable: false },
        )
      : null,
  );
  const initialSimplificationFeedback = useMemo(
    () =>
      seedInitialFeedback &&
      analysis.status === "valid" &&
      (initialValue?.simplificationAnswer ?? "").trim().length > 0
        ? checkDnfSimplification(
            analysis.truthTable,
            initialValue?.simplificationAnswer ?? "",
          )
        : null,
    [analysis, initialValue?.simplificationAnswer, seedInitialFeedback],
  );
  const simplification = useDnfSimplification(
    initialValue?.simplificationAnswer,
    { initialFeedback: initialSimplificationFeedback },
  );
  const transferValue = useMemo(
    () => ({
      variableCount,
      resultValues,
      committed,
      truthTableAnswers: [],
      dnfAnswer,
      simplificationAnswer: simplification.answer,
    }),
    [committed, dnfAnswer, resultValues, simplification.answer, variableCount],
  );

  useEffect(() => {
    onTransferValueChange?.(transferValue);
  }, [onTransferValueChange, transferValue]);

  const display = useMemo(() => {
    if (!showSolution || analysis.status !== "valid") return null;

    return buildTruthTableDisplay(analysis.truthTable, analysis.derivation);
  }, [analysis, showSolution]);

  const clearAttempt = () => {
    setShowSolution(false);
    setDnfAnswer("");
    setFeedback(null);
    simplification.reset();
  };

  const handleNewTable = () => {
    onUserChange?.();
    setCommitted(false);
    setShowFullTable(false);
    clearAttempt();
  };

  const updateVariableCount = (nextVariableCount: number) => {
    const boundedVariableCount = clampVariableCount(nextVariableCount);

    onUserChange?.();
    setVariableCount(boundedVariableCount);
    setResultValues(
      Array.from({ length: 2 ** boundedVariableCount }, () => false),
    );
    clearAttempt();
  };

  const updateResultValue = (rowIndex: number, value: boolean) => {
    onUserChange?.();
    setResultValues((currentValues) => {
      const nextValues = [...currentValues];
      nextValues[rowIndex] = value;
      return nextValues;
    });
    setFeedback(null);
    setShowSolution(false);
    simplification.reset();
  };

  const handleCheck = () => {
    if (analysis.status !== "valid") return;

    setFeedback(
      checkDnfExerciseAttempt(analysis.truthTable, [], dnfAnswer, {
        checkTruthTable: false,
      }),
    );
  };

  const updateDnfAnswer = (value: string) => {
    onUserChange?.();
    setDnfAnswer(normalizeBooleanOperatorAliases(value));
    setFeedback(null);
    setShowSolution(false);
    simplification.reset();
  };

  // Fill the answer with the reference solution for the user-defined table: the
  // canonical DNF and the minimal simplification, shown as already checked. The
  // table itself stays as the user built it.
  const loadSolution = () => {
    if (analysis.status !== "valid") return;

    const canonicalDnf = analysis.formattedDnf;
    const minimalExpression = formatBooleanExpressionForDisplay(
      computeSmallestBooleanExpression(analysis.truthTable).expression,
    );

    onUserChange?.();
    setDnfAnswer(canonicalDnf);
    setShowSolution(false);
    setFeedback(
      checkDnfExerciseAttempt(analysis.truthTable, [], canonicalDnf, {
        checkTruthTable: false,
      }),
    );
    simplification.loadSolution(minimalExpression, analysis.truthTable);
    setSolutionLoadedVersion((current) => current + 1);
  };

  if (analysis.status !== "valid") {
    return null;
  }

  const { solution, simplification: simplificationFollowUp } =
    buildDnfFollowUpConfiguration({
      analysis,
      display,
      resultHeader: "f",
      showSolution,
      feedback,
      simplification,
      simplificationAnswerChange: (value) => {
        onUserChange?.();
        simplification.setAnswer(value);
      },
    });

  if (!committed) {
    return (
      <TableSetup
        truthTable={analysis.truthTable}
        variableCount={variableCount}
        resultValues={resultValues}
        onVariableCountChange={updateVariableCount}
        onResultValuesChange={(values) => {
          onUserChange?.();
          setResultValues(values);
          clearAttempt();
        }}
        onResultChange={updateResultValue}
        onCommit={() => {
          onUserChange?.();
          setCommitted(true);
        }}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          data-testid="dnf-edit-table-config"
          onClick={handleNewTable}
          className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
        >
          <Pencil className="size-4" />
          {t("dnf.simulator.editConfig")}
        </button>
        {!seedInitialFeedback && (
          <button
            type="button"
            data-testid="dnf-free-load-solution"
            onClick={loadSolution}
            className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
          >
            <Lightbulb className="size-4" />
            {t("dnf.simulator.loadSolution")}
          </button>
        )}
      </div>

      <DnfExerciseWorkspace
        source="f"
        truthTable={analysis.truthTable}
        truthTableAnswers={resultValues}
        dnfAnswer={dnfAnswer}
        feedback={feedback}
        showSolution={showSolution}
        resultHeader="f"
        requiresTruthTableAnswers={false}
        canEditTruthTableResults={false}
        canToggleFullTable={true}
        showFullTable={showFullTable}
        onTruthTableAnswerChange={updateResultValue}
        onDnfAnswerChange={updateDnfAnswer}
        onCheck={handleCheck}
        onToggleSolution={() => setShowSolution((current) => !current)}
        onToggleFullTable={() => setShowFullTable((current) => !current)}
        solution={solution}
      />

      <DnfFollowUpSections
        key={`simplification-${solutionLoadedVersion}`}
        simplification={simplificationFollowUp}
        initiallyOpenSimplification={
          seedInitialFeedback || solutionLoadedVersion > 0
        }
      />
    </div>
  );
}

function clampVariableCount(value: number): number {
  if (!Number.isFinite(value)) {
    return EDITABLE_TABLE_MIN_VARIABLE_COUNT;
  }

  return Math.min(
    EDITABLE_TABLE_MAX_VARIABLE_COUNT,
    Math.max(EDITABLE_TABLE_MIN_VARIABLE_COUNT, Math.trunc(value)),
  );
}
