import type { FAProgram } from "../domain/faTypes";

/**
 * What free mode starts from: one start state over the default alphabet, no
 * transitions, no accept states — the same blank slate the starters use. The
 * worked automata live in the Examples tab rather than being preloaded here.
 */
export const emptyFAProgram: FAProgram = {
  type: "DFA",
  states: ["S0"],
  alphabet: ["a", "b"],
  transitions: { S0: {} },
  startState: "S0",
  acceptStates: [],
};

/** Free mode starts without a test word; the field keeps its placeholder. */
export const emptyInputWord = "";
