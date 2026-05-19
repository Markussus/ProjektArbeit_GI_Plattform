import type { FAProgram } from "./faTypes";
import { EPSILON } from "./faTypes";

/**
 * A single violation of DFA determinism rules.
 */
export interface DFAViolation {
  /** The source state */
  state: string;
  /** The input symbol (or "ε" for epsilon violations) */
  symbol: string;
  /** The multiple target states (only for nondeterministic transitions) */
  targets: string[];
  /** Type of violation */
  type: "nondeterministic" | "epsilon";
}

/**
 * Find all DFA-determinism violations in the given program.
 * Only meaningful when `program.type === "DFA"`.
 *
 * Violations:
 *  - A transition with more than one target state for the same symbol
 *  - Any ε-transition
 */
export function findDFAViolations(program: FAProgram): DFAViolation[] {
  if (program.type !== "DFA") return [];

  const violations: DFAViolation[] = [];

  for (const state of Object.keys(program.transitions)) {
    const symbolMap = program.transitions[state];
    for (const symbol of Object.keys(symbolMap)) {
      const targets = symbolMap[symbol];

      if (symbol === EPSILON) {
        violations.push({
          state,
          symbol,
          targets: [...targets],
          type: "epsilon",
        });
      } else if (targets.length > 1) {
        violations.push({
          state,
          symbol,
          targets: [...targets],
          type: "nondeterministic",
        });
      }
    }
  }

  return violations;
}

/**
 * Build a set of edge keys (`"fromState__toState"`) that are violations,
 * useful for quickly checking in the diagram renderer.
 */
export function buildViolationEdgeKeys(
  violations: DFAViolation[],
): Set<string> {
  const keys = new Set<string>();
  for (const v of violations) {
    for (const target of v.targets) {
      keys.add(`${v.state}__${target}`);
    }
  }
  return keys;
}
