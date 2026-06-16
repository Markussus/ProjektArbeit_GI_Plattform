import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Eraser, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SimulatorStringTransferBox } from "@/components/shared/SimulatorStringTransferBox";
import { useTrainingCenterAutoSave } from "@/hooks/useTrainingCenterAutoSave";
import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";
import { buildTruthTableDisplay } from "../DnfBuilder/adapters/truthTableAdapter";
import { analyzeDnfSource } from "../DnfBuilder/application/dnfAnalysis";
import { buildDnfFollowUpConfiguration } from "../DnfBuilder/application/dnfFollowUp";
import { useDnfSimplification } from "../DnfBuilder/application/useDnfSimplification";
import { normalizeBooleanOperatorAliases } from "../DnfBuilder/domain/booleanSyntax";
import { formatBooleanInput } from "../DnfBuilder/domain/booleanSyntax";
import {
  checkDnfExerciseAttempt,
  type DnfExerciseCheckResult,
  type TruthTableAnswer,
} from "../DnfBuilder/domain/dnfExerciseCheck";
import {
  createDnfAttemptDraft,
  dnfExpressionTransferCodec,
  type DnfAttemptTransferDraft,
  type DnfExpressionTransferDraft,
} from "../DnfBuilder/domain/dnfTransfer";
import { DnfExerciseWorkspace } from "../DnfBuilder/presentation/DnfExerciseWorkspace";
import { DnfFollowUpSections } from "../DnfBuilder/presentation/DnfFollowUpSections";
import { DnfOperatorToolbar } from "../DnfBuilder/presentation/DnfOperatorToolbar";
import {
  ParseErrorPanel,
  VariableLimitPanel,
} from "../DnfBuilder/presentation/DnfStatusPanels";

interface ExpressionBuilderProps {
  initialValue?: DnfExpressionTransferDraft;
  storageIdentifier: string;
  storageEnabled: boolean;
  storageReady: boolean;
  transferCodec: ISimulatorTransferCodec<DnfExpressionTransferDraft>;
  onTransferValueChange?: (value: DnfExpressionTransferDraft) => void;
  onUserChange?: () => void;
}

export function ExpressionBuilder({
  initialValue,
  storageIdentifier,
  storageEnabled,
  storageReady,
  transferCodec,
  onTransferValueChange,
  onUserChange,
}: ExpressionBuilderProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState(initialValue?.expression ?? "");
  const [committedSource, setCommittedSource] = useState<string | null>(
    initialValue?.committed ? initialValue.expression : null,
  );
  const [attempt, setAttempt] = useState<DnfAttemptTransferDraft>(() =>
    createDnfAttemptDraft(initialValue),
  );
  const [workspaceVersion, setWorkspaceVersion] = useState(0);
  const transferValue = useMemo<DnfExpressionTransferDraft>(
    () => ({
      expression: inputValue,
      committed: committedSource !== null,
      ...attempt,
    }),
    [attempt, committedSource, inputValue],
  );

  useTrainingCenterAutoSave({
    identifier: storageIdentifier,
    value: transferValue,
    codec: dnfExpressionTransferCodec,
    enabled: storageEnabled && storageReady,
  });

  useEffect(() => {
    onTransferValueChange?.(transferValue);
  }, [onTransferValueChange, transferValue]);

  const handleSourceChange = (value: string) => {
    onUserChange?.();
    setInputValue(normalizeBooleanOperatorAliases(value));
  };

  const handleEvaluate = () => {
    const trimmed = inputValue.trim();
    if (trimmed.length > 0) {
      onUserChange?.();
      setCommittedSource(trimmed);
    }
  };

  const handleClear = () => {
    onUserChange?.();
    setInputValue("");
    setCommittedSource(null);
    setAttempt(createDnfAttemptDraft());
    setWorkspaceVersion((current) => current + 1);
  };

  const handleImportExpression = (value: DnfExpressionTransferDraft) => {
    const normalizedExpression = normalizeBooleanOperatorAliases(
      value.expression,
    );

    onUserChange?.();
    setInputValue(normalizedExpression);
    setCommittedSource(
      value.committed ? normalizedExpression.trim() || null : null,
    );
    setAttempt(createDnfAttemptDraft(value));
    setWorkspaceVersion((current) => current + 1);
  };

  return (
    <div
      data-testid="dnf-expression-builder"
      className="mx-auto flex w-full max-w-5xl flex-col gap-6"
    >
      {committedSource === null ? (
        <section className="border-border bg-card rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-foreground text-lg font-semibold">
                {t("dnf.builder.inputTitle")}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("dnf.builder.inputHint")}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {t("dnf.builder.keyboardAliases")}
              </p>
            </div>
            <button
              type="button"
              data-testid="dnf-clear-expression"
              onClick={handleClear}
              className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
            >
              <Eraser className="size-4" />
              {t("dnf.builder.clear")}
            </button>
          </div>

          <DnfOperatorToolbar
            inputRef={inputRef}
            value={inputValue}
            onChange={handleSourceChange}
            className="mt-4"
          />
          <textarea
            ref={inputRef}
            id="dnf-expression-input"
            data-testid="dnf-expression-input"
            aria-label={t("dnf.builder.inputTitle")}
            value={inputValue}
            onChange={(event) => handleSourceChange(event.target.value)}
            onBlur={(event) =>
              handleSourceChange(formatBooleanInput(event.target.value))
            }
            spellCheck="false"
            placeholder="z. B. a ∨ (b ∧ ¬c)"
            className="border-border bg-background text-foreground focus:ring-ring mt-3 min-h-20 w-full resize-y rounded-md border p-3 font-mono text-sm leading-relaxed focus:ring-2 focus:outline-none"
          />

          <div className="mt-4">
            <button
              type="button"
              data-testid="dnf-evaluate-expression"
              onClick={handleEvaluate}
              disabled={inputValue.trim().length === 0}
              className="bg-brand text-brand-foreground inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="size-4" />
              {t("dnf.exprBuilder.evaluate")}
            </button>
          </div>
        </section>
      ) : (
        <div>
          <button
            type="button"
            data-testid="dnf-new-expression"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="size-4" />
            {t("dnf.exprBuilder.newExpression")}
          </button>
        </div>
      )}

      {committedSource !== null && (
        <ExpressionWorkspace
          key={`${committedSource}-${workspaceVersion}`}
          committedSource={committedSource}
          initialAttempt={attempt}
          onAttemptChange={setAttempt}
          onUserChange={onUserChange}
        />
      )}

      <SimulatorStringTransferBox
        value={transferValue}
        codec={transferCodec}
        onLoad={handleImportExpression}
        testIdPrefix="dnf-expression-transfer"
      />
    </div>
  );
}

