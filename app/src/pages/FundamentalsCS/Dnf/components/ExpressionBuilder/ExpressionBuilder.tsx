import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Eraser, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { buildTruthTableDisplay } from "../DnfBuilder/adapters/truthTableAdapter";
import { analyzeDnfSource } from "../DnfBuilder/application/dnfAnalysis";
import { useDnfSimplification } from "../DnfBuilder/application/useDnfSimplification";
import { normalizeBooleanOperatorAliases } from "../DnfBuilder/domain/booleanSyntax";
import { formatBooleanInput } from "../DnfBuilder/domain/booleanSyntax";
import {
  checkDnfExerciseAttempt,
  type DnfExerciseCheckResult,
  type TruthTableAnswer,
} from "../DnfBuilder/domain/dnfExerciseCheck";
import { DnfExerciseWorkspace } from "../DnfBuilder/presentation/DnfExerciseWorkspace";
import { DnfFollowUpSections } from "../DnfBuilder/presentation/DnfFollowUpSections";
import { DnfOperatorToolbar } from "../DnfBuilder/presentation/DnfOperatorToolbar";
import {
  ParseErrorPanel,
  VariableLimitPanel,
} from "../DnfBuilder/presentation/DnfStatusPanels";

interface ExpressionBuilderProps {
  initialExpression?: string;
}

export function ExpressionBuilder({
  initialExpression,
}: ExpressionBuilderProps = {}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState(initialExpression ?? "");
  const [committedSource, setCommittedSource] = useState<string | null>(
    initialExpression?.trim() ? initialExpression.trim() : null,
  );

  const handleSourceChange = (value: string) => {
    setInputValue(normalizeBooleanOperatorAliases(value));
  };

  const handleEvaluate = () => {
    const trimmed = inputValue.trim();
    if (trimmed.length > 0) setCommittedSource(trimmed);
  };

  const handleClear = () => {
    setInputValue("");
    setCommittedSource(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
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
          key={committedSource}
          committedSource={committedSource}
        />
      )}
    </div>
  );
}

function ExpressionWorkspace({ committedSource }: { committedSource: string }) {
  const analysis = useMemo(
    () => analyzeDnfSource(committedSource),
    [committedSource],
  );

  const [showSolution, setShowSolution] = useState(false);
  const [showFullTable, setShowFullTable] = useState(false);
  const [truthTableAnswers, setTruthTableAnswers] = useState<
    TruthTableAnswer[]
  >([]);
  const [dnfAnswer, setDnfAnswer] = useState("");
  const [feedback, setFeedback] = useState<DnfExerciseCheckResult | null>(null);
  const simplification = useDnfSimplification();

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
    setTruthTableAnswers((prev) => {
      const next = [...prev];
      next[rowIndex] = value;
      return next;
    });
    setFeedback(null);
    setShowSolution(false);
    simplification.reset();
  };

  const updateDnfAnswer = (value: string) => {
    setDnfAnswer(normalizeBooleanOperatorAliases(value));
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

  const handleReset = () => {
    setTruthTableAnswers([]);
    setDnfAnswer("");
    setFeedback(null);
    setShowSolution(false);
    simplification.reset();
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

  const simplificationControls = {
    answer: simplification.answer,
    feedback: simplification.feedback,
    showSolution: simplification.showSolution,
    showWalkthrough: simplification.showWalkthrough,
    onAnswerChange: simplification.setAnswer,
    onCheck: () => simplification.check(analysis.truthTable),
    onToggleSolution: simplification.toggleSolution,
    onToggleWalkthrough: simplification.toggleWalkthrough,
  };
  const solution =
    showSolution && display
      ? {
          formattedDnf: analysis.formattedDnf,
          variableCount: analysis.truthTable.variables.length,
          rowCount: analysis.truthTable.rows.length,
          trueRowCount: analysis.derivation.trueRows.length,
          derivation: analysis.derivation,
          display,
          resultHeader: committedSource,
          truthTable: analysis.truthTable,
        }
      : undefined;
  const simplificationFollowUp = {
    truthTable: analysis.truthTable,
    controls: simplificationControls,
    isEnabled: feedback?.isCorrect === true,
  };

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
        onReset={handleReset}
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
