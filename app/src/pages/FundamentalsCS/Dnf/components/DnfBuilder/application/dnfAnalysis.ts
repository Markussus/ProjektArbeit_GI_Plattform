import { collectExpressionVariables } from "../domain/booleanExpression";
import type { DnfDerivation } from "../domain/dnfDerivation";
import {
  deriveDnfFromTruthTable,
  formatDnfExpression,
} from "../domain/dnfDerivation";
import {
  parseBooleanExpression,
  type DnfParseIssue,
} from "../domain/dnfParser";
import { generateTruthTable, type TruthTable } from "../domain/truthTable";

/**
 * Upper bound on variables for the DNF tool. Kept at 4 so the exact
 * minimization (minimal DNF via branch-and-bound and the smallest-formula
 * synthesis) stays fast and provably optimal — and because nobody practices
 * DNF with more than four variables anyway.
 */
export const MAX_DNF_VARIABLE_COUNT = 4;

export type DnfBuilderAnalysis =
  | {
      status: "valid";
      truthTable: TruthTable;
      derivation: DnfDerivation;
      formattedDnf: string;
    }
  | {
      status: "invalid";
      issue: DnfParseIssue;
    }
  | {
      status: "too_many_variables";
      variableCount: number;
      maxVariableCount: number;
    };

export function analyzeDnfSource(source: string): DnfBuilderAnalysis {
  const parseResult = parseBooleanExpression(source);

  if (!parseResult.ok) {
    return {
      status: "invalid",
      issue: parseResult.issue,
    };
  }

  const variables = collectExpressionVariables(parseResult.expression);

  if (variables.length > MAX_DNF_VARIABLE_COUNT) {
    return {
      status: "too_many_variables",
      variableCount: variables.length,
      maxVariableCount: MAX_DNF_VARIABLE_COUNT,
    };
  }

  const truthTable = generateTruthTable(parseResult.expression, variables);

  return analyzeDnfTruthTable(truthTable);
}

export function analyzeDnfTruthTable(
  truthTable: TruthTable,
): DnfBuilderAnalysis {
  if (truthTable.variables.length > MAX_DNF_VARIABLE_COUNT) {
    return {
      status: "too_many_variables",
      variableCount: truthTable.variables.length,
      maxVariableCount: MAX_DNF_VARIABLE_COUNT,
    };
  }

  const derivation = deriveDnfFromTruthTable(truthTable);

  return {
    status: "valid",
    truthTable,
    derivation,
    formattedDnf: formatDnfExpression(derivation.dnf),
  };
}
