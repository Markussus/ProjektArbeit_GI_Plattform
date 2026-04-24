import type { StateName } from "./faTypes";

export type FAHaltReason =
  | { type: "accepted"; states: StateName[] }
  | { type: "rejected"; states: StateName[] }
  | { type: "no_transition"; state: StateName; symbol: string }
  | { type: "input_exhausted"; states: StateName[] };

export interface FARuntime {
  /** Current active state(s). DFA: always 1, NFA: possibly many */
  activeStates: StateName[];
  /** The input word being processed */
  inputWord: string[];
  /** Current position in the input word (0-based index of next symbol to read) */
  inputPosition: number;
  /** Step count */
  stepCount: number;
  /** Whether the simulation has halted */
  halted: boolean;
  /** Reason for halting */
  haltReason: FAHaltReason | null;
  /** History of active states per step for trace display */
  stateHistory: StateName[][];
  /** History of transitions taken: [fromStates, symbol, toStates] */
  transitionHistory: Array<{
    fromStates: StateName[];
    symbol: string;
    toStates: StateName[];
  }>;
}
