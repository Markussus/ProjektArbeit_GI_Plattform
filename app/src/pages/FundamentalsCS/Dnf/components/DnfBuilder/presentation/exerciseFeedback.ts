import type { TFunction } from "i18next";
import { createDnfTerm, formatDnfTerm } from "../domain/dnfDerivation";
import type { DnfExerciseCheckResult } from "../domain/dnfExerciseCheck";
import type { TruthTable } from "../domain/truthTable";

export function buildFeedbackItems(
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

export function buildFeedbackTip(
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

export function getDnfStatusLabel(
  status: DnfExerciseCheckResult["dnf"]["status"],
  hasTruthTableReady: boolean,
  t: TFunction,
): string {
  if (!hasTruthTableReady) {
    return t("dnf.builder.exercise.dnfStatus.deferred" as never);
  }

  return t(`dnf.builder.exercise.dnfStatus.${status}` as never);
}

export function isTruthTableReady(feedback: DnfExerciseCheckResult): boolean {
  return feedback.unansweredRowCount === 0 && feedback.incorrectRowCount === 0;
}

export function formatRows(rowIndices: number[]): string {
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
