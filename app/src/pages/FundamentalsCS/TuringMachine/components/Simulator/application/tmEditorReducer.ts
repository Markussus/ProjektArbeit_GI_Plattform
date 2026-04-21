import { cloneJson } from "@/lib/utils";
import { withDerivedInputAlphabet } from "../domain/tmProgram";
import type { TMProgram } from "../domain/tmProgram";
import type { StateName, TapeSymbol, TMTransition } from "../domain/tmTypes";

export type TMEditorAction =
  | { type: "replace_program"; program: TMProgram }
  | { type: "set_initial_tape"; value: string }
  | { type: "set_initial_state"; state: StateName }
  | { type: "toggle_halt_state"; state: StateName; isHalting: boolean }
  | { type: "add_tape_symbol" }
  | { type: "remove_tape_symbol"; symbol: TapeSymbol }
  | {
      type: "rename_tape_symbol";
      currentSymbol: TapeSymbol;
      nextSymbol: TapeSymbol;
    }
  | { type: "add_state" }
  | { type: "remove_state"; state: StateName }
  | { type: "rename_state"; currentState: StateName; nextState: StateName }
  | {
      type: "update_transition";
      readSymbol: TapeSymbol;
      currentState: StateName;
      transition: TMTransition | null;
    };

export function tmEditorReducer(
  program: TMProgram,
  action: TMEditorAction,
): TMProgram {
  switch (action.type) {
    case "replace_program":
      return createProgramDraft(action.program);
    case "set_initial_tape":
      return withDerivedInputAlphabet({
        ...program,
        initialTape: action.value.split(""),
      });
    case "set_initial_state":
      return updateInitialState(program, action.state);
    case "toggle_halt_state":
      return toggleHaltState(program, action.state, action.isHalting);
    case "add_tape_symbol":
      return addTapeSymbol(program);
    case "remove_tape_symbol":
      return removeTapeSymbol(program, action.symbol);
    case "rename_tape_symbol":
      return renameTapeSymbol(program, action.currentSymbol, action.nextSymbol);
    case "add_state":
      return addState(program);
    case "remove_state":
      return removeState(program, action.state);
    case "rename_state":
      return renameState(program, action.currentState, action.nextState);
    case "update_transition":
      return updateTransition(
        program,
        action.readSymbol,
        action.currentState,
        action.transition,
      );
    default:
      return program;
  }
}

export function createProgramDraft(program: TMProgram): TMProgram {
  return withDerivedInputAlphabet(cloneJson(program));
}

function updateInitialState(program: TMProgram, state: StateName): TMProgram {
  if (!program.states.includes(state)) {
    return program;
  }

  return withDerivedInputAlphabet({
    ...program,
    initialState: state,
  });
}

function toggleHaltState(
  program: TMProgram,
  state: StateName,
  isHalting: boolean,
): TMProgram {
  return withDerivedInputAlphabet({
    ...program,
    haltStates: isHalting
      ? [...new Set([...program.haltStates, state])]
      : program.haltStates.filter((haltState) => haltState !== state),
  });
}

function addTapeSymbol(program: TMProgram): TMProgram {
  return withDerivedInputAlphabet({
    ...program,
    tapeAlphabet: [...program.tapeAlphabet, findNextTapeSymbol(program)],
  });
}

function removeTapeSymbol(
  program: TMProgram,
  symbolToRemove: TapeSymbol,
): TMProgram {
  if (
    symbolToRemove === program.blankSymbol ||
    !program.tapeAlphabet.includes(symbolToRemove)
  ) {
    return program;
  }

  const nextProgram = cloneJson(program);

  nextProgram.tapeAlphabet = nextProgram.tapeAlphabet.filter(
    (symbol) => symbol !== symbolToRemove,
  );
  nextProgram.initialTape = nextProgram.initialTape.map((symbol) =>
    symbol === symbolToRemove ? nextProgram.blankSymbol : symbol,
  );

  delete nextProgram.transitions[symbolToRemove];

  for (const stateTransitions of Object.values(nextProgram.transitions)) {
    for (const transition of Object.values(stateTransitions ?? {})) {
      if (!transition) {
        continue;
      }

      if (transition.writeSymbol === symbolToRemove) {
        transition.writeSymbol = nextProgram.blankSymbol;
      }
    }
  }

  return withDerivedInputAlphabet(nextProgram);
}