interface ExpressionWorkspaceProps {
  committedSource: string;
  initialAttempt: DnfAttemptTransferDraft;
  onAttemptChange: (attempt: DnfAttemptTransferDraft) => void;
  onUserChange?: () => void;
}

function ExpressionWorkspace({
  committedSource,
  initialAttempt,
  onAttemptChange,
  onUserChange,
}: ExpressionWorkspaceProps) {
  const analysis = useMemo(
    () => analyzeDnfSource(committedSource),
    [committedSource],
  );

  const [showSolution, setShowSolution] = useState(false);
  const [showFullTable, setShowFullTable] = useState(false);
  const [truthTableAnswers, setTruthTableAnswers] = useState<
    TruthTableAnswer[]
  >(() => initialAttempt.truthTableAnswers);
  const [dnfAnswer, setDnfAnswer] = useState(initialAttempt.dnfAnswer);
  const [feedback, setFeedback] = useState<DnfExerciseCheckResult | null>(null);
  const simplification = useDnfSimplification(
    initialAttempt.simplificationAnswer,
  );

  const normalizedAnswers = useMemo(
    () =>
      analysis.status === "valid"
        ? analysis.truthTable.rows.map((_, i) => truthTableAnswers[i] ?? null)
        : [],
    [analysis, truthTableAnswers],
  );

  const display = useMemo(() => {
    if (!showSolution || analysis.status !== "valid") return null;
    return buildTruthTableDisplay(analysis.truthTable, analysis.derivation);
  }, [analysis, showSolution]);

  const setTruthTableAnswer = (rowIndex: number, value: boolean) => {
    onUserChange?.();
    const nextAnswers = [...truthTableAnswers];
    nextAnswers[rowIndex] = value;
    setTruthTableAnswers(nextAnswers);
    onAttemptChange({
      truthTableAnswers: nextAnswers,
      dnfAnswer,
      simplificationAnswer: "",
    });
    setFeedback(null);
    setShowSolution(false);
    simplification.reset();
  };

  const updateDnfAnswer = (value: string) => {
    const normalizedValue = normalizeBooleanOperatorAliases(value);
    onUserChange?.();
    setDnfAnswer(normalizedValue);
    onAttemptChange({
      truthTableAnswers,
      dnfAnswer: normalizedValue,
      simplificationAnswer: "",
    });
    setFeedback(null);
    setShowSolution(false);
    simplification.reset();
  };

  const handleCheck = () => {
    if (analysis.status !== "valid") return;
    setFeedback(
      checkDnfExerciseAttempt(
        analysis.truthTable,
        truthTableAnswers,
        dnfAnswer,
        { checkTruthTable: true },
      ),
    );
  };

  const updateSimplificationAnswer = (value: string) => {
    const normalizedValue = normalizeBooleanOperatorAliases(value);
    onUserChange?.();
    simplification.setAnswer(normalizedValue);
    onAttemptChange({
      truthTableAnswers,
      dnfAnswer,
      simplificationAnswer: normalizedValue,
    });
  };

  if (analysis.status === "too_many_variables") {
    return (
      <VariableLimitPanel
        variableCount={analysis.variableCount}
        maxVariableCount={analysis.maxVariableCount}
      />
    );
  }

  if (analysis.status === "invalid") {
    return <ParseErrorPanel issue={analysis.issue} />;
  }

  const { solution, simplification: simplificationFollowUp } =
    buildDnfFollowUpConfiguration({
      analysis,
      display,
      resultHeader: committedSource,
      showSolution,
      feedback,
      simplification,
      simplificationAnswerChange: updateSimplificationAnswer,
    });

  return (
    <>
      <DnfExerciseWorkspace
        source={committedSource}
        truthTable={analysis.truthTable}
        truthTableAnswers={normalizedAnswers}
        dnfAnswer={dnfAnswer}
        feedback={feedback}
        showSolution={showSolution}
        resultHeader={committedSource}
        requiresTruthTableAnswers={true}
        canAlwaysShowSolution={true}
        canToggleFullTable={true}
        showFullTable={showFullTable}
        onTruthTableAnswerChange={setTruthTableAnswer}
        onDnfAnswerChange={updateDnfAnswer}
        onCheck={handleCheck}
        onToggleSolution={() => setShowSolution((prev) => !prev)}
        onToggleFullTable={() => setShowFullTable((prev) => !prev)}
      />

      <DnfFollowUpSections
        key={solution ? "solution-visible" : "solution-hidden"}
        solution={solution}
        simplification={simplificationFollowUp}
      />
    </>
  );
}
