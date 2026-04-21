export type HeadMovement = "L" | "R" | "N";

export type StateName = string;
export type TapeSymbol = string;

export interface TMTransition {
  nextState: StateName;
  writeSymbol: TapeSymbol;
  movement: HeadMovement;
}

export const DEFAULT_BLANK_SYMBOL: TapeSymbol = "\u25CA";
