import { CheckCircle2, LockKeyhole } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DnfExerciseCheckResult } from "../domain/dnfExerciseCheck";
import type { TruthTable } from "../domain/truthTable";
import {
  buildFeedbackItems,
  buildFeedbackTip,
  formatRows,
  getDnfStatusLabel,
  isTruthTableReady,
} from "./exerciseFeedback";

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
      <aside
        data-testid="dnf-exercise-feedback"
        data-status="not-checked"
        className="border-border bg-card h-full rounded-lg border p-5"
      >
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
      <aside
        data-testid="dnf-exercise-feedback"
        data-status="correct"
        className="h-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-5"
      >
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
    <aside
      data-testid="dnf-exercise-feedback"
      data-status="incorrect"
      className="border-border bg-card h-full rounded-lg border p-5"
    >
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
