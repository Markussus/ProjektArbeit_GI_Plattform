export type BooleanBinaryOperator = "and" | "or";

export type BooleanExpression =
  | { type: "constant"; value: boolean }
  | { type: "variable"; name: string }
  | { type: "not"; operand: BooleanExpression }
  | {
      type: "binary";
      operator: BooleanBinaryOperator;
      left: BooleanExpression;
      right: BooleanExpression;
    };

export type VariableAssignment = Record<string, boolean>;

export function collectExpressionVariables(
  expression: BooleanExpression,
): string[] {
  const variables = new Set<string>();

  visitExpression(expression, (node) => {
    if (node.type === "variable") {
      variables.add(node.name);
    }
  });

  return [...variables].sort((left, right) => left.localeCompare(right));
}

export function evaluateBooleanExpression(
  expression: BooleanExpression,
  assignment: VariableAssignment,
): boolean {
  switch (expression.type) {
    case "constant":
      return expression.value;
    case "variable": {
      const value = assignment[expression.name];

      if (value === undefined) {
        throw new Error(
          `Missing boolean value for variable '${expression.name}'.`,
        );
      }

      return value;
    }
    case "not":
      return !evaluateBooleanExpression(expression.operand, assignment);
    case "binary": {
      const left = evaluateBooleanExpression(expression.left, assignment);
      const right = evaluateBooleanExpression(expression.right, assignment);
      return expression.operator === "and" ? left && right : left || right;
    }
  }
}

export function formatBooleanValue(value: boolean): "0" | "1" {
  return value ? "1" : "0";
}

function visitExpression(
  expression: BooleanExpression,
  visitor: (node: BooleanExpression) => void,
): void {
  visitor(expression);

  if (expression.type === "not") {
    visitExpression(expression.operand, visitor);
    return;
  }

  if (expression.type === "binary") {
    visitExpression(expression.left, visitor);
    visitExpression(expression.right, visitor);
  }
}
