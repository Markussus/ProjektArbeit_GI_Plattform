import type { FAProgram } from "../domain/faTypes";

/**
 * Reference DFA/NFA pair behind the editor's DFA <-> NFA type swap. The
 * simulator opens on `emptyFAProgram` instead of one of these; the DFA is
 * still reachable as the "ends with ab" example in the Examples tab.
 */
export const defaultDFAProgram: FAProgram = {
  type: "DFA",
  states: ["S0", "S1", "S2"],
  alphabet: ["a", "b"],
  transitions: {
    S0: { a: ["S1"], b: ["S0"] },
    S1: { a: ["S1"], b: ["S2"] },
    S2: { a: ["S1"], b: ["S0"] },
  },
  startState: "S0",
  acceptStates: ["S2"],
};

export const defaultNFAProgram: FAProgram = {
  type: "NFA",
  states: ["S0", "S1", "S2"],
  alphabet: ["a", "b"],
  transitions: {
    S0: { a: ["S0", "S1"], b: ["S0"] },
    S1: { b: ["S2"] },
    S2: {},
  },
  startState: "S0",
  acceptStates: ["S2"],
};

export const defaultInputWord = "aab";