function renameTapeSymbol(
  program: TMProgram,
  currentSymbol: TapeSymbol,
  nextSymbol: TapeSymbol,
): TMProgram {
  const normalizedNextSymbol = nextSymbol.trim();

  if (
    currentSymbol === normalizedNextSymbol ||
    normalizedNextSymbol === "" ||
    (program.tapeAlphabet.includes(normalizedNextSymbol) &&
      normalizedNextSymbol !== currentSymbol)
  ) {
    return program;
  }

  const nextProgram = cloneJson(program);

  nextProgram.tapeAlphabet = nextProgram.tapeAlphabet.map((symbol) =>
    symbol === currentSymbol ? normalizedNextSymbol : symbol,
  );
  nextProgram.initialTape = nextProgram.initialTape.map((symbol) =>
    symbol === currentSymbol ? normalizedNextSymbol : symbol,
  );

  if (nextProgram.blankSymbol === currentSymbol) {
    nextProgram.blankSymbol = normalizedNextSymbol;
  }

  if (nextProgram.transitions[currentSymbol]) {
    nextProgram.transitions[normalizedNextSymbol] =
      nextProgram.transitions[currentSymbol];
    delete nextProgram.transitions[currentSymbol];
  }

  for (const stateTransitions of Object.values(nextProgram.transitions)) {
    for (const transition of Object.values(stateTransitions ?? {})) {
      if (!transition) {
        continue;
      }

      if (transition.writeSymbol === currentSymbol) {
        transition.writeSymbol = normalizedNextSymbol;
      }
    }
  }

  return withDerivedInputAlphabet(nextProgram);
}

function addState(program: TMProgram): TMProgram {
  return withDerivedInputAlphabet({
    ...program,
    states: [...program.states, findNextStateName(program.states)],
  });
}

function removeState(program: TMProgram, stateToRemove: StateName): TMProgram {
  if (!program.states.includes(stateToRemove) || program.states.length <= 1) {
    return program;
  }

  const nextProgram = cloneJson(program);
  const remainingStates = nextProgram.states.filter(
    (state) => state !== stateToRemove,
  );
  const fallbackState =
    remainingStates.find((state) => state === nextProgram.initialState) ??
    remainingStates[0];

  if (!fallbackState) {
    return program;
  }

  nextProgram.states = remainingStates;
  nextProgram.haltStates = nextProgram.haltStates.filter(
    (state) => state !== stateToRemove,
  );

  if (nextProgram.initialState === stateToRemove) {
    nextProgram.initialState = fallbackState;
  }

  for (const stateTransitions of Object.values(nextProgram.transitions)) {
    if (!stateTransitions) {
      continue;
    }

    delete stateTransitions[stateToRemove];

    for (const transition of Object.values(stateTransitions)) {
      if (!transition) {
        continue;
      }

      if (transition.nextState === stateToRemove) {
        transition.nextState = fallbackState;
      }
    }
  }

  return withDerivedInputAlphabet(nextProgram);
}

function renameState(
  program: TMProgram,
  currentState: StateName,
  nextState: StateName,
): TMProgram {
  const normalizedNextState = nextState.trim();

  if (
    currentState === normalizedNextState ||
    normalizedNextState === "" ||
    (program.states.includes(normalizedNextState) &&
      normalizedNextState !== currentState)
  ) {
    return program;
  }

  const nextProgram = cloneJson(program);

  nextProgram.states = nextProgram.states.map((state) =>
    state === currentState ? normalizedNextState : state,
  );
  nextProgram.haltStates = nextProgram.haltStates.map((state) =>
    state === currentState ? normalizedNextState : state,
  );

  if (nextProgram.initialState === currentState) {
    nextProgram.initialState = normalizedNextState;
  }

  for (const stateTransitions of Object.values(nextProgram.transitions)) {
    if (!stateTransitions) {
      continue;
    }

    if (stateTransitions[currentState]) {
      stateTransitions[normalizedNextState] = stateTransitions[currentState];
      delete stateTransitions[currentState];
    }

    for (const transition of Object.values(stateTransitions)) {
      if (!transition) {
        continue;
      }

      if (transition.nextState === currentState) {
        transition.nextState = normalizedNextState;
      }
    }
  }

  return withDerivedInputAlphabet(nextProgram);
}

function updateTransition(
  program: TMProgram,
  readSymbol: TapeSymbol,
  currentState: StateName,
  transition: TMTransition | null,
): TMProgram {
  const nextProgram = cloneJson(program);

  if (!nextProgram.transitions[readSymbol]) {
    nextProgram.transitions[readSymbol] = {};
  }

  if (transition) {
    nextProgram.transitions[readSymbol][currentState] = transition;
  } else {
    delete nextProgram.transitions[readSymbol]?.[currentState];
  }

  return withDerivedInputAlphabet(nextProgram);
}

function findNextTapeSymbol(program: TMProgram): TapeSymbol {
  for (const [start, end] of [
    ["0", "9"],
    ["a", "z"],
    ["A", "Z"],
  ] as const) {
    for (
      let charCode = start.charCodeAt(0);
      charCode <= end.charCodeAt(0);
      charCode += 1
    ) {
      const symbol = String.fromCharCode(charCode);
      if (!program.tapeAlphabet.includes(symbol)) {
        return symbol;
      }
    }
  }

  return String.fromCharCode("Z".charCodeAt(0) + 1);
}

function findNextStateName(states: StateName[]): StateName {
  let stateIndex = 0;

  while (states.includes(`q${stateIndex}`)) {
    stateIndex += 1;
  }

  return `q${stateIndex}`;
}
