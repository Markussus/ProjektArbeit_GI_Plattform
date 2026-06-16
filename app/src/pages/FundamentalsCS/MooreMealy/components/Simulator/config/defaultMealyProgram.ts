import type { MealyProgram } from "../domain/mealyTypes";

export const defaultMealyProgram: MealyProgram = {
  states: ["S0", "S1"],
  inputSymbols: ["0", "1"],
  transitions: {
    "0": { S0: "S1", S1: "S0" },
    "1": { S0: "S0", S1: "S1" },
  },
  outputs: {
    "0": {
      S0: { symbol: "a", code: 0 },
      S1: { symbol: "b", code: 1 },
    },
    "1": {
      S0: { symbol: "c", code: 2 },
      S1: { symbol: "b", code: 1 },
    },
  },
  initialState: "S0",
  inputWord: ["0", "0", "1", "0", "1", "1"],
  representation: "decimal",
};
