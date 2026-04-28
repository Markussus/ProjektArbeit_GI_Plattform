import { withDerivedAlphabets } from "../domain/tmProgram";
import type { TMProgram } from "../domain/tmProgram";
import { DEFAULT_BLANK_SYMBOL } from "../domain/tmTypes";

export const defaultTMProgram: TMProgram = withDerivedAlphabets({
  states: ["q0", "qS"],
  inputAlphabet: [],
  tapeAlphabet: ["0", "1", DEFAULT_BLANK_SYMBOL],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qS"],
  initialTape: ["0", "1", "1", "0"],
  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q0: {
        nextState: "qS",
        writeSymbol: DEFAULT_BLANK_SYMBOL,
        movement: "L",
      },
    },
    "0": {
      q0: {
        nextState: "q0",
        writeSymbol: "1",
        movement: "R",
      },
    },
    "1": {
      q0: {
        nextState: "q0",
        writeSymbol: "0",
        movement: "R",
      },
    },
  },
});
