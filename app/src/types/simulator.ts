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
