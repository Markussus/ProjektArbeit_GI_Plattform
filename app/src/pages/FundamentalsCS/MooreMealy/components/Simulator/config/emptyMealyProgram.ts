import type { MealyProgram } from "../domain/mealyTypes";

export const emptyMealyProgram: MealyProgram = {
  states: ["STATE_0"],
  inputSymbols: [],
  transitions: {},
  outputs: {},
  initialState: "STATE_0",
  inputWord: [],
  representation: "decimal",
};
