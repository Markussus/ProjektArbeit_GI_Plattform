import type { FAProgram } from "./faTypes";
import { EPSILON } from "./faTypes";

/**
 * A single violation of DFA determinism rules.
 */
export interface DFAViolation {
  state: string;
  symbol: string;
  targets: string[];
  type: "nondeterministic" | "epsilon";
}

/**
 * Every DFA-determinism violation: a symbol with more than one target, or an
 * ε-transition. Only meaningful when `program.type === "DFA"`.
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
