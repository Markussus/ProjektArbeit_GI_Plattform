import type { BooleanExpression } from "./booleanExpression";
import { parseBooleanExpression } from "./dnfParser";

/**
 * Pretty-print a boolean expression with parentheses chosen for readability:
 * every AND-group that sits inside an OR is wrapped in parens, matching the
 * canonical DNF style shown elsewhere in the UI. Pure expressions without an
 * outer OR are rendered in minimal-paren form.
 */
export function formatBooleanExpressionForDisplay(
  expression: BooleanExpression,
): string {
  return renderNode(expression, "root");
}

/**
 * Parse `source`, then re-emit it with display-friendly parens. Falls back to
 * the original string when parsing fails (so partial / mid-edit input is left
 * alone instead of being silently dropped).
 */
export function reformatBooleanExpressionInput(source: string): string {
  const parseResult = parseBooleanExpression(source);
  if (!parseResult.ok) {
    return source;
  }
  return formatBooleanExpressionForDisplay(parseResult.expression);
}

type ParentContext = "or" | "and" | "not" | "root";

function renderNode(
  node: BooleanExpression,
  parent: ParentContext,
): string {
  switch (node.type) {
    case "constant":
      return node.value ? "1" : "0";
    case "variable":
      return node.name;
    case "not":
      return `¬${renderNode(node.operand, "not")}`;
    case "binary": {
      if (node.operator === "or") {
        const text = flattenOr(node)
          .map((child) => renderNode(child, "or"))
          .join(" ∨ ");
        return parent === "and" || parent === "not" ? `(${text})` : text;
      }

      const inner = flattenAnd(node)
        .map((child) => renderNode(child, "and"))
        .join(" ∧ ");
      return parent === "or" || parent === "not" ? `(${inner})` : inner;
    }
  }
}

function flattenOr(node: BooleanExpression): BooleanExpression[] {
  if (node.type === "binary" && node.operator === "or") {
    return [...flattenOr(node.left), ...flattenOr(node.right)];
  }
  return [node];
}

function flattenAnd(node: BooleanExpression): BooleanExpression[] {
  if (node.type === "binary" && node.operator === "and") {
    return [...flattenAnd(node.left), ...flattenAnd(node.right)];
  }
  return [node];
}
