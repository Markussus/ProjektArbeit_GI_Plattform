export function normalizeBooleanOperatorAliases(source: string): string {
  return source
    .replace(/[!~]/g, "¬")
    .replace(/&&?/g, "∧")
    .replace(/\|\|?/g, "∨");
}

export function formatBooleanInput(source: string): string {
  return normalizeBooleanOperatorAliases(source)
    .replace(/\s*¬\s*/g, "¬")
    .replace(/\s*([∧∨])\s*/g, " $1 ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s+/g, " ")
    .trim();
}
