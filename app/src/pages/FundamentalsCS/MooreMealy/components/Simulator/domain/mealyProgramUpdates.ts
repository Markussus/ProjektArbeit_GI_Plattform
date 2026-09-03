import { cloneJson } from "@/lib/utils";
import {
  createNextInputSymbol,
  createNextStateName,
  MAX_NAME_LENGTH,
} from "./programCommon";
import type { MealyProgram } from "./mealyTypes";

type MealyOutput = MealyProgram["outputs"][string][string];

function findOutput(
  program: MealyProgram,
  predicate: (output: MealyOutput) => boolean,
): MealyOutput | undefined {
  for (const input of program.inputSymbols) {
    for (const state of program.states) {
      const output = program.outputs[input]?.[state];
      if (output && predicate(output)) {
        return output;
      }
    }
  }
  return undefined;
}

export function findMealyOutputCodeBySymbol(
  program: MealyProgram,
  symbol: string,
): number | undefined {
  return findOutput(program, (output) => output.symbol === symbol)?.code;
}

export function renameMealyOutputSymbol(
  program: MealyProgram,
  previousSymbol: string,
  nextSymbol: string,
): MealyProgram | null {
  const normalized = nextSymbol.trim();
  if (!normalized || normalized.length > MAX_NAME_LENGTH) {
    return null;
  }
  if (normalized === previousSymbol) {
    return program;
  }

  const existingCode = findMealyOutputCodeBySymbol(program, normalized);
  const nextProgram = cloneJson(program);
  for (const input of nextProgram.inputSymbols) {
    for (const state of nextProgram.states) {
      const output = nextProgram.outputs[input]?.[state];
      if (output?.symbol === previousSymbol) {
        output.symbol = normalized;
        output.code = existingCode ?? output.code;
      }
    }
  }
  return nextProgram;
}

export function changeMealyOutputCode(
  program: MealyProgram,
  inputSymbol: string,
  state: string,
  nextCode: number,
): MealyProgram {
  const selectedOutput = program.outputs[inputSymbol]?.[state];
  if (!selectedOutput?.symbol) {
    return setMealyOutput(program, inputSymbol, state, { code: nextCode });
  }
  if (selectedOutput.code === nextCode) {
    return program;
  }

  const targetSymbol = selectedOutput.symbol;
  const previousCode = selectedOutput.code;
  const collidingSymbol = findOutput(
    program,
    (output) => output.symbol !== targetSymbol && output.code === nextCode,
  )?.symbol;
  const nextProgram = cloneJson(program);

  for (const input of nextProgram.inputSymbols) {
    for (const currentState of nextProgram.states) {
      const output = nextProgram.outputs[input]?.[currentState];
      if (output?.symbol === targetSymbol) {
        output.code = nextCode;
      } else if (collidingSymbol && output?.symbol === collidingSymbol) {
        output.code = previousCode;
      }
    }
  }

  return nextProgram;
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

function remapStateOutputs(
  outputs: Record<string, Record<string, { symbol: string; code: number }>>,
  previousName: string,
  nextName: string,
  inputSymbols: string[],
) {
  for (const input of inputSymbols) {
    const outRow = outputs[input];
    if (!outRow) continue;
    outRow[nextName] = outRow[previousName];
    if (nextName !== previousName) {
      delete outRow[previousName];
    }
  }
}

function removeStateFromTransitionsAndOutputs(
  transitions: Record<string, Record<string, string>>,
  outputs: Record<string, Record<string, { symbol: string; code: number }>>,
  stateToRemove: string,
  fallback: string,
  inputSymbols: string[],
  states: string[],
) {
  for (const input of inputSymbols) {
    const transRow = transitions[input];
    if (transRow) {
      delete transRow[stateToRemove];
      for (const state of states) {
        if (transRow[state] === stateToRemove) {
          transRow[state] = fallback;
        }
      }
    }

    const outRow = outputs[input];
    if (outRow) {
      delete outRow[stateToRemove];
    }
  }
}

export function addMealyState(
  program: MealyProgram,
  requestedName?: string,
): { nextProgram: MealyProgram; stateName: string } {
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

    if (!nextProgram.outputs[input]) {
      nextProgram.outputs[input] = {};
    }
    nextProgram.outputs[input][normalized] = {
      symbol: `OUT_${stateIndex}`,
      code: stateIndex,
    };
  }

  return { nextProgram, stateName: normalized };
}

