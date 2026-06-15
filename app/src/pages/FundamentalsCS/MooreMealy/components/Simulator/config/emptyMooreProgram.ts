import type { MooreProgram } from "../domain/mooreTypes";

export const emptyMooreProgram: MooreProgram = {
  states: ["STATE_0"],
  inputSymbols: [],
  transitions: {},
  outputs: {
    STATE_0: { symbol: "OUT_0", code: 0 },
  },
  initialState: "STATE_0",
  inputWord: [],
  representation: "decimal",
};
