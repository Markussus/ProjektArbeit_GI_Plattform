import {
  collectExpressionVariables,
  formatBooleanValue,
  type BooleanExpression,
  type VariableAssignment,
} from "./booleanExpression";
import { evaluateBooleanExpression } from "./dnfEvaluator";

export interface TruthTableRow {
  assignment: VariableAssignment;
  result: boolean;
}

export interface TruthTable {
  variables: string[];
  rows: TruthTableRow[];
}

export function generateTruthTable(
  expression: BooleanExpression,
  variables = collectExpressionVariables(expression),
): TruthTable {
  const rowCount = 2 ** variables.length;
  const rows = Array.from({ length: rowCount }, (_, rowIndex) => {
    const assignment = buildAssignment(variables, rowIndex);

    return {
      assignment,
      result: evaluateBooleanExpression(expression, assignment),
    };
  });

  return { variables, rows };
}

export function formatTruthTableValue(value: boolean): "0" | "1" {
  return formatBooleanValue(value);
}

function buildAssignment(
  variables: string[],
  rowIndex: number,
): VariableAssignment {
  return variables.reduce<VariableAssignment>((assignment, variable, index) => {
    const bitPosition = variables.length - index - 1;
    const bit = Math.floor(rowIndex / 2 ** bitPosition) % 2;

    return {
      ...assignment,
      [variable]: bit === 1,
    };
  }, {});
}
