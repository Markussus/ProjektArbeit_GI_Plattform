import type { StateName, TMConfig, TapeSymbol, TMTransition } from "../types";
import { cloneJson } from "@/lib/utils";
import { parseTransition } from "../utils/tmParsing";

const DEFAULT_DRAFT_STATE = "q";

export function updateInitialTape(config: TMConfig, value: string): TMConfig {
  return {
    ...config,
    initialTape: value.split(""),
  };
}

export function updateInitialState(
  config: TMConfig,
  initialState: StateName,
): TMConfig {
  return {
    ...config,
    initialState,
  };
}

export function toggleHaltState(
  config: TMConfig,
  state: StateName,
  isHalting: boolean,
): TMConfig {
  return {
    ...config,
    haltStates: isHalting
      ? [...config.haltStates, state]
      : config.haltStates.filter((haltState) => haltState !== state),
  };
}

export function addTapeSymbol(config: TMConfig): TMConfig {
  const nextSymbol = findNextTapeSymbol(config.tapeAlphabet);

  return {
    ...config,
    tapeAlphabet: [...config.tapeAlphabet, nextSymbol],
  };
}

export function removeTapeSymbol(
  config: TMConfig,
  symbolToRemove: TapeSymbol,
): TMConfig {
  const nextConfig = cloneJson(config);

  nextConfig.tapeAlphabet = nextConfig.tapeAlphabet.filter(
    (symbol) => symbol !== symbolToRemove,
  );
  delete nextConfig.transitions[symbolToRemove];

  return nextConfig;
}

export function renameTapeSymbol(
  config: TMConfig,
  currentSymbol: TapeSymbol,
  nextSymbol: TapeSymbol,
): TMConfig {
  if (currentSymbol === nextSymbol) {
    return config;
  }

  const nextConfig = cloneJson(config);

  nextConfig.tapeAlphabet = nextConfig.tapeAlphabet.map((symbol) =>
    symbol === currentSymbol ? nextSymbol : symbol,
  );

  if (nextConfig.transitions[currentSymbol] !== undefined) {
    nextConfig.transitions[nextSymbol] = nextConfig.transitions[currentSymbol];
    delete nextConfig.transitions[currentSymbol];
  }

  return nextConfig;
}

export function addState(config: TMConfig): TMConfig {
  const newState = findNextStateName(config.states);

  return {
    ...config,
    states: [...config.states, newState],
  };
}

export function removeState(
  config: TMConfig,
  stateToRemove: StateName,
): TMConfig {
  const nextConfig = cloneJson(config);

  nextConfig.states = nextConfig.states.filter(
    (state) => state !== stateToRemove,
  );

  for (const symbol of Object.keys(nextConfig.transitions)) {
    delete nextConfig.transitions[symbol][stateToRemove];
  }

  nextConfig.haltStates = nextConfig.haltStates.filter(
    (state) => state !== stateToRemove,
  );

  if (nextConfig.initialState === stateToRemove) {
    nextConfig.initialState = nextConfig.states[0];
  }

  return nextConfig;
}

export function renameState(
  config: TMConfig,
  currentState: StateName,
  nextState: StateName,
): TMConfig {
  if (currentState === nextState) {
    return config;
  }

  const nextConfig = cloneJson(config);

  nextConfig.states = nextConfig.states.map((state) =>
    state === currentState ? nextState : state,
  );

  for (const symbol of Object.keys(nextConfig.transitions)) {
    if (!nextConfig.transitions[symbol][currentState]) {
      continue;
    }

    nextConfig.transitions[symbol][nextState] =
      nextConfig.transitions[symbol][currentState];
    delete nextConfig.transitions[symbol][currentState];
  }

  nextConfig.haltStates = nextConfig.haltStates.map((state) =>
    state === currentState ? nextState : state,
  );

  if (nextConfig.initialState === currentState) {
    nextConfig.initialState = nextState;
  }

  return nextConfig;
}

export function updateTransitionCellValue(
  config: TMConfig,
  symbol: TapeSymbol,
  state: StateName,
  value: string,
): TMConfig {
  const nextConfig = cloneJson(config);
  const parsedTransition = parseTransition(value);

  if (parsedTransition) {
    setTransition(nextConfig, symbol, state, parsedTransition);
    return nextConfig;
  }

  if (value.trim() === "") {
    if (nextConfig.transitions[symbol]?.[state]) {
      delete nextConfig.transitions[symbol][state];
    }

    return nextConfig;
  }

  if (!config.transitions[symbol]?.[state]) {
    setTransition(nextConfig, symbol, state, createDraftTransition(config));
  }

  return nextConfig;
}

function setTransition(
  config: TMConfig,
  symbol: TapeSymbol,
  state: StateName,
  transition: TMTransition,
): void {
  if (!config.transitions[symbol]) {
    config.transitions[symbol] = {};
  }

  config.transitions[symbol][state] = transition;
}

function createDraftTransition(config: TMConfig): TMTransition {
  return {
    nextState: DEFAULT_DRAFT_STATE,
    writeSymbol: config.blankSymbol,
    movement: "N",
  };
}

function findNextTapeSymbol(tapeAlphabet: TapeSymbol[]): TapeSymbol {
  for (const charCodeRange of [
    ["0", "9"],
    ["a", "z"],
    ["A", "Z"],
  ] as const) {
    const [start, end] = charCodeRange;

    for (
      let charCode = start.charCodeAt(0);
      charCode <= end.charCodeAt(0);
      charCode += 1
    ) {
      const symbol = String.fromCharCode(charCode);
      if (!tapeAlphabet.includes(symbol)) {
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
