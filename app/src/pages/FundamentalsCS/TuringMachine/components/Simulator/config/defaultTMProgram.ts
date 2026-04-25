import { withDerivedAlphabets } from "../domain/tmProgram";
import type { TMProgram } from "../domain/tmProgram";
import { DEFAULT_BLANK_SYMBOL } from "../domain/tmTypes";

export const defaultTMProgram: TMProgram = withDerivedAlphabets({
  states: ["q0", "q1", "q2", "qS"],
  inputAlphabet: [],
  tapeAlphabet: ["0", "1", "E", DEFAULT_BLANK_SYMBOL],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qS"],
  initialTape: ["1", "0", "0", "1"],
  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q0: {
        nextState: "qS",
        writeSymbol: DEFAULT_BLANK_SYMBOL,
        movement: "L",
      },
      q1: {
        nextState: "qS",
        writeSymbol: DEFAULT_BLANK_SYMBOL,
        movement: "L",
      },
      q2: {
        nextState: "qS",
        writeSymbol: "E",
        movement: "L",
      },
    },
    "0": {
      q0: {
        nextState: "q1",
        writeSymbol: "0",
        movement: "R",
      },
      q1: {
        nextState: "q2",
        writeSymbol: "0",
        movement: "R",
      },
      q2: {
        nextState: "qS",
        writeSymbol: "E",
        movement: "L",
      },
    },
    "1": {
      q0: {
        nextState: "q0",
        writeSymbol: "1",
        movement: "R",
      },
      q1: {
        nextState: "q0",
        writeSymbol: "1",
        movement: "R",
      },
      q2: {
        nextState: "qS",
        writeSymbol: "E",
        movement: "L",
      },
    },
  },
});
