export {
  DEFAULT_BLANK_SYMBOL,
  type HeadMovement,
  type StateName,
  type TapeSymbol,
  type TMTransition,
} from "./domain/tmTypes";
export {
  type TMProgram as TMConfig,
  type TransitionTable,
} from "./domain/tmProgram";
export {
  type TMHaltReason,
  type TMRuntime as TMState,
} from "./domain/tmRuntime";
