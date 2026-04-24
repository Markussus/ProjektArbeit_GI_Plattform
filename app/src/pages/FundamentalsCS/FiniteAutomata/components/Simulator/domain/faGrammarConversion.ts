import type { FAProgram, RegularGrammar, FATransitionMap } from "./faTypes";

/**
 * Convert a right-linear regular grammar to an NFA.
 *
 * Mapping:
 * - Non-terminals → states
 * - Terminals → alphabet symbols
 * - A → aB becomes transition(A, a) → B
 * - A → a  becomes transition(A, a) → FINAL (dedicated accept state)
 * - Start symbol → start state
 */
export function grammarToAutomaton(grammar: RegularGrammar): FAProgram {
  const FINAL_STATE = "qF";

  const states = [...grammar.nonTerminals];
  if (!states.includes(FINAL_STATE)) {
    states.push(FINAL_STATE);
  }

  const alphabet = [...grammar.terminals];
  const transitions: FATransitionMap = {};

  // Initialize empty transition map
  for (const state of states) {
    transitions[state] = {};
  }

  // Convert productions to transitions
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
    acceptStates: [FINAL_STATE],
  };
}

/**
 * Validate that a grammar is right-linear (regular).
 */
export function validateRegularGrammar(grammar: RegularGrammar): string[] {
  const errors: string[] = [];

  if (grammar.nonTerminals.length === 0) {
    errors.push("grammar_no_nonterminals");
  }

  if (grammar.terminals.length === 0) {
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

  return errors;
}
