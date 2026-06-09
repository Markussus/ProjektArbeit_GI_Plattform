import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { buildTruthTableDisplay } from "../DnfBuilder/adapters/truthTableAdapter";
import { analyzeDnfTruthTable } from "../DnfBuilder/application/dnfAnalysis";
import { buildDnfFollowUpConfiguration } from "../DnfBuilder/application/dnfFollowUp";
import { useDnfSimplification } from "../DnfBuilder/application/useDnfSimplification";
import { normalizeBooleanOperatorAliases } from "../DnfBuilder/domain/booleanSyntax";
import {
  checkDnfExerciseAttempt,
  type DnfExerciseCheckResult,
} from "../DnfBuilder/domain/dnfExerciseCheck";
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
  initialVariables?: string[];
  initialResultValues?: boolean[];
}

export function TableToDnfBuilder({
  initialVariables,
  initialResultValues,
}: TableToDnfBuilderProps = {}) {
  const { t } = useTranslation();
  const initialVariableCount = clampVariableCount(
    initialVariables?.length ?? 3,
  );
  const [variableCount, setVariableCount] = useState(initialVariableCount);
  const [resultValues, setResultValues] = useState<boolean[]>(() =>
    initialResultValues &&
    initialResultValues.length === 2 ** initialVariableCount
      ? [...initialResultValues]
      : Array.from({ length: 2 ** initialVariableCount }, () => false),
  );
  const [committed, setCommitted] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showFullTable, setShowFullTable] = useState(false);
  const [dnfAnswer, setDnfAnswer] = useState("");
  const [feedback, setFeedback] = useState<DnfExerciseCheckResult | null>(null);
  const simplification = useDnfSimplification();
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

  const display = useMemo(() => {
    if (!showSolution || analysis.status !== "valid") return null;

    return buildTruthTableDisplay(analysis.truthTable, analysis.derivation);
  }, [analysis, showSolution]);

  const resetAttempt = () => {
    setShowSolution(false);
    setDnfAnswer("");
    setFeedback(null);
    simplification.reset();
  };

  const handleNewTable = () => {
    setCommitted(false);
    setShowFullTable(false);
    resetAttempt();
  };

  const updateVariableCount = (nextVariableCount: number) => {
    const boundedVariableCount = clampVariableCount(nextVariableCount);

    setVariableCount(boundedVariableCount);
    setResultValues(
      Array.from({ length: 2 ** boundedVariableCount }, () => false),
    );
    resetAttempt();
  };

  const updateResultValue = (rowIndex: number, value: boolean) => {
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
    setDnfAnswer(normalizeBooleanOperatorAliases(value));
    setFeedback(null);
    setShowSolution(false);
    simplification.reset();
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
    });

  if (!committed) {
    return (
      <TableSetup
        truthTable={analysis.truthTable}
        variableCount={variableCount}
        resultValues={resultValues}
        onVariableCountChange={updateVariableCount}
        onResultValuesChange={(values) => {
          setResultValues(values);
          resetAttempt();
        }}
        onResultChange={updateResultValue}
        onCommit={() => setCommitted(true)}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <button
          type="button"
          onClick={handleNewTable}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4" />
          {t("dnf.simulator.newTable")}
        </button>
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
        canAlwaysShowSolution={true}
        canEditTruthTableResults={false}
        canToggleFullTable={true}
        showFullTable={showFullTable}
        onTruthTableAnswerChange={updateResultValue}
        onDnfAnswerChange={updateDnfAnswer}
        onCheck={handleCheck}
        onReset={resetAttempt}
        onToggleSolution={() => setShowSolution((current) => !current)}
        onToggleFullTable={() => setShowFullTable((current) => !current)}
      />

      <DnfFollowUpSections
        key={solution ? "solution-visible" : "solution-hidden"}
        solution={solution}
        simplification={simplificationFollowUp}
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
