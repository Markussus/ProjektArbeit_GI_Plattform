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
 * Get the active cell(s) in the transition table based on current runtime.
 */
export function getActiveTransitionCell(
  program: FAProgram,
  runtime: {
    activeStates: string[];
    inputWord: string[];
    inputPosition: number;
  },
): { row: number; col: number } | null {
  if (runtime.inputPosition >= runtime.inputWord.length) {
    return null;
  }

  const symbol = runtime.inputWord[runtime.inputPosition];
  const symbols = [...program.alphabet];
  if (program.type === "NFA") {
    const hasEpsilon = Object.values(program.transitions).some(
      (m) => m["ε"] && m["ε"].length > 0,
    );
    if (hasEpsilon && !symbols.includes("ε")) {
      symbols.push("ε");
    }
  }

  const rowIndex = symbols.indexOf(symbol);
  if (rowIndex < 0) return null;

  // For DFA, highlight the single active state column
  // For NFA, highlight the first active state
  if (runtime.activeStates.length > 0) {
    const colIndex = program.states.indexOf(runtime.activeStates[0]);
    if (colIndex >= 0) {
      return { row: rowIndex, col: colIndex + 1 }; // +1 for symbol column
    }
  }

  return null;
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
