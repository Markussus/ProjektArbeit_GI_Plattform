import { cloneJson } from "@/lib/utils";
import {
  createNextInputSymbol,
  createNextStateName,
  MAX_NAME_LENGTH,
} from "./programCommon";
import type { MooreProgram } from "./mooreTypes";

export function getNextMooreOutputCode(program: MooreProgram): number {
  return (
    Math.max(
      -1,
      ...program.states.map((state) => program.outputs[state]?.code ?? -1),
    ) + 1
  );
}

function remapStateTransitions(
  transitions: Record<string, Record<string, string>>,
  previousName: string,
  nextName: string,
  inputSymbols: string[],
  states: string[],
) {
  for (const input of inputSymbols) {
    const transRow = transitions[input];
    if (!transRow) continue;
    transRow[nextName] = transRow[previousName];
    if (nextName !== previousName) {
      delete transRow[previousName];
    }
    for (const state of states) {
      if (transRow[state] === previousName) {
        transRow[state] = nextName;
      }
    }
  }
}

export function addMooreState(
  program: MooreProgram,
  requestedName?: string,
): { nextProgram: MooreProgram; stateName: string } {
  const normalized =
    requestedName?.trim() || createNextStateName(program.states);
  if (program.states.includes(normalized)) {
    return { nextProgram: program, stateName: normalized };
  }

  const nextProgram = cloneJson(program);
  const stateIndex = nextProgram.states.length;
  nextProgram.states.push(normalized);

  for (const input of nextProgram.inputSymbols) {
    if (!nextProgram.transitions[input]) {
      nextProgram.transitions[input] = {};
    }
    nextProgram.transitions[input][normalized] = nextProgram.initialState;
  }

  nextProgram.outputs[normalized] = {
    symbol: `OUT_${stateIndex}`,
    code: getNextMooreOutputCode(nextProgram),
  };

  return { nextProgram, stateName: normalized };
}

export function removeMooreState(
  program: MooreProgram,
  stateToRemove: string,
): MooreProgram {
  if (program.states.length <= 1 || !program.states.includes(stateToRemove)) {
    return program;
  }

  const nextProgram = cloneJson(program);
  nextProgram.states = nextProgram.states.filter((s) => s !== stateToRemove);
  const fallback = nextProgram.states[0];

  if (nextProgram.initialState === stateToRemove) {
    nextProgram.initialState = fallback;
  }

  for (const input of nextProgram.inputSymbols) {
    const transRow = nextProgram.transitions[input];
    if (transRow) {
      delete transRow[stateToRemove];
      for (const state of nextProgram.states) {
        if (transRow[state] === stateToRemove) {
          transRow[state] = fallback;
        }
      }
    }
  }

  delete nextProgram.outputs[stateToRemove];
  return nextProgram;
}

export function renameMooreState(
  program: MooreProgram,
  previousName: string,
  nextName: string,
): MooreProgram | null {
  const normalized = nextName.trim();
  if (
    normalized.length === 0 ||
    normalized.length > MAX_NAME_LENGTH ||
    (normalized !== previousName && program.states.includes(normalized))
  ) {
    return null;
  }

  const nextProgram = cloneJson(program);
  nextProgram.states = nextProgram.states.map((s) =>
    s === previousName ? normalized : s,
  );
  if (nextProgram.initialState === previousName) {
    nextProgram.initialState = normalized;
  }

  remapStateTransitions(
    nextProgram.transitions,
    previousName,
    normalized,
    nextProgram.inputSymbols,
    nextProgram.states,
  );

  if (nextProgram.outputs[previousName]) {
    nextProgram.outputs[normalized] = nextProgram.outputs[previousName];
    if (normalized !== previousName) {
      delete nextProgram.outputs[previousName];
    }
  }

  return nextProgram;
}

export function addMooreInputSymbol(program: MooreProgram): MooreProgram {
  const input = createNextInputSymbol(program.inputSymbols);
  const nextProgram = cloneJson(program);
  nextProgram.inputSymbols.push(input);

  nextProgram.transitions[input] = Object.fromEntries(
    nextProgram.states.map((state) => [state, nextProgram.initialState]),
  );

  return nextProgram;
}

export function removeMooreInputSymbol(
  program: MooreProgram,
  inputToRemove: string,
): MooreProgram {
  const nextProgram = cloneJson(program);
  nextProgram.inputSymbols = nextProgram.inputSymbols.filter(
    (input) => input !== inputToRemove,
  );
  nextProgram.inputWord = nextProgram.inputWord.filter(
    (input) => input !== inputToRemove,
  );
  delete nextProgram.transitions[inputToRemove];
  return nextProgram;
}

export function renameMooreInputSymbol(
  program: MooreProgram,
  previousSymbol: string,
  nextSymbol: string,
): MooreProgram | null {
  const normalized = nextSymbol.trim();
  if (
    normalized.length === 0 ||
    normalized.length > MAX_NAME_LENGTH ||
    (normalized !== previousSymbol && program.inputSymbols.includes(normalized))
  ) {
    return null;
  }

  const nextProgram = cloneJson(program);
  nextProgram.inputSymbols = nextProgram.inputSymbols.map((input) =>
    input === previousSymbol ? normalized : input,
  );
  nextProgram.transitions[normalized] = nextProgram.transitions[previousSymbol];
  if (normalized !== previousSymbol) {
    delete nextProgram.transitions[previousSymbol];
  }
  nextProgram.inputWord = nextProgram.inputWord.map((input) =>
    input === previousSymbol ? normalized : input,
  );
  return nextProgram;
}

export function setMooreTransition(
  program: MooreProgram,
  inputSymbol: string,
  state: string,
  targetState: string,
): MooreProgram {
  const nextProgram = cloneJson(program);
  if (!nextProgram.transitions[inputSymbol]) {
    nextProgram.transitions[inputSymbol] = {};
  }
  nextProgram.transitions[inputSymbol][state] = targetState;
  return nextProgram;
}

export function setMooreOutputSymbol(
  program: MooreProgram,
  state: string,
  symbol: string,
): MooreProgram {
  const nextProgram = cloneJson(program);
  if (!nextProgram.outputs[state]) {
    nextProgram.outputs[state] = { symbol: "", code: 0 };
  }
  nextProgram.outputs[state].symbol = symbol;
  return nextProgram;
}

export function setMooreOutputCode(
  program: MooreProgram,
  state: string,
  code: number,
): MooreProgram {
  const nextProgram = cloneJson(program);
  if (!nextProgram.outputs[state]) {
    nextProgram.outputs[state] = { symbol: "", code: 0 };
  }
  nextProgram.outputs[state].code = code;
  return nextProgram;
}

export function createMooreOutputSymbol(
  program: MooreProgram,
  state: string,
  symbol: string,
): MooreProgram {
  const code = getNextMooreOutputCode(program);
  const nextProgram = cloneJson(program);
  nextProgram.outputs[state] = {
    symbol: symbol.trim() || `OUT_${code}`,
    code,
  };
  return nextProgram;
}