export function removeMealyState(
  program: MealyProgram,
  stateToRemove: string,
): MealyProgram {
  if (program.states.length <= 1 || !program.states.includes(stateToRemove)) {
    return program;
  }

  const nextProgram = cloneJson(program);
  nextProgram.states = nextProgram.states.filter((s) => s !== stateToRemove);
  const fallback = nextProgram.states[0];

  if (nextProgram.initialState === stateToRemove) {
    nextProgram.initialState = fallback;
  }

  removeStateFromTransitionsAndOutputs(
    nextProgram.transitions,
    nextProgram.outputs,
    stateToRemove,
    fallback,
    nextProgram.inputSymbols,
    nextProgram.states,
  );

  return nextProgram;
}

export function renameMealyState(
  program: MealyProgram,
  previousName: string,
  nextName: string,
): MealyProgram | null {
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

  remapStateOutputs(
    nextProgram.outputs,
    previousName,
    normalized,
    nextProgram.inputSymbols,
  );

  return nextProgram;
}

export function addMealyInputSymbol(program: MealyProgram): MealyProgram {
  const input = createNextInputSymbol(program.inputSymbols);
  const nextProgram = cloneJson(program);
  nextProgram.inputSymbols.push(input);

  const inputIndex = nextProgram.inputSymbols.length - 1;
  const firstInput = nextProgram.inputSymbols[0];

  nextProgram.transitions[input] = Object.fromEntries(
    nextProgram.states.map((state) => [state, nextProgram.initialState]),
  );

  nextProgram.outputs[input] = Object.fromEntries(
    nextProgram.states.map((state, stateIndex) => [
      state,
      nextProgram.outputs[firstInput]?.[state] ?? {
        symbol: `OUT_${inputIndex}_${stateIndex}`,
        code: inputIndex * nextProgram.states.length + stateIndex,
      },
    ]),
  );

  return nextProgram;
}

export function removeMealyInputSymbol(
  program: MealyProgram,
  inputToRemove: string,
): MealyProgram {
  const nextProgram = cloneJson(program);
  nextProgram.inputSymbols = nextProgram.inputSymbols.filter(
    (input) => input !== inputToRemove,
  );
  nextProgram.inputWord = nextProgram.inputWord.filter(
    (input) => input !== inputToRemove,
  );
  delete nextProgram.transitions[inputToRemove];
  delete nextProgram.outputs[inputToRemove];
  return nextProgram;
}

export function renameMealyInputSymbol(
  program: MealyProgram,
  previousSymbol: string,
  nextSymbol: string,
): MealyProgram | null {
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
  nextProgram.outputs[normalized] = nextProgram.outputs[previousSymbol];
  if (normalized !== previousSymbol) {
    delete nextProgram.outputs[previousSymbol];
  }
  nextProgram.inputWord = nextProgram.inputWord.map((input) =>
    input === previousSymbol ? normalized : input,
  );
  return nextProgram;
}

export function setMealyTransition(
  program: MealyProgram,
  inputSymbol: string,
  state: string,
  targetState: string,
): MealyProgram {
  const nextProgram = cloneJson(program);
  if (!nextProgram.transitions[inputSymbol]) {
    nextProgram.transitions[inputSymbol] = {};
  }
  nextProgram.transitions[inputSymbol][state] = targetState;
  return nextProgram;
}

export function setMealyOutput(
  program: MealyProgram,
  inputSymbol: string,
  state: string,
  patch: Partial<{ symbol: string; code: number }> | undefined,
): MealyProgram {
  const nextProgram = cloneJson(program);
  if (!nextProgram.outputs[inputSymbol]) {
    nextProgram.outputs[inputSymbol] = {};
  }
  const current = nextProgram.outputs[inputSymbol][state] ?? {
    symbol: "",
    code: 0,
  };
  nextProgram.outputs[inputSymbol][state] = { ...current, ...patch };
  return nextProgram;
}
