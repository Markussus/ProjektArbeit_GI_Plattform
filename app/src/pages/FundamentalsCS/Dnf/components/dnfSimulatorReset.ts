import {
  createDnfAttemptDraft,
  type DnfTransferValue,
} from "./DnfBuilder/domain/dnfTransfer";
import type { DnfWalkthroughExample } from "../examples/walkthroughExamples";

export type DnfSimulatorMode =
  | "expression_to_truth_table"
  | "truth_table_to_dnf";

interface DnfResetValueInput {
  hasSelectedExercise: boolean;
  storedValue: DnfTransferValue | null;
  visibleMode: DnfSimulatorMode;
  walkthroughExample: DnfWalkthroughExample | null;
}

export function buildDnfResetValue({
  hasSelectedExercise,
  storedValue,
  visibleMode,
  walkthroughExample,
}: DnfResetValueInput): DnfTransferValue | null {
  if (hasSelectedExercise) {
    return {
      mode: "exercise_attempt",
      ...createDnfAttemptDraft(),
    };
  }

  if (visibleMode === "expression_to_truth_table") {
    return buildExpressionResetValue(storedValue, walkthroughExample);
  }

  return buildTruthTableResetValue(storedValue, walkthroughExample);
}

function buildExpressionResetValue(
  storedValue: DnfTransferValue | null,
  walkthroughExample: DnfWalkthroughExample | null,
): DnfTransferValue | null {
  const currentValue =
    storedValue?.mode === "expression_to_truth_table" ? storedValue : null;
  const exampleValue =
    walkthroughExample?.mode === "expression_to_truth_table"
      ? walkthroughExample
      : null;

  if (exampleValue) {
    return {
      mode: "expression_to_truth_table",
      expression: exampleValue.expression,
      committed: currentValue?.committed ?? false,
      ...createDnfAttemptDraft(),
    };
  }

  if (currentValue?.committed) {
    return {
      mode: "expression_to_truth_table",
      expression: currentValue.expression,
      committed: true,
      ...createDnfAttemptDraft(),
    };
  }

  return null;
}

function buildTruthTableResetValue(
  storedValue: DnfTransferValue | null,
  walkthroughExample: DnfWalkthroughExample | null,
): DnfTransferValue {
  const currentValue =
    storedValue?.mode === "truth_table_to_dnf" ? storedValue : null;
  const exampleValue =
    walkthroughExample?.mode === "truth_table_to_dnf"
      ? walkthroughExample
      : null;

  if (exampleValue) {
    return {
      mode: "truth_table_to_dnf",
      variableCount: exampleValue.variables.length,
      resultValues: exampleValue.resultValues,
      committed: currentValue?.committed ?? false,
      ...createDnfAttemptDraft(),
    };
  }

  const variableCount = currentValue?.variableCount ?? 3;

  return {
    mode: "truth_table_to_dnf",
    variableCount,
    resultValues: currentValue?.committed
      ? currentValue.resultValues
      : Array.from({ length: 2 ** variableCount }, () => false),
    committed: currentValue?.committed ?? false,
    ...createDnfAttemptDraft(),
  };
}
