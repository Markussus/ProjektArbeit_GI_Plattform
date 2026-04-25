import type { FAProgram } from "../domain/faTypes";

export const defaultDFAProgram: FAProgram = {
  type: "DFA",
  states: ["s0", "s1", "s2"],
  alphabet: ["a", "b"],
  transitions: {
    s0: { a: ["s1"], b: ["s0"] },
    s1: { a: ["s1"], b: ["s2"] },
    s2: { a: ["s1"], b: ["s0"] },
  },
  startState: "s0",
  acceptStates: ["s2"],
};

export const defaultNFAProgram: FAProgram = {
  type: "NFA",
  states: ["s0", "s1", "s2"],
  alphabet: ["a", "b"],
  transitions: {
    s0: { a: ["s0", "s1"], b: ["s0"] },
    s1: { b: ["s2"] },
    s2: {},
  },
  startState: "s0",
  acceptStates: ["s2"],
};

export const defaultInputWord = "aab";
