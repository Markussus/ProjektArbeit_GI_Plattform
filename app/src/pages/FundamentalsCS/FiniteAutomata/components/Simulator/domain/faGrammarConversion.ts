import type { FAProgram, RegularGrammar, FATransitionMap } from "./faTypes";

/**
 * Convert a right-linear regular grammar to an NFA.
 *
 * Mapping:
 * - Non-terminals → states
 * - Terminals → alphabet symbols
 * - A → aB becomes transition(A, a) → B
 * - A → a  becomes transition(A, a) → FINAL (dedicated accept state)
 * - A → ε  marks state A as accepting (no ε-transition is emitted —
 *          all transitions in the result consume input symbols only)
 * - Start symbol → start state
 */
export function grammarToAutomaton(grammar: RegularGrammar): FAProgram {
  // The synthetic accept state must not clash with a non-terminal the user
  // happened to name "sF" — otherwise `A -> a` and `A -> asF` would collapse
  // into the same transition and the grammar's own sF would become accepting.
  const FINAL_STATE = uniqueFinalStateName(grammar.nonTerminals);

  const epsilonProducers = new Set(grammar.epsilonProducingNonTerminals ?? []);
  const needsFinalState = grammar.productions.some(
    (r) => r.nextNonTerminal === null,
  );

  const states = [...grammar.nonTerminals];
  if (needsFinalState) {
    states.push(FINAL_STATE);
  }

  const alphabet = [...grammar.terminals];
  const transitions: FATransitionMap = {};

  // Initialize empty transition map
  for (const state of states) {
    transitions[state] = {};
  }

  // Convert productions to transitions (ε productions intentionally skipped)
  for (const rule of grammar.productions) {
    const from = rule.lhs;
    const symbol = rule.terminal;

    if (!transitions[from]) {
      transitions[from] = {};
    }

    if (!transitions[from][symbol]) {
      transitions[from][symbol] = [];
    }

    if (rule.nextNonTerminal) {
      // A → aB: transition from A to B on symbol a
      if (!transitions[from][symbol].includes(rule.nextNonTerminal)) {
        transitions[from][symbol].push(rule.nextNonTerminal);
      }
    } else {
      // A → a: transition from A to FINAL on symbol a
      if (!transitions[from][symbol].includes(FINAL_STATE)) {
        transitions[from][symbol].push(FINAL_STATE);
      }
    }
  }

  const acceptStates: string[] = [];
  if (needsFinalState) acceptStates.push(FINAL_STATE);
  for (const nt of grammar.nonTerminals) {
    if (epsilonProducers.has(nt) && !acceptStates.includes(nt)) {
      acceptStates.push(nt);
    }
  }

  // Determine if it's DFA or NFA
  let isDFA = true;
  for (const state of Object.keys(transitions)) {
    for (const symbol of Object.keys(transitions[state])) {
      if (transitions[state][symbol].length > 1) {
        isDFA = false;
        break;
      }
    }
    if (!isDFA) break;
  }

  return {
    type: isDFA ? "DFA" : "NFA",
    states,
    alphabet,
    transitions,
    startState: grammar.startSymbol,
    acceptStates,
  };
}

/** "sF", or "sF2", "sF3", … if the grammar already uses that name. */
function uniqueFinalStateName(nonTerminals: string[]): string {
  const taken = new Set(nonTerminals);
  if (!taken.has("sF")) return "sF";
  let suffix = 2;
  while (taken.has(`sF${suffix}`)) suffix++;
  return `sF${suffix}`;
}

/**
 * Validate that a grammar is right-linear (regular).
 */
export function validateRegularGrammar(grammar: RegularGrammar): string[] {
  const errors: string[] = [];

  if (grammar.nonTerminals.length === 0) {
    errors.push("grammar_no_nonterminals");
  }

  const hasEpsilonProductions =
    (grammar.epsilonProducingNonTerminals?.length ?? 0) > 0;
  if (grammar.terminals.length === 0 && !hasEpsilonProductions) {
    errors.push("grammar_no_terminals");
  }

  if (!grammar.nonTerminals.includes(grammar.startSymbol)) {
    errors.push("grammar_start_invalid");
  }

  for (const rule of grammar.productions) {
    if (!grammar.nonTerminals.includes(rule.lhs)) {
      errors.push("grammar_lhs_invalid");
    }
    if (!grammar.terminals.includes(rule.terminal)) {
      errors.push("grammar_terminal_invalid");
    }
    if (
      rule.nextNonTerminal !== null &&
      !grammar.nonTerminals.includes(rule.nextNonTerminal)
    ) {
      errors.push("grammar_rhs_nonterminal_invalid");
    }
  }

  for (const nt of grammar.epsilonProducingNonTerminals ?? []) {
    if (!grammar.nonTerminals.includes(nt)) {
      errors.push("grammar_epsilon_lhs_invalid");
    }
  }

  return errors;
}
