import { useRef, type KeyboardEvent } from "react";
import { Eye, RotateCcw, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatBooleanValue } from "../domain/booleanExpression";
import { formatBooleanInput } from "../domain/booleanSyntax";
import type {
  DnfExerciseCheckResult,
  TruthTableAnswer,
} from "../domain/dnfExerciseCheck";
import type { TruthTable } from "../domain/truthTable";
import { DnfOperatorToolbar } from "./DnfOperatorToolbar";
import { ExerciseFeedbackPanel } from "./ExerciseFeedbackPanel";

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
                          {formatBooleanValue(row.assignment[variable])}
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
                                  value: formatBooleanValue(value),
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
                              {formatBooleanValue(value)}
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
