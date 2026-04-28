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

export const MAX_DNF_VARIABLE_COUNT = 8;

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
  const derivation = deriveDnfFromTruthTable(truthTable);

  return {
    status: "valid",
    truthTable,
    derivation,
    formattedDnf: formatDnfExpression(derivation.dnf),
  };
}
