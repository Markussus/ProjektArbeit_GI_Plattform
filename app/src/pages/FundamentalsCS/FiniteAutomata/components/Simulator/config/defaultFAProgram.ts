import type { FAProgram } from "../domain/faTypes";

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
