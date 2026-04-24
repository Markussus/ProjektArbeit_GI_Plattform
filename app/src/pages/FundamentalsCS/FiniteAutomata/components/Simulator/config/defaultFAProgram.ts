import type { FAProgram } from "../domain/faTypes";

export const defaultDFAProgram: FAProgram = {
  type: "DFA",
  states: ["q0", "q1", "q2"],
  alphabet: ["a", "b"],
  transitions: {
    q0: { a: ["q1"], b: ["q0"] },
    q1: { a: ["q1"], b: ["q2"] },
    q2: { a: ["q1"], b: ["q0"] },
  },
  startState: "q0",
  acceptStates: ["q2"],
};

export const defaultNFAProgram: FAProgram = {
  type: "NFA",
  states: ["q0", "q1", "q2"],
  alphabet: ["a", "b"],
  transitions: {
    q0: { a: ["q0", "q1"], b: ["q0"] },
    q1: { b: ["q2"] },
    q2: {},
  },
  startState: "q0",
  acceptStates: ["q2"],
};

export const defaultInputWord = "aab";
