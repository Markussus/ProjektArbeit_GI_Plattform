export type StateName = string;
export type InputSymbol = string;

export const EPSILON: InputSymbol = "ε";

export interface FATransition {
  from: StateName;
  symbol: InputSymbol;
  to: StateName[];
}

export type AutomatonType = "DFA" | "NFA";

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

export interface RegularGrammar {
  nonTerminals: string[];
  terminals: string[];
  startSymbol: string;
  productions: ProductionRule[];
  /**
   * Non-terminals that have an ε production (A → ε).
   * Tracked separately because ε rules become accepting-state markers,
   * not transitions, in the converted automaton.
   */
  epsilonProducingNonTerminals?: string[];
}

export interface ProductionRule {
  lhs: string;
  /** terminal symbol */
  terminal: string;
  /** optional non-terminal (right-linear: A → aB) */
  nextNonTerminal: string | null;
}
