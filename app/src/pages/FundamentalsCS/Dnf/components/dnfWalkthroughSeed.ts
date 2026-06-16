import {
  analyzeDnfSource,
  analyzeDnfTruthTable,
} from "./DnfBuilder/application/dnfAnalysis";
import { formatBooleanExpressionForDisplay } from "./DnfBuilder/domain/booleanExpressionFormat";
import {
  createDnfAttemptDraft,
  type DnfAttemptTransferDraft,
  type DnfExpressionTransferDraft,
  type DnfTransferValue,
  type DnfTruthTableTransferDraft,
} from "./DnfBuilder/domain/dnfTransfer";
import {
  computeMinimalDnf,
  minimalDnfToExpression,
} from "./DnfBuilder/domain/quineMcCluskey";
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
    simplificationAnswer: formatMinimalDnf(truthTable),
  };
}

function formatMinimalDnf(truthTable: TruthTable): string {
  const minimal = computeMinimalDnf(truthTable);
  const expression = minimalDnfToExpression(minimal, truthTable.variables);

  return formatBooleanExpressionForDisplay(expression);
}
