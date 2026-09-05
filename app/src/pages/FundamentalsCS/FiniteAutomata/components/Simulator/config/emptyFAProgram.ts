import type { FAProgram } from "../domain/faTypes";

/**
 * What the simulator starts from in free mode: a single start state over the
 * default alphabet, with no transitions and no accept states — the same blank
 * slate the exercise starters use, and the counterpart of the Turing Machine's
 * `emptyTuringMachineProgram` and Moore/Mealy's `emptyMooreProgram`.
 *
 * The worked automata live in the Examples tab instead of being preloaded here.
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
