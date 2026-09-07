export type StateName = string;
export type InputSymbol = string;

/** Symbol for a transition that consumes no input (NFA only). */
export const EPSILON: InputSymbol = "ε";

/** Declared type of an automaton; a DFA is held to determinism by validation. */
export type AutomatonType = "DFA" | "NFA";

/** Transition table; a DFA keeps at most one target per cell. */
export interface FATransitionMap {
  /** transitions[fromState][symbol] = array of target states */
  [fromState: string]: {
    [symbol: string]: StateName[];
  };
}

export interface FAProgram {
  type: AutomatonType;
  states: StateName[];
  alphabet: InputSymbol[];
  transitions: FATransitionMap;
  startState: StateName;
  acceptStates: StateName[];
}

/** A right-linear grammar (A → aB | a), plus which non-terminals derive ε. */
export interface RegularGrammar {
  nonTerminals: string[];
  terminals: string[];
  startSymbol: string;
  productions: ProductionRule[];
  epsilonProducingNonTerminals?: string[];
}

/** One right-linear production: `lhs → terminal nextNonTerminal?`. */
export interface ProductionRule {
  lhs: string;
  terminal: string;
  /** optional non-terminal (right-linear: A → aB) */
  nextNonTerminal: string | null;
}
