import { cloneJson } from "@/lib/utils";
import { hasUniqueNonEmptyValues, MAX_COLLECTION_SIZE } from "./programCommon";
import type { MooreProgram } from "./mooreTypes";

export {
  formatInternalNumber,
  parseInternalNumber,
  createNextStateName,
} from "./programCommon";

export {
  renameMooreState,
  renameMooreInputSymbol,
  getNextMooreOutputCode,
  findMooreOutputCodeBySymbol,
} from "./mooreProgramUpdates";

export function validateMooreProgram(program: MooreProgram): string[] {
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
    program.states.some(
      (state) =>
        !program.outputs[state] ||
        program.outputs[state].symbol.trim().length === 0 ||
        !Number.isSafeInteger(program.outputs[state].code) ||
        program.outputs[state].code < 0,
    ) ||
    !hasConsistentOutputCodes(program)
  ) {
    issues.push("outputs_invalid");
  }
  if (
    program.inputSymbols.some((symbol) =>
      program.states.some((state) => {
        const target = program.transitions[symbol]?.[state];
        return !target || !program.states.includes(target);
      }),
    )
  ) {
    issues.push("transitions_invalid");
  }
  if (
    program.inputWord.some((symbol) => !program.inputSymbols.includes(symbol))
  ) {
    issues.push("input_word_invalid");
  }

  return issues;
}

export function normalizeMooreProgram(program: MooreProgram): MooreProgram {
  const normalized = cloneJson(program);
  normalized.states = normalized.states.map((state) => state.trim());
  normalized.inputSymbols = normalized.inputSymbols.map((symbol) =>
    symbol.trim(),
  );
  normalized.outputs = Object.fromEntries(
    normalized.states.map((state) => {
      const output = normalized.outputs[state] ?? { symbol: "", code: 0 };
      return [
        state,
        {
          symbol: output.symbol.trim(),
          code: output.code,
        },
      ];
    }),
  );
  normalized.transitions = Object.fromEntries(
    normalized.inputSymbols.map((symbol) => [
      symbol,
      Object.fromEntries(
        normalized.states.map((state) => [
          state,
          normalized.transitions[symbol]?.[state] ?? "",
        ]),
      ),
    ]),
  );
  return normalized;
}

function hasConsistentOutputCodes(program: MooreProgram): boolean {
  const codeBySymbol = new Map<string, number>();
  const symbolByCode = new Map<number, string>();

  for (const state of program.states) {
    const output = program.outputs[state];
    if (!output) {
      continue;
    }
    const existingCode = codeBySymbol.get(output.symbol);
    if (existingCode !== undefined && existingCode !== output.code) {
      return false;
    }
    const existingSymbol = symbolByCode.get(output.code);
    if (existingSymbol !== undefined && existingSymbol !== output.symbol) {
      return false;
    }
    codeBySymbol.set(output.symbol, output.code);
    symbolByCode.set(output.code, output.symbol);
  }
  return true;
}
