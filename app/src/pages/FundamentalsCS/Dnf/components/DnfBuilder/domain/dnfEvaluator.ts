import type {
  BooleanExpression,
  VariableAssignment,
} from "./booleanExpression";

export function evaluateBooleanExpression(
  expression: BooleanExpression,
  assignment: VariableAssignment,
): boolean {
  switch (expression.type) {
    case "constant":
      return expression.value;
    case "variable":
      return readVariableValue(expression.name, assignment);
    case "not":
      return !evaluateBooleanExpression(expression.operand, assignment);
    case "binary": {
      const left = evaluateBooleanExpression(expression.left, assignment);
      const right = evaluateBooleanExpression(expression.right, assignment);
      return expression.operator === "and" ? left && right : left || right;
    }
  }
}

function readVariableValue(
  variable: string,
  assignment: VariableAssignment,
): boolean {
  const value = assignment[variable];

  if (value === undefined) {
    throw new Error(`Missing boolean value for variable '${variable}'.`);
  }

  return value;
}
