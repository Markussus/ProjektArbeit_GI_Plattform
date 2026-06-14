import { cloneJson } from "@/lib/utils";
import {
  createNextInputSymbol,
  createNextStateName,
} from "./mooreProgram";
import type { MealyProgram } from "./mealyTypes";

export { createNextInputSymbol, createNextStateName };

export function validateMealyProgram(program: MealyProgram): string[] {
  const issues: string[] = [];
  if (!program.states.length) issues.push("states_invalid");
  if (!unique(program.states)) issues.push("state_names_invalid");
  if (!unique(program.inputSymbols)) issues.push("input_symbol_names_invalid");
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
  normalized.inputSymbols = normalized.inputSymbols.map((value) => value.trim());
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

export function renameMealyState(
  program: MealyProgram,
  previous: string,
  nextValue: string,
): MealyProgram | null {
  const next = nextValue.trim();
  if (!next || (next !== previous && program.states.includes(next))) return null;
  const result = cloneJson(program);
  result.states = result.states.map((state) => (state === previous ? next : state));
  if (result.initialState === previous) result.initialState = next;
  for (const input of result.inputSymbols) {
    result.transitions[input][next] = result.transitions[input][previous];
    result.outputs[input][next] = result.outputs[input][previous];
    if (next !== previous) {
      delete result.transitions[input][previous];
      delete result.outputs[input][previous];
    }
    for (const state of result.states) {
      if (result.transitions[input][state] === previous)
        result.transitions[input][state] = next;
    }
  }
  return result;
}

export function renameMealyInput(
  program: MealyProgram,
  previous: string,
  nextValue: string,
): MealyProgram | null {
  const next = nextValue.trim();
  if (!next || (next !== previous && program.inputSymbols.includes(next)))
    return null;
  const result = cloneJson(program);
  result.inputSymbols = result.inputSymbols.map((input) =>
    input === previous ? next : input,
  );
  result.transitions[next] = result.transitions[previous];
  result.outputs[next] = result.outputs[previous];
  if (next !== previous) {
    delete result.transitions[previous];
    delete result.outputs[previous];
  }
  result.inputWord = result.inputWord.map((input) =>
    input === previous ? next : input,
  );
  return result;
}

function unique(values: string[]) {
  return values.every((value) => value.trim()) && new Set(values).size === values.length;
}
