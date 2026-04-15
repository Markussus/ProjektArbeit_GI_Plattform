export type HeadMovement = "L" | "R" | "N";

export interface TMTransition {
  nextState: StateName;
  writeSymbol: TapeSymbol;
  movement: HeadMovement;
}

export type StateName = string;
export type TapeSymbol = string;

export const DEFAULT_BLANK_SYMBOL: TapeSymbol = "◊";

export type TransitionTable = Record<
  TapeSymbol,
  Record<StateName, TMTransition>
>;

export interface TMConfig {
  states: StateName[];
  inputAlphabet: TapeSymbol[];
  tapeAlphabet: TapeSymbol[];
  blankSymbol: TapeSymbol;
  initialState: StateName;
  haltStates: StateName[];
  transitions: TransitionTable;
  initialTape: TapeSymbol[];
}

export interface TMState {
  currentState: StateName;
  headPosition: number;
  tape: Record<number, TapeSymbol>;
  isHalted: boolean;
  errorMessage?: string;
  stepCount: number;
}
