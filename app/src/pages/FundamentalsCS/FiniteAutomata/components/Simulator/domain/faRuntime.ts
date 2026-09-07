import type { StateName } from "./faTypes";

/**
 * Why a run stopped. A dead end (no transition for the next symbol) is also a
 * rejection — it is told apart from "input consumed, but no accept state" by
 * `FARuntime.activeStates` being empty.
 */
export type FAHaltReason =
  | { type: "accepted"; states: StateName[] }
  | { type: "rejected"; states: StateName[] };

export interface FARuntime {
  activeStates: StateName[];
  inputWord: string[];
  inputPosition: number;
  stepCount: number;
  halted: boolean;
  haltReason: FAHaltReason | null;
  stateHistory: StateName[][];
  transitionHistory: Array<{
    fromStates: StateName[];
    symbol: string;
    toStates: StateName[];
  }>;
}
