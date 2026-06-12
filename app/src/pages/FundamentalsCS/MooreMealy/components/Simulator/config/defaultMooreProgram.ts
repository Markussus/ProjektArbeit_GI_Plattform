import type { MooreProgram } from "../domain/mooreTypes";

export const defaultMooreProgram: MooreProgram = {
  states: ["HALT", "READY", "GO", "WAIT"],
  inputSymbols: ["0", "1"],
  transitions: {
    "0": {
      HALT: "READY",
      READY: "GO",
      GO: "GO",
      WAIT: "HALT",
    },
    "1": {
      HALT: "HALT",
      READY: "GO",
      GO: "WAIT",
      WAIT: "HALT",
    },
  },
  outputs: {
    HALT: { symbol: "4", code: 4 },
    READY: { symbol: "6", code: 6 },
    GO: { symbol: "1", code: 1 },
    WAIT: { symbol: "2", code: 2 },
  },
  initialState: "HALT",
  inputWord: ["0", "1", "0", "1"],
  representation: "decimal",
};
