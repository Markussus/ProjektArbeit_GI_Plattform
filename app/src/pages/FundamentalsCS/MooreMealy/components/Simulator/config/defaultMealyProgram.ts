import type { MealyProgram } from "../domain/mealyTypes";

export const defaultMealyProgram: MealyProgram = {
  states: ["START", "SEEN_1", "SEEN_10"],
  inputSymbols: ["0", "1"],
  transitions: {
    "0": { START: "START", SEEN_1: "SEEN_10", SEEN_10: "START" },
    "1": { START: "SEEN_1", SEEN_1: "SEEN_1", SEEN_10: "SEEN_1" },
  },
  outputs: {
    "0": {
      START: { symbol: "NO_MATCH", code: 0 },
      SEEN_1: { symbol: "NO_MATCH", code: 0 },
      SEEN_10: { symbol: "NO_MATCH", code: 0 },
    },
    "1": {
      START: { symbol: "NO_MATCH", code: 0 },
      SEEN_1: { symbol: "NO_MATCH", code: 0 },
      SEEN_10: { symbol: "MATCH_101", code: 1 },
    },
  },
  initialState: "START",
  inputWord: ["1", "0", "1", "1", "0", "1"],
  representation: "binary",
};
