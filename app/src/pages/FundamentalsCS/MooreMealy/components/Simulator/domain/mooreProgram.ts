import { cloneJson } from "@/lib/utils";
import type { MooreProgram } from "./mooreTypes";

const MAX_COLLECTION_SIZE = 1024;
const MAX_NAME_LENGTH = 128;

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

export function formatInternalNumber(
  value: number,
  representation: MooreProgram["representation"],
): string {
  return representation === "binary" ? value.toString(2) : value.toString(10);
}

export function parseInternalNumber(
  value: string,
  representation: MooreProgram["representation"],
): number | null {
  const trimmed = value.trim();
  const pattern = representation === "binary" ? /^[01]+$/u : /^\d+$/u;
  if (!pattern.test(trimmed)) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, representation === "binary" ? 2 : 10);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

export function createNextStateName(states: string[]): string {
  let index = states.length;
  let candidate = `STATE_${index}`;
  while (states.includes(candidate)) {
    index += 1;
    candidate = `STATE_${index}`;
  }
  return candidate;
}

export function createNextInputSymbol(inputSymbols: string[]): string {
  let value = inputSymbols.length;
  let candidate = value.toString(2);
  while (inputSymbols.includes(candidate)) {
    value += 1;
    candidate = value.toString(2);
  }
  return candidate;
}

export function getNextMooreOutputCode(program: MooreProgram): number {
  return (
    Math.max(
      -1,
      ...program.states.map((state) => program.outputs[state]?.code ?? -1),
    ) + 1
  );
}

export function renameMooreState(
  program: MooreProgram,
  previousName: string,
  nextName: string,
): MooreProgram | null {
  const normalizedName = nextName.trim();
  if (
    normalizedName.length === 0 ||
    normalizedName.length > MAX_NAME_LENGTH ||
    (normalizedName !== previousName && program.states.includes(normalizedName))
  ) {
    return null;
  }

  const nextProgram = cloneJson(program);
  nextProgram.states = nextProgram.states.map((state) =>
    state === previousName ? normalizedName : state,
  );
  nextProgram.initialState =
    nextProgram.initialState === previousName
      ? normalizedName
      : nextProgram.initialState;
  nextProgram.outputs[normalizedName] = nextProgram.outputs[previousName];
  if (normalizedName !== previousName) {
    delete nextProgram.outputs[previousName];
  }

  for (const symbol of nextProgram.inputSymbols) {
    const row = nextProgram.transitions[symbol];
    row[normalizedName] = row[previousName];
    if (normalizedName !== previousName) {
      delete row[previousName];
    }
    for (const state of nextProgram.states) {
      if (row[state] === previousName) {
        row[state] = normalizedName;
      }
    }
  }

  return nextProgram;
}

export function renameMooreInputSymbol(
  program: MooreProgram,
  previousSymbol: string,
  nextSymbol: string,
): MooreProgram | null {
  const normalizedSymbol = nextSymbol.trim();
  if (
    normalizedSymbol.length === 0 ||
    normalizedSymbol.length > MAX_NAME_LENGTH ||
    (normalizedSymbol !== previousSymbol &&
      program.inputSymbols.includes(normalizedSymbol))
  ) {
    return null;
  }

  const nextProgram = cloneJson(program);
  nextProgram.inputSymbols = nextProgram.inputSymbols.map((symbol) =>
    symbol === previousSymbol ? normalizedSymbol : symbol,
  );
  nextProgram.transitions[normalizedSymbol] =
    nextProgram.transitions[previousSymbol];
  if (normalizedSymbol !== previousSymbol) {
    delete nextProgram.transitions[previousSymbol];
  }
  nextProgram.inputWord = nextProgram.inputWord.map((symbol) =>
    symbol === previousSymbol ? normalizedSymbol : symbol,
  );
  return nextProgram;
}

function hasUniqueNonEmptyValues(values: string[]): boolean {
  return (
    values.every(
      (value) =>
        value.trim().length > 0 && value.trim().length <= MAX_NAME_LENGTH,
    ) && new Set(values).size === values.length
  );
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

  return true;
}
