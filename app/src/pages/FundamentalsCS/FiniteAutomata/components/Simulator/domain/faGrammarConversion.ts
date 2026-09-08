import type { FAProgram, RegularGrammar, FATransitionMap } from "./faTypes";

/** "sF", or "sF2", "sF3", … if the grammar already uses that name. */
function uniqueFinalStateName(nonTerminals: string[]): string {
  const taken = new Set(nonTerminals);
  if (!taken.has("sF")) return "sF";
  let suffix = 2;
  while (taken.has(`sF${suffix}`)) suffix++;
  return `sF${suffix}`;
}

/** Append `target` to transitions[from][symbol], keeping the row duplicate-free. */
function addTarget(
  transitions: FATransitionMap,
  from: string,
  symbol: string,
  target: string,
): void {
  const row = (transitions[from] ??= {});
  const targets = (row[symbol] ??= []);
  if (!targets.includes(target)) targets.push(target);
}

/**
 * Productions become transitions: `A -> aB` goes to B, `A -> a` goes to the
 * synthetic accept state. ε productions are intentionally skipped — they mark
 * their non-terminal as accepting instead of emitting an ε-transition.
 */
function buildTransitions(
  grammar: RegularGrammar,
  states: string[],
  finalState: string,
): FATransitionMap {
  const transitions: FATransitionMap = {};
  for (const state of states) {
    transitions[state] = {};
  }

  for (const rule of grammar.productions) {
    addTarget(
      transitions,
      rule.lhs,
      rule.terminal,
      rule.nextNonTerminal ?? finalState,
    );
  }

  return transitions;
}

/** The synthetic accept state (when used) plus every ε-producing non-terminal. */
function collectAcceptStates(
  grammar: RegularGrammar,
  finalState: string | null,
): string[] {
  const epsilonProducers = new Set(grammar.epsilonProducingNonTerminals ?? []);
  const acceptStates = finalState === null ? [] : [finalState];

  for (const nt of grammar.nonTerminals) {
    if (epsilonProducers.has(nt) && !acceptStates.includes(nt)) {
      acceptStates.push(nt);
    }
  }

  return acceptStates;
}

/** A table is deterministic while no (state, symbol) pair has two targets. */
function isDeterministic(transitions: FATransitionMap): boolean {
  return Object.values(transitions).every((row) =>
    Object.values(row).every((targets) => targets.length <= 1),
  );
}

/**
 * Convert a right-linear grammar to an NFA: non-terminals become states, `A → aB`
 * a transition, `A → a` a transition into one dedicated accept state, and `A → ε`
 * marks A accepting. No ε-transitions are emitted.
 */
export function grammarToAutomaton(grammar: RegularGrammar): FAProgram {
  // The synthetic accept state must not clash with a non-terminal the user
  // happened to name "sF" — otherwise `A -> a` and `A -> asF` would collapse
  // into the same transition and the grammar's own sF would become accepting.
  const finalState = uniqueFinalStateName(grammar.nonTerminals);
  const needsFinalState = grammar.productions.some(
    (r) => r.nextNonTerminal === null,
  );

  const states = [...grammar.nonTerminals];
  if (needsFinalState) states.push(finalState);

  const transitions = buildTransitions(grammar, states, finalState);

  return {
    type: isDeterministic(transitions) ? "DFA" : "NFA",
    states,
    alphabet: [...grammar.terminals],
    transitions,
    startState: grammar.startSymbol,
    acceptStates: collectAcceptStates(
      grammar,
      needsFinalState ? finalState : null,
    ),
  };
}

/** Checks on the grammar's declared sets, independent of any single rule. */
function collectGrammarShapeErrors(grammar: RegularGrammar): string[] {
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

  return errors;
}

/** Checks that every symbol a single production names is actually declared. */
function collectProductionErrors(grammar: RegularGrammar): string[] {
  const errors: string[] = [];
  const nonTerminals = new Set(grammar.nonTerminals);
  const terminals = new Set(grammar.terminals);

  for (const rule of grammar.productions) {
    if (!nonTerminals.has(rule.lhs)) {
      errors.push("grammar_lhs_invalid");
    }
    if (!terminals.has(rule.terminal)) {
      errors.push("grammar_terminal_invalid");
    }
    if (
      rule.nextNonTerminal !== null &&
      !nonTerminals.has(rule.nextNonTerminal)
    ) {
      errors.push("grammar_rhs_nonterminal_invalid");
    }
  }

  for (const nt of grammar.epsilonProducingNonTerminals ?? []) {
    if (!nonTerminals.has(nt)) {
      errors.push("grammar_epsilon_lhs_invalid");
    }
  }

  return errors;
}

/**
 * Validate that a grammar is right-linear (regular).
 */
export function validateRegularGrammar(grammar: RegularGrammar): string[] {
  return [
    ...collectGrammarShapeErrors(grammar),
    ...collectProductionErrors(grammar),
  ];
}
