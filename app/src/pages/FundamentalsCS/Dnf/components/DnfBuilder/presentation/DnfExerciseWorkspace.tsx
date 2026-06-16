import { useRef, type KeyboardEvent } from "react";
import { ChevronDown, ChevronUp, Eye, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatBooleanValue } from "../domain/booleanExpression";
import { formatBooleanInput } from "../domain/booleanSyntax";
import type {
  DnfExerciseCheckResult,
  TruthTableAnswer,
} from "../domain/dnfExerciseCheck";
import type { TruthTable } from "../domain/truthTable";
import type { DnfFollowUpSolution } from "../application/dnfFollowUp";
import { DnfOperatorToolbar } from "./DnfOperatorToolbar";
import { DnfSolutionBlock } from "./DnfSolutionBlock";
import { DnfTruthTable } from "./DnfTruthTable";
import { ExerciseFeedbackPanel } from "./ExerciseFeedbackPanel";

const WORKSPACE_TABLE_TOGGLE_THRESHOLD = 16;

interface DnfExerciseWorkspaceProps {
  source: string;
  truthTable: TruthTable;
  truthTableAnswers: TruthTableAnswer[];
  dnfAnswer: string;
  feedback: DnfExerciseCheckResult | null;
  showSolution: boolean;
  resultHeader: string;
  requiresTruthTableAnswers: boolean;
  canEditTruthTableResults?: boolean;
  canToggleFullTable?: boolean;
  showFullTable?: boolean;
  solution?: DnfFollowUpSolution;
  onTruthTableAnswerChange: (rowIndex: number, value: boolean) => void;
  onDnfAnswerChange: (value: string) => void;
  onCheck: () => void;
  onToggleSolution: () => void;
  onToggleFullTable?: () => void;
}

