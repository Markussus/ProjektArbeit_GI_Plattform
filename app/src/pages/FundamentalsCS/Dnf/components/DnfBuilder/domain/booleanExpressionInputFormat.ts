import { parseBooleanExpression } from "./dnfParser";
import { formatBooleanExpressionForDisplay } from "./booleanExpression";

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
