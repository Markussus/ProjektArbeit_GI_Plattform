import type { FAProgram } from "./faTypes";

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

export function validateFAProgram(program: FAProgram): FAProgramIssue[] {
  const issues: FAProgramIssue[] = [];

  if (program.states.length === 0) {
    issues.push({ code: "states_empty" });
  }

  if (!program.states.includes(program.startState)) {
    issues.push({
      code: "start_state_missing",
      params: { state: program.startState },
    });
  }

  for (const acc of program.acceptStates) {
    if (!program.states.includes(acc)) {
      issues.push({
        code: "accept_states_reference_invalid",
        params: { state: acc },
      });
    }
  }

  if (program.alphabet.length === 0) {
    issues.push({ code: "alphabet_empty" });
  }

  // Validate transitions
  for (const fromState of Object.keys(program.transitions)) {
    if (!program.states.includes(fromState)) {
      issues.push({
        code: "transition_source_invalid",
        params: { state: fromState },
      });
    }

    const symbolMap = program.transitions[fromState];
    for (const symbol of Object.keys(symbolMap)) {
      if (symbol !== "ε" && !program.alphabet.includes(symbol)) {
        issues.push({
          code: "transition_symbol_invalid",
          params: { symbol, state: fromState },
        });
      }

      if (program.type === "DFA" && symbol === "ε") {
        issues.push({
          code: "dfa_epsilon_transition",
          params: { state: fromState },
        });
      }

      const targets = symbolMap[symbol];
      if (program.type === "DFA" && targets.length > 1) {
        issues.push({
          code: "dfa_nondeterministic",
          params: { state: fromState, symbol },
        });
      }

      for (const target of targets) {
        if (!program.states.includes(target)) {
          issues.push({
            code: "transition_target_invalid",
            params: { state: fromState, symbol, target },
          });
        }
      }
    }
  }

  return issues;
}

export function isFAProgramValid(program: FAProgram): boolean {
  return validateFAProgram(program).length === 0;
}
