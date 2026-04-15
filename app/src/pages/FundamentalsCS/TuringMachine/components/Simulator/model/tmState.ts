import type { TMConfig, TMState, TapeSymbol } from "../types";

export function createInitialTMState(config: TMConfig): TMState {
  const initialTape: Record<number, TapeSymbol> = {};

  config.initialTape.forEach((symbol, index) => {
    initialTape[index] = symbol;
  });

  return {
    currentState: config.initialState,
    headPosition: 0,
    tape: initialTape,
    isHalted: config.haltStates.includes(config.initialState),
    stepCount: 0,
  };
}

export function readTapeSymbol(
  tape: Record<number, TapeSymbol>,
  headPosition: number,
  blankSymbol: TapeSymbol,
): TapeSymbol {
  return tape[headPosition] || blankSymbol;
}
