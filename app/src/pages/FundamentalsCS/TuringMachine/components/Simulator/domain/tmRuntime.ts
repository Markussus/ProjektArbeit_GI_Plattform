import type { StateName, TapeSymbol } from "./tmTypes";

export type TMHaltReason =
  | { type: "halt_state"; state: StateName }
  | { type: "missing_transition"; state: StateName; symbol: TapeSymbol };

export interface TMRuntime {
  currentState: StateName;
  headPosition: number;
  tape: Record<number, TapeSymbol>;
  stepCount: number;
  halted: boolean;
  haltReason: TMHaltReason | null;
}
