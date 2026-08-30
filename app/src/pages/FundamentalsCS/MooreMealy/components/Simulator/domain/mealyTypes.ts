import type { InternalRepresentation, MooreOutput } from "./mooreTypes";

export type { InternalRepresentation };

export interface MealyProgram {
  states: string[];
  inputSymbols: string[];
  transitions: Record<string, Record<string, string>>;
  outputs: Record<string, Record<string, MooreOutput>>;
  initialState: string;
  inputWord: string[];
  representation: InternalRepresentation;
}

export interface MealyTransitionStep {
  fromState: string;
  inputSymbol: string;
  toState: string;
  outputSymbol: string;
}

export interface MealyRuntime {
  currentState: string;
  inputPosition: number;
  outputSymbols: string[];
  stepCount: number;
  halted: boolean;
  transitionHistory: MealyTransitionStep[];
}
