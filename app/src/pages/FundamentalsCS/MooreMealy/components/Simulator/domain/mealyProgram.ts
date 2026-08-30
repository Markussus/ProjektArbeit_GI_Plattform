import { cloneJson } from "@/lib/utils";
import { hasUniqueNonEmptyValues } from "./programCommon";
import {
  renameMealyInputSymbol,
  renameMealyState,
} from "./mealyProgramUpdates";
import type { MealyProgram } from "./mealyTypes";

export { createNextStateName } from "./programCommon";
export { renameMealyState };
export const renameMealyInput = renameMealyInputSymbol;

export function validateMealyProgram(program: MealyProgram): string[] {
  const issues: string[] = [];
  if (!program.states.length) issues.push("states_invalid");
  if (!hasUniqueNonEmptyValues(program.states))
    issues.push("state_names_invalid");
  if (!hasUniqueNonEmptyValues(program.inputSymbols))
    issues.push("input_symbol_names_invalid");
  if (!program.states.includes(program.initialState))
    issues.push("initial_state_invalid");
  if (
    program.inputSymbols.some((input) =>
      program.states.some((state) => {
        const target = program.transitions[input]?.[state];
        return !target || !program.states.includes(target);
      }),
    )
  )
    issues.push("transitions_invalid");
  if (
    program.inputSymbols.some((input) =>
      program.states.some((state) => {
        const output = program.outputs[input]?.[state];
        return (
          !output?.symbol.trim() ||
          !Number.isSafeInteger(output.code) ||
          output.code < 0
        );
      }),
    )
  )
    issues.push("outputs_invalid");
  if (program.inputWord.some((input) => !program.inputSymbols.includes(input)))
    issues.push("input_word_invalid");
  return [...new Set(issues)];
}

export function normalizeMealyProgram(program: MealyProgram): MealyProgram {
  const normalized = cloneJson(program);
  normalized.states = normalized.states.map((value) => value.trim());
  normalized.inputSymbols = normalized.inputSymbols.map((value) =>
    value.trim(),
  );
  normalized.transitions = Object.fromEntries(
    normalized.inputSymbols.map((input) => [
      input,
      Object.fromEntries(
        normalized.states.map((state) => [
          state,
          normalized.transitions[input]?.[state] ?? "",
        ]),
      ),
    ]),
  );
  normalized.outputs = Object.fromEntries(
    normalized.inputSymbols.map((input) => [
      input,
      Object.fromEntries(
        normalized.states.map((state) => {
          const output = normalized.outputs[input]?.[state] ?? {
            symbol: "",
            code: 0,
          };
          return [state, { ...output, symbol: output.symbol.trim() }];
        }),
      ),
    ]),
  );
  return normalized;
}
