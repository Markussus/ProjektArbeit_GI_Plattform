import { cloneJson } from "@/lib/utils";
import { hasUniqueNonEmptyValues, MAX_COLLECTION_SIZE } from "./programCommon";
import {
  renameMealyInputSymbol,
  renameMealyState,
} from "./mealyProgramUpdates";
import type { MealyProgram } from "./mealyTypes";

export { createNextStateName } from "./programCommon";
export { renameMealyState };
export const renameMealyInput = renameMealyInputSymbol;

export function getNextMealyOutputCode(program: MealyProgram): number {
  const usedCodes = new Set<number>();
  for (const input of program.inputSymbols) {
    for (const state of program.states) {
      const output = program.outputs[input]?.[state];
      if (output && Number.isSafeInteger(output.code) && output.code >= 0) {
        usedCodes.add(output.code);
      }
    }
  }
  let next = 0;
  while (usedCodes.has(next)) {
    next++;
  }
  return next;
}

function hasConsistentOutputCodes(program: MealyProgram): boolean {
  const codeBySymbol = new Map<string, number>();
  const symbolByCode = new Map<number, string>();

  for (const input of program.inputSymbols) {
    for (const state of program.states) {
      const output = program.outputs[input]?.[state];
      if (!output) {
        continue;
      }
      const existingCode = codeBySymbol.get(output.symbol);
      const existingSymbol = symbolByCode.get(output.code);
      if (
        (existingCode !== undefined && existingCode !== output.code) ||
        (existingSymbol !== undefined && existingSymbol !== output.symbol)
      ) {
        return false;
      }
      codeBySymbol.set(output.symbol, output.code);
      symbolByCode.set(output.code, output.symbol);
    }
  }

  return true;
}

export function validateMealyProgram(program: MealyProgram): string[] {
  const issues: string[] = [];
  if (
    program.states.length === 0 ||
    program.states.length > MAX_COLLECTION_SIZE
  ) {
    issues.push("states_invalid");
  }
  if (program.inputSymbols.length > MAX_COLLECTION_SIZE) {
    issues.push("input_symbols_invalid");
  }
  if (!hasUniqueNonEmptyValues(program.states)) {
    issues.push("state_names_invalid");
  }
  if (!hasUniqueNonEmptyValues(program.inputSymbols)) {
    issues.push("input_symbol_names_invalid");
  }
  if (!program.states.includes(program.initialState)) {
    issues.push("initial_state_invalid");
  }
  if (
    program.inputSymbols.some((input) =>
      program.states.some((state) => {
        const target = program.transitions[input]?.[state];
        return !target || !program.states.includes(target);
      }),
    )
  ) {
    issues.push("transitions_invalid");
  }
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
    ) ||
    !hasConsistentOutputCodes(program)
  ) {
    issues.push("outputs_invalid");
  }
  if (
    program.inputWord.some((input) => !program.inputSymbols.includes(input))
  ) {
    issues.push("input_word_invalid");
  }
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
