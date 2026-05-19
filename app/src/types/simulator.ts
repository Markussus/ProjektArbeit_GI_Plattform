export interface ISimulator<TConfig, TState> {
  /**
   * Initializes the simulator directly with a configuration and state.
   * The state is optional, if not supplied the starting state must be supplied in the config.
   */
  initialize(config: TConfig, state?: TState): void;

  /**
   * Executes a single step of the simulation.
   */
  step(): void;

  /**
   * Executes a single step backwards (if state history is preserved).
   */
  stepBack(): void;

  /**
   * Resets the simulator to the initial state provided during initialization.
   */
  reset(): void;

  /**
   * Returns the complete current config of the simulator.
   * Useful for config exports.
   */
  getConfig(): TConfig;

  /**
   * Returns the complete current state of the simulator.
   * Useful for UI rendering or state exports.
   */
  getCurrentState(): TState;

  /**
   * Checks if the simulator has reached a final/halting state.
   * Returns true if the simulator is finished, otherwise false.
   */
  isFinished(): boolean;
}

/**
 * Lifecycle phases of a run-based executor (no step-by-step).
 * Used for simulators that execute code asynchronously, e.g. the Java runner.
 */
export type ExecutionPhase = "idle" | "running" | "done" | "error" | "stopped";

/**
 * Contract for run-based simulators with a clear Input → Run → Stop → Output cycle.
 * Use this instead of ISimulator when there is no step-by-step execution —
 * e.g. for code runners, compilers, or any fire-and-forget execution model.
 */
export interface IExecutable<TInput, TOutput> {
  /** Starts execution with the given input. */
  run(input: TInput): void;

  /** Cancels the current execution. */
  stop(): void;

  /** Returns the current execution phase. */
  getPhase(): ExecutionPhase;

  /** Returns the current output (may be partial while running). */
  getOutput(): TOutput;
}

/**
 * A validation issue reported by any simulator or executor.
 * Provides a common format for errors, warnings and info messages
 * that can be rendered uniformly across all simulators.
 */
export interface IValidationIssue {
  /** Machine-readable error identifier. */
  code: string;

  /** Severity level of the issue. */
  severity: "error" | "warning" | "info";

  /** Human-readable description of the problem. */
  message: string;

  /** 1-based line number where the issue occurred (optional). */
  line?: number;

  /** 1-based column number where the issue occurred (optional). */
  column?: number;
}
