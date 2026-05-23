import type { TFunction } from "i18next";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { useTranslation } from "react-i18next";
import { createDnfTerm, formatDnfTerm } from "../domain/dnfDerivation";
import type { DnfExerciseCheckResult } from "../domain/dnfExerciseCheck";
import type { TruthTable } from "../domain/truthTable";

interface ExerciseFeedbackPanelProps {
  truthTable: TruthTable;
  feedback: DnfExerciseCheckResult | null;
  answeredRowCount: number;
  totalRowCount: number;
  hasDnfAnswer: boolean;
  isTruthTableProvided?: boolean;
  isTruthTableEditable?: boolean;
}

export function ExerciseFeedbackPanel({
  truthTable,
  feedback,
  answeredRowCount,
  totalRowCount,
  hasDnfAnswer,
  isTruthTableProvided = false,
  isTruthTableEditable = false,
}: ExerciseFeedbackPanelProps) {
  const { t } = useTranslation();

  if (!feedback) {
    return (
      <aside className="border-border bg-card h-full rounded-lg border p-5">
        <div className="flex items-center gap-3">
          <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-md">
            <LockKeyhole className="size-5" />
          </div>
          <div>
            <h2 className="text-foreground text-lg font-semibold">
              {t("dnf.builder.exercise.feedbackTitle")}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              {isTruthTableProvided
                ? isTruthTableEditable
                  ? t("dnf.builder.exercise.notCheckedEditable")
                  : t("dnf.builder.exercise.notCheckedDnfOnly")
                : t("dnf.builder.exercise.notChecked")}
            </p>
          </div>
        </div>
        <dl className="mt-5 grid gap-2 text-sm">
          <div className="border-border bg-muted/40 flex items-center justify-between rounded-md border px-3 py-2">
            <dt className="text-muted-foreground">
              {t("dnf.builder.exercise.progressTable")}
            </dt>
            <dd className="text-foreground font-medium">
              {isTruthTableProvided
                ? isTruthTableEditable
                  ? t("dnf.builder.exercise.progressTableEditable")
                  : t("dnf.builder.exercise.progressTableProvided")
                : t("dnf.builder.exercise.progressTableValue", {
                    answered: answeredRowCount,
                    total: totalRowCount,
                  })}
            </dd>
          </div>
          <div className="border-border bg-muted/40 flex items-center justify-between rounded-md border px-3 py-2">
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
      <aside className="h-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-5">
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
          isTruthTableProvided={isTruthTableProvided}
          isTruthTableEditable={isTruthTableEditable}
        />
      </aside>
    );
  }

  return (
    <aside className="border-border bg-card h-full rounded-lg border p-5">
      <h2 className="text-foreground text-lg font-semibold">
        {t("dnf.builder.exercise.feedbackTitle")}
      </h2>
      <FeedbackSummary
        feedback={feedback}
        totalRowCount={totalRowCount}
        truthTable={truthTable}
        hasTruthTableReady={hasTruthTableReady}
        isTruthTableProvided={isTruthTableProvided}
        isTruthTableEditable={isTruthTableEditable}
      />
      <ul className="mt-4 space-y-3 text-sm leading-relaxed">
        {buildFeedbackItems(feedback, truthTable, hasDnfAnswer, t).map(
          (item) => (
            <li
              key={item}
              className="border-border bg-muted/40 text-muted-foreground rounded-md border px-3 py-2"
            >
              {item}
            </li>
          ),
        )}
      </ul>
      <div className="border-border bg-muted/40 mt-4 rounded-md border px-3 py-2">
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
  isTruthTableProvided,
  isTruthTableEditable,
}: {
  feedback: DnfExerciseCheckResult;
  totalRowCount: number;
  truthTable: TruthTable;
  hasTruthTableReady: boolean;
  isTruthTableProvided: boolean;
  isTruthTableEditable: boolean;
}) {
  const { t } = useTranslation();
  const oneRows = truthTable.rows.flatMap((row, rowIndex) =>
    row.result ? [rowIndex] : [],
  );
  const canRevealOneRows = isTruthTableProvided || hasTruthTableReady;

  return (
    <dl className="mt-5 grid gap-2 text-sm">
      <div className="border-border bg-muted/40 flex items-center justify-between rounded-md border px-3 py-2">
        <dt className="text-muted-foreground">
          {t("dnf.builder.exercise.progressTable")}
        </dt>
        <dd className="text-foreground font-medium">
          {isTruthTableProvided
            ? isTruthTableEditable
              ? t("dnf.builder.exercise.progressTableEditable")
              : t("dnf.builder.exercise.progressTableProvided")
            : t("dnf.builder.exercise.tableCorrectValue", {
                correct: feedback.correctRowCount,
                total: totalRowCount,
              })}
        </dd>
      </div>
      <div className="border-border bg-muted/40 flex items-center justify-between rounded-md border px-3 py-2">
        <dt className="text-muted-foreground">
          {t("dnf.builder.exercise.progressDnf")}
        </dt>
        <dd className="text-foreground font-medium">
          {getDnfStatusLabel(feedback.dnf.status, hasTruthTableReady, t)}
        </dd>
      </div>
      {canRevealOneRows && (
        <div className="border-border bg-muted/40 rounded-md border px-3 py-2">
          <dt className="text-muted-foreground">
            {t("dnf.builder.exercise.oneRowsLabel")}
          </dt>
          <dd className="text-foreground mt-1 font-medium">
            {oneRows.length > 0
              ? formatRows(oneRows)
              : t("dnf.builder.exercise.noOneRows")}
          </dd>
        </div>
      )}
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
        count: feedback.incorrectRowCount,
        total: truthTable.rows.length,
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
