import type { FAProgram } from "../domain/faTypes";
import { EPSILON } from "../domain/faTypes";
import type { FARuntime } from "../domain/faRuntime";

/** True when any state has an ε-transition. */
export function hasEpsilonTransitions(program: FAProgram): boolean {
  return Object.values(program.transitions).some(
    (row) => (row[EPSILON]?.length ?? 0) > 0,
  );
}

/**
 * The table's row symbols: the alphabet, plus a trailing ε row for an NFA that
 * actually uses ε-transitions. This is the single definition of the row order,
 * so the table, its highlight, and the editor can never disagree about it.
 */
export function buildTransitionTableSymbols(program: FAProgram): string[] {
  const symbols = [...program.alphabet];
  if (
    program.type === "NFA" &&
    hasEpsilonTransitions(program) &&
    !symbols.includes(EPSILON)
  ) {
    symbols.push(EPSILON);
  }
  return symbols;
}

/**
 * Build transition table headers: ["δ", ...states]
 */
export function buildTransitionTableHeaders(states: string[]): string[] {
  return ["δ", ...states];
}

/**
 * Build transition table rows.
 * Each row: [symbol, targets_for_state_0, targets_for_state_1, ...]
 * For DFA: single state name or "–"
 * For NFA: "{q0, q1}" or "–"
 */
export function buildTransitionTableRows(program: FAProgram): string[][] {
  return buildTransitionTableSymbols(program).map((symbol) => {
    const cells: string[] = [symbol];
    for (const state of program.states) {
      const targets = program.transitions[state]?.[symbol] ?? [];
      if (targets.length === 0) {
        cells.push("–");
      } else if (targets.length === 1) {
        cells.push(targets[0]);
      } else {
        cells.push(`{${targets.join(", ")}}`);
      }
    }
    return cells;
  });
}

/**
 * Returns the cell to highlight: the (symbol, fromState) pair of the most
 * recent transition taken — i.e. the same transition the graph highlights
 * via its active edge. This keeps graph and table in lockstep.
 */
export function getActiveTransitionCell(
  program: FAProgram,
  runtime: Pick<FARuntime, "transitionHistory">,
): { row: number; col: number } | null {
  const lastTransition =
    runtime.transitionHistory.length > 0
      ? runtime.transitionHistory[runtime.transitionHistory.length - 1]
      : null;

  if (!lastTransition || lastTransition.fromStates.length === 0) {
    return null;
  }

  const rowIndex = buildTransitionTableSymbols(program).indexOf(
    lastTransition.symbol,
  );
  if (rowIndex < 0) return null;

  const colIndex = program.states.indexOf(lastTransition.fromStates[0]);
  if (colIndex < 0) return null;

  return { row: rowIndex, col: colIndex + 1 };
}

/**
 * Get all active columns in the transition table (for NFA multi-state highlighting).
 */
export function getActiveColumns(
  program: FAProgram,
  activeStates: string[],
): number[] {
  return activeStates
    .map((s) => program.states.indexOf(s))
    .filter((i) => i >= 0)
    .map((i) => i + 1); // +1 for symbol column
}
