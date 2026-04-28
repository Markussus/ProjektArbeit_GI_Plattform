import type { FAProgram } from "../domain/faTypes";

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
  const symbols = [...program.alphabet];
  if (program.type === "NFA") {
    // Include epsilon if any epsilon transitions exist
    const hasEpsilon = Object.values(program.transitions).some(
      (m) => m["ε"] && m["ε"].length > 0,
    );
    if (hasEpsilon && !symbols.includes("ε")) {
      symbols.push("ε");
    }
  }

  return symbols.map((symbol) => {
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
  runtime: {
    activeStates: string[];
    inputWord: string[];
    inputPosition: number;
    transitionHistory: Array<{
      fromStates: string[];
      symbol: string;
      toStates: string[];
    }>;
  },
): { row: number; col: number } | null {
  const lastTransition =
    runtime.transitionHistory.length > 0
      ? runtime.transitionHistory[runtime.transitionHistory.length - 1]
      : null;

  if (!lastTransition || lastTransition.fromStates.length === 0) {
    return null;
  }

  const symbols = [...program.alphabet];
  if (program.type === "NFA") {
    const hasEpsilon = Object.values(program.transitions).some(
      (m) => m["ε"] && m["ε"].length > 0,
    );
    if (hasEpsilon && !symbols.includes("ε")) {
      symbols.push("ε");
    }
  }

  const rowIndex = symbols.indexOf(lastTransition.symbol);
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
