import type { TFunction } from "i18next";
import { useRef, type KeyboardEvent } from "react";
import {
  CheckCircle2,
  Eye,
  LockKeyhole,
  RotateCcw,
  Search,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type {
  DnfExerciseCheckResult,
  TruthTableAnswer,
} from "../domain/dnfExerciseCheck";
import { formatBooleanInput } from "../domain/booleanSyntax";
import { createDnfTerm, formatDnfTerm } from "../domain/dnfDerivation";
import type { TruthTable } from "../domain/truthTable";
import { formatTruthTableValue } from "../domain/truthTable";
import { DnfOperatorToolbar } from "./DnfOperatorToolbar";

interface DnfExerciseWorkspaceProps {
  source: string;
  truthTable: TruthTable;
  truthTableAnswers: TruthTableAnswer[];
  dnfAnswer: string;
  feedback: DnfExerciseCheckResult | null;
  showSolution: boolean;
  onTruthTableAnswerChange: (rowIndex: number, value: boolean) => void;
  onDnfAnswerChange: (value: string) => void;
  onCheck: () => void;
  onReset: () => void;
  onToggleSolution: () => void;
}

export function DnfExerciseWorkspace({
  source,
  truthTable,
  truthTableAnswers,
  dnfAnswer,
  feedback,
  showSolution,
  onTruthTableAnswerChange,
  onDnfAnswerChange,
  onCheck,
  onReset,
  onToggleSolution,
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
    <div className="flex flex-col gap-5">
      <section className="border-border bg-background/40 rounded-lg border p-5">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {t("dnf.builder.exercise.taskTitle")}
        </p>
        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.65fr)]">
          <div>
            <p className="text-muted-foreground text-sm">
              {t("dnf.builder.exercise.given")}
            </p>
            <code className="border-border bg-card text-foreground mt-2 block rounded-md border p-3 font-mono text-sm">
              {source}
            </code>
          </div>
          <div className="border-border bg-card/50 rounded-md border p-3">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {t("dnf.builder.exercise.stepsTitle")}
            </p>
            <ol className="mt-3 space-y-2 text-sm leading-relaxed">
              <li className="flex gap-2">
                <span className="bg-brand text-brand-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  1
                </span>
                <span className="text-foreground">
                  {t("dnf.builder.exercise.instructionStepTable")}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="bg-brand text-brand-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  2
                </span>
                <span className="text-foreground">
                  {t("dnf.builder.exercise.instructionStepDnf")}
                </span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.6fr)]">
        <section className="border-border bg-background/40 rounded-lg border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-foreground text-lg font-semibold">
                {t("dnf.builder.exercise.tableTitle")}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("dnf.builder.exercise.tableHint")}
              </p>
            </div>
          </div>

          <div className="border-border mt-4 overflow-x-auto rounded-lg border">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th
                    scope="col"
                    className="border-border w-20 border-r px-3 py-2 text-left font-semibold"
                  >
                    {t("dnf.builder.exercise.rowHeader")}
                  </th>
                  {truthTable.variables.map((variable) => (
                    <th
                      key={variable}
                      scope="col"
                      className="border-border border-r px-3 py-2 text-left font-semibold"
                    >
                      {variable}
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-2 text-left font-semibold">
                    {t("dnf.builder.truthTableResult")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {truthTable.rows.map((row, rowIndex) => {
                  const answer = truthTableAnswers[rowIndex] ?? null;
                  const issue = issueByRow.get(rowIndex);
                  const isChecked = feedback !== null;
                  const isCorrect = isChecked && !issue;

                  return (
                    <tr
                      key={rowIndex}
                      className={cn(
                        "border-border border-t",
                        issue?.actual === null && "bg-amber-500/10",
                        issue?.actual !== null &&
                          issue !== undefined &&
                          "bg-destructive/10",
                        isCorrect && "bg-emerald-500/10",
                      )}
                    >
                      <td className="border-border text-muted-foreground border-r px-3 py-2 font-mono">
                        {rowIndex + 1}
                      </td>
                      {truthTable.variables.map((variable) => (
                        <td
                          key={variable}
                          className="border-border border-r px-3 py-2 font-mono"
                        >
                          {formatTruthTableValue(row.assignment[variable])}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <div
                          ref={(element) => {
                            resultRowRefs.current[rowIndex] = element;
                          }}
                          tabIndex={0}
                          role="group"
                          aria-label={t(
                            "dnf.builder.exercise.resultGroupLabel",
                            { row: rowIndex + 1 },
                          )}
                          onKeyDown={(event) =>
                            handleResultKeyDown(event, rowIndex)
                          }
                          className="focus:ring-ring grid w-full max-w-36 grid-cols-2 gap-2 rounded-md focus:ring-2 focus:outline-none"
                        >
                          {[false, true].map((value) => (
                            <button
                              key={String(value)}
                              type="button"
                              aria-pressed={answer === value}
                              aria-label={t(
                                "dnf.builder.exercise.resultButtonLabel",
                                {
                                  row: rowIndex + 1,
                                  value: formatTruthTableValue(value),
                                },
                              )}
                              onClick={() =>
                                updateTruthTableAnswer(rowIndex, value)
                              }
                              className={cn(
                                "border-border hover:bg-muted min-h-9 rounded-md border px-3 font-mono text-sm font-semibold transition-colors",
                                answer === value &&
                                  "border-brand bg-brand text-brand-foreground shadow-sm hover:opacity-90",
                              )}
                            >
                              {formatTruthTableValue(value)}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
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
              value={dnfAnswer}
              onChange={(event) => onDnfAnswerChange(event.target.value)}
              onBlur={(event) =>
                onDnfAnswerChange(formatBooleanInput(event.target.value))
              }
              spellCheck="false"
              placeholder={t("dnf.builder.exercise.dnfPlaceholder")}
              className="border-border bg-card text-foreground focus:ring-ring mt-2 min-h-24 w-full resize-y rounded-md border p-3 font-mono text-sm leading-relaxed focus:ring-2 focus:outline-none"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onCheck}
              className="bg-brand text-brand-foreground inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
            >
              <Search className="size-4" />
              {t("dnf.builder.exercise.check")}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors"
            >
              <RotateCcw className="size-4" />
              {t("dnf.builder.reset")}
            </button>
            <button
              type="button"
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
        </section>

        <ExerciseFeedbackPanel
          truthTable={truthTable}
          feedback={feedback}
          answeredRowCount={answeredRowCount}
          totalRowCount={truthTable.rows.length}
          hasDnfAnswer={hasDnfAttempt}
        />
      </div>
    </div>
  );
}

function ExerciseFeedbackPanel({
  truthTable,
  feedback,
  answeredRowCount,
  totalRowCount,
  hasDnfAnswer,
}: {
  truthTable: TruthTable;
  feedback: DnfExerciseCheckResult | null;
  answeredRowCount: number;
  totalRowCount: number;
  hasDnfAnswer: boolean;
}) {
  const { t } = useTranslation();

  if (!feedback) {
    return (
      <aside className="border-border bg-background/40 rounded-lg border p-5">
        <div className="flex items-center gap-3">
          <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-md">
            <LockKeyhole className="size-5" />
          </div>
          <div>
            <h2 className="text-foreground text-lg font-semibold">
              {t("dnf.builder.exercise.feedbackTitle")}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              {t("dnf.builder.exercise.notChecked")}
            </p>
          </div>
        </div>
        <dl className="mt-5 grid gap-2 text-sm">
          <div className="border-border bg-card flex items-center justify-between rounded-md border px-3 py-2">
            <dt className="text-muted-foreground">
              {t("dnf.builder.exercise.progressTable")}
            </dt>
            <dd className="text-foreground font-medium">
              {t("dnf.builder.exercise.progressTableValue", {
                answered: answeredRowCount,
                total: totalRowCount,
              })}
            </dd>
          </div>
          <div className="border-border bg-card flex items-center justify-between rounded-md border px-3 py-2">
            <dt className="text-muted-foreground">
              {t("dnf.builder.exercise.progressDnf")}
            </dt>
            <dd className="text-foreground font-medium">
              {hasDnfAnswer
                ? t("dnf.builder.exercise.progressDnfReady")
                : t("dnf.builder.exercise.progressDnfMissing")}
            </dd>
          </div>
        </dl>
      </aside>
    );
  }

  const hasTruthTableReady = isTruthTableReady(feedback);

  if (feedback.isCorrect) {
    return (
      <aside className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h2 className="text-foreground text-lg font-semibold">
              {t("dnf.builder.exercise.correctTitle")}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              {t("dnf.builder.exercise.correctDesc")}
            </p>
          </div>
        </div>
        <FeedbackSummary
          feedback={feedback}
          totalRowCount={totalRowCount}
          truthTable={truthTable}
          hasTruthTableReady={hasTruthTableReady}
        />
      </aside>
    );
  }

  return (
    <aside className="border-border bg-background/40 rounded-lg border p-5">
      <h2 className="text-foreground text-lg font-semibold">
        {t("dnf.builder.exercise.feedbackTitle")}
      </h2>
      <FeedbackSummary
        feedback={feedback}
        totalRowCount={totalRowCount}
        truthTable={truthTable}
        hasTruthTableReady={hasTruthTableReady}
      />
      <ul className="mt-4 space-y-3 text-sm leading-relaxed">
        {buildFeedbackItems(feedback, truthTable, hasDnfAnswer, t).map(
          (item) => (
            <li
              key={item}
              className="border-border bg-card text-muted-foreground rounded-md border px-3 py-2"
            >
              {item}
            </li>
          ),
        )}
      </ul>
      <div className="border-border bg-card mt-4 rounded-md border px-3 py-2">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {t("dnf.builder.exercise.tipTitle")}
        </p>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          {buildFeedbackTip(feedback, t)}
        </p>
      </div>
      <p className="text-muted-foreground mt-4 text-xs leading-relaxed">
        {t("dnf.builder.exercise.solutionHint")}
      </p>
    </aside>
  );
}

function FeedbackSummary({
  feedback,
  totalRowCount,
  truthTable,
  hasTruthTableReady,
}: {
  feedback: DnfExerciseCheckResult;
  totalRowCount: number;
  truthTable: TruthTable;
  hasTruthTableReady: boolean;
}) {
  const { t } = useTranslation();
  const oneRows = truthTable.rows.flatMap((row, rowIndex) =>
    row.result ? [rowIndex] : [],
  );

  return (
    <dl className="mt-5 grid gap-2 text-sm">
      <div className="border-border bg-card flex items-center justify-between rounded-md border px-3 py-2">
        <dt className="text-muted-foreground">
          {t("dnf.builder.exercise.progressTable")}
        </dt>
        <dd className="text-foreground font-medium">
          {t("dnf.builder.exercise.tableCorrectValue", {
            correct: feedback.correctRowCount,
            total: totalRowCount,
          })}
        </dd>
      </div>
      <div className="border-border bg-card flex items-center justify-between rounded-md border px-3 py-2">
        <dt className="text-muted-foreground">
          {t("dnf.builder.exercise.progressDnf")}
        </dt>
        <dd className="text-foreground font-medium">
          {getDnfStatusLabel(feedback.dnf.status, hasTruthTableReady, t)}
        </dd>
      </div>
      <div className="border-border bg-card rounded-md border px-3 py-2">
        <dt className="text-muted-foreground">
          {t("dnf.builder.exercise.oneRowsLabel")}
        </dt>
        <dd className="text-foreground mt-1 font-medium">
          {oneRows.length > 0
            ? formatRows(oneRows)
            : t("dnf.builder.exercise.noOneRows")}
        </dd>
      </div>
    </dl>
  );
}

function buildFeedbackItems(
  feedback: DnfExerciseCheckResult,
  truthTable: TruthTable,
  hasDnfAnswer: boolean,
  t: TFunction,
): string[] {
  const items: string[] = [];
  const hasTruthTableReady = isTruthTableReady(feedback);

  if (feedback.unansweredRowCount > 0) {
    items.push(
      t("dnf.builder.exercise.tableIncomplete", {
        count: feedback.unansweredRowCount,
      }),
    );
  }

  if (feedback.incorrectRowCount > 0) {
    items.push(
      t("dnf.builder.exercise.tableWrongRows", {
        rows: formatRows(
          feedback.truthTableIssues
            .filter((issue) => issue.actual !== null)
            .map((issue) => issue.rowIndex),
        ),
      }),
    );
  }

  if (!hasTruthTableReady) {
    if (hasDnfAnswer) {
      items.push(t("dnf.builder.exercise.dnfDeferredUntilTable"));
    }

    return items;
  }

  if (feedback.dnf.status === "empty") {
    items.push(t("dnf.builder.exercise.dnfEmpty"));
  }

  if (feedback.dnf.status === "syntax_error") {
    items.push(t("dnf.builder.exercise.dnfSyntax"));
  }

  if (feedback.dnf.status === "equivalent_not_canonical") {
    items.push(t("dnf.builder.exercise.dnfEquivalentNotCanonical"));
  }

  if (feedback.dnf.status === "not_equivalent") {
    if (feedback.dnf.missingTermRows.length > 0) {
      items.push(
        t("dnf.builder.exercise.dnfMissingTerms", {
          rows: formatRows(feedback.dnf.missingTermRows),
          count: feedback.dnf.missingTermRows.length,
        }),
      );
      items.push(
        t("dnf.builder.exercise.dnfExpectedTerms", {
          terms: formatRowTerms(feedback.dnf.missingTermRows, truthTable),
        }),
      );
    }

    if (feedback.dnf.extraTermRows.length > 0) {
      items.push(
        t("dnf.builder.exercise.dnfExtraTerms", {
          rows: formatRows(feedback.dnf.extraTermRows),
        }),
      );
      items.push(
        t("dnf.builder.exercise.dnfExtraTermDetails", {
          terms: formatRowTerms(feedback.dnf.extraTermRows, truthTable),
        }),
      );
    }

    if (
      feedback.dnf.missingTermRows.length === 0 &&
      feedback.dnf.extraTermRows.length === 0
    ) {
      items.push(
        t("dnf.builder.exercise.dnfWrongRows", {
          rows: formatRows(
            feedback.dnf.mismatchRows.map((issue) => issue.rowIndex),
          ),
        }),
      );
    }
  }

  return items;
}

function formatRowTerms(rowIndices: number[], truthTable: TruthTable): string {
  return rowIndices
    .map((rowIndex) => {
      const row = truthTable.rows[rowIndex];
      const term = row
        ? formatDnfTerm(createDnfTerm(truthTable.variables, row))
        : "?";

      return `${rowIndex + 1}: ${term}`;
    })
    .join("; ");
}

function buildFeedbackTip(
  feedback: DnfExerciseCheckResult,
  t: TFunction,
): string {
  if (feedback.unansweredRowCount > 0) {
    return t("dnf.builder.exercise.tipCompleteTable");
  }

  if (feedback.incorrectRowCount > 0) {
    return t("dnf.builder.exercise.tipTableRows");
  }

  if (feedback.dnf.status === "empty") {
    return t("dnf.builder.exercise.tipStartDnf");
  }

  if (feedback.dnf.status === "syntax_error") {
    return t("dnf.builder.exercise.tipSyntax");
  }

  if (feedback.dnf.status === "equivalent_not_canonical") {
    return t("dnf.builder.exercise.tipCanonical");
  }

  if (feedback.dnf.missingTermRows.length > 0) {
    return t("dnf.builder.exercise.tipMissingTerms");
  }

  return t("dnf.builder.exercise.tipCompareRows");
}

function getDnfStatusLabel(
  status: DnfExerciseCheckResult["dnf"]["status"],
  hasTruthTableReady: boolean,
  t: TFunction,
): string {
  if (!hasTruthTableReady) {
    return t("dnf.builder.exercise.dnfStatus.deferred" as never);
  }

  return t(`dnf.builder.exercise.dnfStatus.${status}` as never);
}

function isTruthTableReady(feedback: DnfExerciseCheckResult): boolean {
  return feedback.unansweredRowCount === 0 && feedback.incorrectRowCount === 0;
}

function formatRows(rowIndices: number[]): string {
  return rowIndices.map((rowIndex) => rowIndex + 1).join(", ");
}
