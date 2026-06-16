import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SimulatorStringTransferBox } from "@/components/shared/SimulatorStringTransferBox";
import { useTrainingCenterAutoSave } from "@/hooks/useTrainingCenterAutoSave";
import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";
import { buildTruthTableDisplay } from "../DnfBuilder/adapters/truthTableAdapter";
import { analyzeDnfTruthTable } from "../DnfBuilder/application/dnfAnalysis";
import { buildDnfFollowUpConfiguration } from "../DnfBuilder/application/dnfFollowUp";
import { useDnfSimplification } from "../DnfBuilder/application/useDnfSimplification";
import { normalizeBooleanOperatorAliases } from "../DnfBuilder/domain/booleanSyntax";
import {
  checkDnfExerciseAttempt,
  type DnfExerciseCheckResult,
} from "../DnfBuilder/domain/dnfExerciseCheck";
import {
  dnfTruthTableTransferCodec,
  type DnfTruthTableTransferDraft,
} from "../DnfBuilder/domain/dnfTransfer";
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
  storageIdentifier: string;
  storageEnabled: boolean;
  storageReady: boolean;
  transferCodec: ISimulatorTransferCodec<DnfTruthTableTransferDraft>;
  onTransferValueChange?: (value: DnfTruthTableTransferDraft) => void;
  onUserChange?: () => void;
}

export function TableToDnfBuilder({
  initialValue,
  storageIdentifier,
  storageEnabled,
  storageReady,
  transferCodec,
  onTransferValueChange,
  onUserChange,
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
  const [showFullTable, setShowFullTable] = useState(false);
  const [dnfAnswer, setDnfAnswer] = useState(initialValue?.dnfAnswer ?? "");
  const [feedback, setFeedback] = useState<DnfExerciseCheckResult | null>(null);
  const simplification = useDnfSimplification(
    initialValue?.simplificationAnswer,
  );
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

  useTrainingCenterAutoSave({
    identifier: storageIdentifier,
    value: transferValue,
    codec: dnfTruthTableTransferCodec,
    enabled: storageEnabled && storageReady,
  });

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

  const handleImportTable = (value: DnfTruthTableTransferDraft) => {
    onUserChange?.();
    setVariableCount(value.variableCount);
    setResultValues([...value.resultValues]);
    setCommitted(value.committed);
    setDnfAnswer(normalizeBooleanOperatorAliases(value.dnfAnswer));
    simplification.setAnswer(value.simplificationAnswer);
    setFeedback(null);
    setShowSolution(false);
    setShowFullTable(false);
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
        transferControl={
          <SimulatorStringTransferBox
            value={transferValue}
            codec={transferCodec}
            onLoad={handleImportTable}
            testIdPrefix="dnf-table-transfer"
          />
        }
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
        canEditTruthTableResults={false}
        canToggleFullTable={true}
        showFullTable={showFullTable}
        onTruthTableAnswerChange={updateResultValue}
        onDnfAnswerChange={updateDnfAnswer}
        onCheck={handleCheck}
        onToggleSolution={() => setShowSolution((current) => !current)}
        onToggleFullTable={() => setShowFullTable((current) => !current)}
      />

      <DnfFollowUpSections
        key={solution ? "solution-visible" : "solution-hidden"}
        solution={solution}
        simplification={simplificationFollowUp}
      />

      <SimulatorStringTransferBox
        value={transferValue}
        codec={transferCodec}
        onLoad={handleImportTable}
        testIdPrefix="dnf-table-transfer"
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
