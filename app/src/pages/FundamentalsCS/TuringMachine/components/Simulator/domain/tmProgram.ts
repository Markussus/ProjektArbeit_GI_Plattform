import type { StateName, TapeSymbol, TMTransition } from "./tmTypes";

export type TransitionTable = Partial<
  Record<TapeSymbol, Partial<Record<StateName, TMTransition>>>
>;

export interface TMProgram {
  states: StateName[];
  inputAlphabet: TapeSymbol[];
  tapeAlphabet: TapeSymbol[];
  blankSymbol: TapeSymbol;
  initialState: StateName;
  haltStates: StateName[];
  transitions: TransitionTable;
  initialTape: TapeSymbol[];
}

export function deriveInputAlphabet(
  program: Pick<TMProgram, "blankSymbol" | "tapeAlphabet">,
): TapeSymbol[] {
  return [
    program.blankSymbol,
    ...program.tapeAlphabet.filter((symbol) => symbol !== program.blankSymbol),
  ];
}

export function withDerivedInputAlphabet(program: TMProgram): TMProgram {
  return {
    ...program,
    inputAlphabet: deriveInputAlphabet(program),
  };
}
