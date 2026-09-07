import type { FAProgram } from "./faTypes";
import { EPSILON } from "./faTypes";

/** Issue codes; each maps to a translation key shown next to the editor. */
export type FAProgramIssueCode =
  | "states_empty"
  | "start_state_missing"
  | "accept_states_reference_invalid"
  | "alphabet_empty"
  | "transition_source_invalid"
  | "transition_target_invalid"
  | "transition_symbol_invalid"
  | "dfa_nondeterministic"
  | "dfa_epsilon_transition";

export interface FAProgramIssue {
  code: FAProgramIssueCode;
  params?: Record<string, string>;
}

/**
 * Structural checks that only look at the declared sets — states, start state,
 * accept states and alphabet. Kept apart from the transition walk so neither
 * side has to carry the other's nesting.
 */
function collectDeclarationIssues(program: FAProgram): FAProgramIssue[] {
  const issues: FAProgramIssue[] = [];
  const states = new Set(program.states);

  if (program.states.length === 0) {
    issues.push({ code: "states_empty" });
  }

  if (!states.has(program.startState)) {
    issues.push({
      code: "start_state_missing",
      params: { state: program.startState },
    });
  }

  for (const acc of program.acceptStates) {
    if (!states.has(acc)) {
      issues.push({
        code: "accept_states_reference_invalid",
        params: { state: acc },
      });
    }
  }

  if (program.alphabet.length === 0) {
    issues.push({ code: "alphabet_empty" });
  }

  return issues;
}

/** Everything that can be wrong about the read symbol of one table row. */
function collectSymbolIssues(
  program: FAProgram,
  fromState: string,
  symbol: string,
  alphabet: Set<string>,
): FAProgramIssue[] {
  const issues: FAProgramIssue[] = [];

  if (symbol !== EPSILON && !alphabet.has(symbol)) {
    issues.push({
      code: "transition_symbol_invalid",
      params: { symbol, state: fromState },
    });
  }

  if (program.type === "DFA" && symbol === EPSILON) {
    issues.push({
      code: "dfa_epsilon_transition",
      params: { state: fromState },
    });
  }

  return issues;
}

/** Everything that can be wrong about the targets of one transition. */
function collectTargetIssues(
  program: FAProgram,
  fromState: string,
  symbol: string,
  targets: string[],
  states: Set<string>,
): FAProgramIssue[] {
  const issues: FAProgramIssue[] = [];

  if (program.type === "DFA" && targets.length > 1) {
    issues.push({
      code: "dfa_nondeterministic",
      params: { state: fromState, symbol },
    });
  }

  for (const target of targets) {
    if (!states.has(target)) {
      issues.push({
        code: "transition_target_invalid",
        params: { state: fromState, symbol, target },
      });
    }
  }

  return issues;
}

/**
 * Flat walk over the transition table: each row delegates its symbol and its
 * targets to a dedicated collector, so this function only decides *what* is
 * checked, never *how*.
 */
function collectTransitionIssues(program: FAProgram): FAProgramIssue[] {
  const issues: FAProgramIssue[] = [];
  const states = new Set(program.states);
  const alphabet = new Set(program.alphabet);

  for (const [fromState, symbolMap] of Object.entries(program.transitions)) {
    if (!states.has(fromState)) {
      issues.push({
        code: "transition_source_invalid",
        params: { state: fromState },
      });
    }

    for (const [symbol, targets] of Object.entries(symbolMap)) {
      issues.push(
        ...collectSymbolIssues(program, fromState, symbol, alphabet),
        ...collectTargetIssues(program, fromState, symbol, targets, states),
      );
    }
  }

  return issues;
}

export function validateFAProgram(program: FAProgram): FAProgramIssue[] {
  return [
    ...collectDeclarationIssues(program),
    ...collectTransitionIssues(program),
  ];
}

export function isFAProgramValid(program: FAProgram): boolean {
  return validateFAProgram(program).length === 0;
}
