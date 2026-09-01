import {
  analyzeDnfSource,
  analyzeDnfTruthTable,
} from "./DnfBuilder/application/dnfAnalysis";
import { formatBooleanExpressionForDisplay } from "./DnfBuilder/domain/booleanExpression";
import {
  createDnfAttemptDraft,
  type DnfAttemptTransferDraft,
  type DnfExpressionTransferDraft,
  type DnfTransferValue,
  type DnfTruthTableTransferDraft,
} from "./DnfBuilder/domain/dnfTransfer";
import { computeSmallestBooleanExpression } from "./DnfBuilder/domain/minimalExpression";
import {
  createTruthTableFromResults,
  type TruthTable,
} from "./DnfBuilder/domain/truthTable";
import type { DnfWalkthroughExample } from "../examples/walkthroughExamples";

type DnfExpressionWalkthroughExample = Extract<
  DnfWalkthroughExample,
  { mode: "expression_to_truth_table" }
>;

type DnfTruthTableWalkthroughExample = Extract<
  DnfWalkthroughExample,
  { mode: "truth_table_to_dnf" }
>;

export function buildDnfWalkthroughTransferValue(
  example: DnfWalkthroughExample,
): DnfTransferValue {
  if (example.mode === "expression_to_truth_table") {
    return {
      mode: "expression_to_truth_table",
      ...buildDnfExpressionWalkthroughValue(example),
    };
  }

  return {
    mode: "truth_table_to_dnf",
    ...buildDnfTruthTableWalkthroughValue(example),
  };
}

export function buildDnfExpressionWalkthroughValue(
  example: DnfExpressionWalkthroughExample,
): DnfExpressionTransferDraft {
  const analysis = analyzeDnfSource(example.expression);
  const attempt =
    analysis.status === "valid"
      ? buildSolvedAttempt(analysis.truthTable, analysis.formattedDnf)
      : createDnfAttemptDraft();

  return {
    expression: example.expression,
    committed: true,
    ...attempt,
  };
}

export function buildDnfTruthTableWalkthroughValue(
  example: DnfTruthTableWalkthroughExample,
): DnfTruthTableTransferDraft {
  const truthTable = createTruthTableFromResults(
    example.variables,
    example.resultValues,
  );
  const analysis = analyzeDnfTruthTable(truthTable);
  const attempt =
    analysis.status === "valid"
      ? buildSolvedAttempt(analysis.truthTable, analysis.formattedDnf)
      : createDnfAttemptDraft();

  return {
    variableCount: example.variables.length,
    resultValues: [...example.resultValues],
    committed: true,
    ...attempt,
  };
}

function buildSolvedAttempt(
  truthTable: TruthTable,
  formattedDnf: string,
): DnfAttemptTransferDraft {
  return {
    truthTableAnswers: truthTable.rows.map((row) => row.result),
    dnfAnswer: formattedDnf,
    simplificationAnswer: formatMinimalExpression(truthTable),
  };
}

function formatMinimalExpression(truthTable: TruthTable): string {
  return formatBooleanExpressionForDisplay(
    computeSmallestBooleanExpression(truthTable).expression,
  );
}
