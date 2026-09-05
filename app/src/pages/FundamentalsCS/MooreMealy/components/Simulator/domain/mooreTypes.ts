export type InternalRepresentation = "decimal" | "binary";

export interface MooreOutput {
  symbol: string;
  code: number;
}

export interface MooreProgram {
  states: string[];
  inputSymbols: string[];
  transitions: Record<string, Record<string, string>>;
  outputs: Record<string, MooreOutput>;
  initialState: string;
  inputWord: string[];
  representation: InternalRepresentation;
}

export interface MooreTransitionStep {
  fromState: string;
  inputSymbol: string;
  toState: string;
  outputSymbol: string;
}

export interface MooreRuntime {
  currentState: string;
  inputPosition: number;
  outputSymbols: string[];
  stepCount: number;
  halted: boolean;
  transitionHistory: MooreTransitionStep[];
}