export function DnfExerciseWorkspace({
  source,
  truthTable,
  truthTableAnswers,
  dnfAnswer,
  feedback,
  showSolution,
  resultHeader,
  requiresTruthTableAnswers,
  canEditTruthTableResults = false,
  canToggleFullTable = false,
  showFullTable = false,
  solution,
  onTruthTableAnswerChange,
  onDnfAnswerChange,
  onCheck,
  onToggleSolution,
  onToggleFullTable,
}: DnfExerciseWorkspaceProps) {
  const { t } = useTranslation();
  const dnfInputRef = useRef<HTMLTextAreaElement>(null);
  const resultRowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const issueByRow = new Map(
    feedback?.truthTableIssues.map((issue) => [issue.rowIndex, issue]) ?? [],
  );
  const answeredRowCount = truthTableAnswers.filter(
    (answer) => answer !== null,
  ).length;
  const hasDnfAttempt = dnfAnswer.trim().length > 0;
  const canShowSolution = feedback !== null;
  const canInteractWithResultColumn =
    requiresTruthTableAnswers || canEditTruthTableResults;
  const isLargeWorkspaceTable =
    truthTable.rows.length >= WORKSPACE_TABLE_TOGGLE_THRESHOLD;
  const canActuallyToggleTable = canToggleFullTable && isLargeWorkspaceTable;
  const isCompactEditableTable = canActuallyToggleTable && !showFullTable;
  const isScrollableTruthTable = isCompactEditableTable;

  const focusResultRow = (rowIndex: number) => {
    const nextRow =
      resultRowRefs.current[rowIndex] ??
      resultRowRefs.current[resultRowRefs.current.length - 1];
    nextRow?.focus();
  };

  const updateTruthTableAnswer = (rowIndex: number, value: boolean) => {
    onTruthTableAnswerChange(rowIndex, value);
    focusResultRow(Math.min(rowIndex + 1, truthTable.rows.length - 1));
  };

  const handleResultKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    rowIndex: number,
  ) => {
    if (event.key === "0" || event.key === "1") {
      event.preventDefault();
      updateTruthTableAnswer(rowIndex, event.key === "1");
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusResultRow(Math.min(rowIndex + 1, truthTable.rows.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusResultRow(Math.max(rowIndex - 1, 0));
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      updateTruthTableAnswer(rowIndex, false);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      updateTruthTableAnswer(rowIndex, true);
    }
  };

  return (
    <div data-testid="dnf-exercise-workspace" className="flex flex-col gap-5">
      <section
        data-testid="dnf-exercise-task"
        className="border-border bg-card rounded-lg border p-5"
      >
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {t("dnf.builder.exercise.taskTitle")}
        </p>
        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.65fr)]">
          <div>
            <p className="text-muted-foreground text-sm">
              {requiresTruthTableAnswers
                ? t("dnf.builder.exercise.given")
                : canEditTruthTableResults
                  ? t("dnf.builder.exercise.buildTruthTable")
                  : t("dnf.builder.exercise.givenTruthTable")}
            </p>
            {requiresTruthTableAnswers ? (
              <code className="border-border bg-muted/40 text-foreground mt-2 block rounded-md border p-3 font-mono text-sm">
                {source}
              </code>
            ) : canEditTruthTableResults ? (
              <div className="border-border bg-muted/40 text-foreground mt-2 rounded-md border p-3 text-sm leading-relaxed">
                {t("dnf.builder.exercise.chooseResultColumn")}
              </div>
            ) : (
              <div className="border-border bg-muted/40 text-foreground mt-2 rounded-md border p-3 text-sm leading-relaxed">
                {t("dnf.builder.exercise.findExpressionFromTable")}
              </div>
            )}
          </div>
          <div className="border-border bg-muted/40 rounded-md border p-3">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {t("dnf.builder.exercise.stepsTitle")}
            </p>
            <ol className="mt-3 space-y-2 text-sm leading-relaxed">
              <li className="flex gap-2">
                <span className="bg-brand text-brand-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  1
                </span>
                <span className="text-foreground">
                  {requiresTruthTableAnswers
                    ? t("dnf.builder.exercise.instructionStepTable")
                    : canEditTruthTableResults
                      ? t("dnf.builder.exercise.instructionStepEditableTable")
                      : t("dnf.builder.exercise.instructionStepOneRows")}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="bg-brand text-brand-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  2
                </span>
                <span className="text-foreground">
                  {requiresTruthTableAnswers
                    ? t("dnf.builder.exercise.instructionStepDnf")
                    : t("dnf.builder.exercise.instructionStepDnfFromTable")}
                </span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.6fr)]">
        <section
          data-testid="dnf-exercise-truth-table-panel"
          className="border-border bg-card h-full rounded-lg border p-4"
        >
          <div>
            <h2 className="text-foreground text-lg font-semibold">
              {t("dnf.builder.exercise.tableTitle")}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {requiresTruthTableAnswers
                ? t("dnf.builder.exercise.tableHint")
                : canEditTruthTableResults
                  ? t("dnf.builder.exercise.tableHintEditable")
                  : t("dnf.builder.exercise.tableHintGiven")}
            </p>
            {canActuallyToggleTable && onToggleFullTable && (
              <div className="mt-3">
                <button
                  type="button"
                  data-testid="dnf-workspace-table-toggle"
                  onClick={onToggleFullTable}
                  className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
                >
                  {showFullTable ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                  {showFullTable
                    ? t("dnf.builder.showCompactTable")
                    : t("dnf.builder.showFullTable")}
                </button>
              </div>
            )}
          </div>

          <DnfTruthTable
            truthTable={truthTable}
            resultHeader={resultHeader}
            isScrollable={isScrollableTruthTable}
            testId="dnf-exercise-truth-table"
            getRowTestId={(rowIndex) =>
              `dnf-exercise-truth-table-row-${rowIndex}`
            }
            getRowClassName={(rowIndex) =>
              requiresTruthTableAnswers &&
              issueByRow.get(rowIndex)?.actual === null
                ? "bg-amber-500/10"
                : undefined
            }
            renderResultCell={(row, rowIndex) => {
              const answer = truthTableAnswers[rowIndex] ?? null;

              return canInteractWithResultColumn ? (
                <div
                  ref={(element) => {
                    resultRowRefs.current[rowIndex] = element;
                  }}
                  tabIndex={0}
                  role="group"
                  aria-label={t("dnf.builder.exercise.resultGroupLabel", {
                    row: rowIndex + 1,
                  })}
                  onKeyDown={(event) => handleResultKeyDown(event, rowIndex)}
                  className="focus:ring-ring grid w-full max-w-36 grid-cols-2 gap-2 rounded-md focus:ring-2 focus:outline-none"
                >
                  {[false, true].map((value) => (
                    <button
                      key={String(value)}
                      type="button"
                      data-testid={`dnf-result-button-${rowIndex}-${value ? "1" : "0"}`}
                      aria-pressed={answer === value}
                      aria-label={t("dnf.builder.exercise.resultButtonLabel", {
                        row: rowIndex + 1,
                        value: formatBooleanValue(value),
                      })}
                      onClick={() => updateTruthTableAnswer(rowIndex, value)}
                      className={cn(
                        "border-border hover:bg-muted min-h-9 rounded-md border px-3 font-mono text-sm font-semibold transition-colors",
                        answer === value &&
                          "border-brand bg-brand text-brand-foreground shadow-sm hover:opacity-90",
                      )}
                    >
                      {formatBooleanValue(value)}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="bg-muted/40 border-border inline-flex min-h-9 min-w-12 items-center justify-center rounded-md border px-3 font-mono text-sm font-semibold">
                  {formatBooleanValue(row.result)}
                </span>
              );
            }}
          />
        </section>

        <ExerciseFeedbackPanel
          truthTable={truthTable}
          feedback={feedback}
          answeredRowCount={answeredRowCount}
          totalRowCount={truthTable.rows.length}
          hasDnfAnswer={hasDnfAttempt}
          isTruthTableProvided={!requiresTruthTableAnswers}
          isTruthTableEditable={canEditTruthTableResults}
        />
      </div>

      <section
        data-testid="dnf-exercise-answer-panel"
        className="border-border bg-card rounded-lg border p-4"
      >
        <div>
          <label
            className="text-foreground text-sm font-semibold"
            htmlFor="dnf-exercise-answer"
          >
            {t("dnf.builder.exercise.dnfLabel")}
          </label>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {t("dnf.builder.exercise.dnfHint")}
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {t("dnf.builder.keyboardAliases")}
          </p>
          <DnfOperatorToolbar
            inputRef={dnfInputRef}
            value={dnfAnswer}
            onChange={onDnfAnswerChange}
            className="mt-3"
          />
          <textarea
            ref={dnfInputRef}
            id="dnf-exercise-answer"
            data-testid="dnf-exercise-answer"
            value={dnfAnswer}
            onChange={(event) => onDnfAnswerChange(event.target.value)}
            onBlur={(event) =>
              onDnfAnswerChange(formatBooleanInput(event.target.value))
            }
            spellCheck="false"
            placeholder={t("dnf.builder.exercise.dnfPlaceholder")}
            className="border-border bg-background text-foreground focus:ring-ring mt-2 min-h-24 w-full resize-y rounded-md border p-3 font-mono text-sm leading-relaxed focus:ring-2 focus:outline-none"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            data-testid="dnf-check-answer"
            onClick={onCheck}
            className="bg-brand text-brand-foreground inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
          >
            <Search className="size-4" />
            {t("dnf.builder.exercise.check")}
          </button>
          <button
            type="button"
            data-testid="dnf-toggle-solution"
            onClick={onToggleSolution}
            disabled={!canShowSolution}
            className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Eye className="size-4" />
            {showSolution
              ? t("dnf.builder.exercise.hideSolution")
              : canShowSolution
                ? t("dnf.builder.exercise.showSolutionHelp")
                : t("dnf.builder.exercise.solutionAfterCheck")}
          </button>
        </div>

        {solution && <DnfSolutionBlock solution={solution} />}
      </section>
    </div>
  );
}
