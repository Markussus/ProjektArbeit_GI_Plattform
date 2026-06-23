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
 * Upper bound on variables for the DNF tool. Capped at 4 so every exercise
 * stays in the range where the exact smallest-form synthesis
 * (MAX_EXACT_OPTIMAL_VARIABLES) is guaranteed globally optimal — the
 * DNF-derived fallback above four variables is therefore only reached by other
 * callers such as Moore/Mealy, never from the DNF tool itself.
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
