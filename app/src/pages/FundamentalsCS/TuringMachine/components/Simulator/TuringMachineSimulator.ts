import type { ISimulator } from "@/types/simulator.ts";
import type { TMConfig, TMState, TapeSymbol } from "./types";

export function validateTMConfig(config: TMConfig): void {
  const errors: string[] = [];
  const states = new Set(config.states);
  const inputAlphabet = new Set(config.inputAlphabet);
  const tapeAlphabet = new Set(config.tapeAlphabet);

  if (config.haltStates.length === 0) {
    errors.push("At least one halt state must be defined.");
  }

  if (!states.has(config.initialState)) {
    errors.push(`The initial state '${config.initialState}' must exist in the set of states.`);
  }

  const invalidHaltStates = config.haltStates.filter((state) => !states.has(state));
  if (invalidHaltStates.length > 0) {
    errors.push(
      `All halt states must exist in the set of states. Invalid halt states: ${invalidHaltStates.join(", ")}.`,
    );
  }

  if (!tapeAlphabet.has(config.blankSymbol)) {
    errors.push(`The blank symbol '${config.blankSymbol}' must be part of the tape alphabet.`);
  }

  // TODO check if blank isn't allowed in input
  // if (inputAlphabet.has(config.blankSymbol)) {
  //   errors.push(`The blank symbol '${config.blankSymbol}' must not be part of the input alphabet.`);
  // }

  const invalidInitialTapeSymbols = config.initialTape.filter(
    (symbol) => !inputAlphabet.has(symbol),
  );
  if (invalidInitialTapeSymbols.length > 0) {
    errors.push(
      `All symbols on the initial tape must be part of the input alphabet. Invalid symbols: ${Array.from(new Set(invalidInitialTapeSymbols)).join(", ")}.`,
    );
  }

  for (const [readSymbol, stateTransitions] of Object.entries(config.transitions)) {
    if (!tapeAlphabet.has(readSymbol)) {
      errors.push(
        `A transition is defined for read symbol '${readSymbol}', but this symbol is not part of the tape alphabet.`,
      );
    }

    for (const [currentState, transition] of Object.entries(stateTransitions)) {
      if (!states.has(currentState)) {
        errors.push(
          `A transition is defined for state '${currentState}', but this state is not part of the set of states.`,
        );
      }

      if (!states.has(transition.nextState)) {
        errors.push(
          `Transition from state '${currentState}' on symbol '${readSymbol}' points to unknown next state '${transition.nextState}'.`,
        );
      }

      if (!tapeAlphabet.has(transition.writeSymbol)) {
        errors.push(
          `Transition from state '${currentState}' on symbol '${readSymbol}' writes unknown symbol '${transition.writeSymbol}'.`,
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}

export class TuringMachineSimulator implements ISimulator<TMConfig, TMState> {
  private config: TMConfig | null = null;
  private state: TMState | null = null;
  // History stack for stepBack functionality
  private history: TMState[] = [];

  /**
   * Initializes the simulator with a configuration and optional initial state.
   */
  public initialize(config: TMConfig, state?: TMState): void {
    validateTMConfig(config);

    this.config = JSON.parse(JSON.stringify(config)); // deep copy config
    this.history = [];

    if (state) {
      this.state = JSON.parse(JSON.stringify(state)); // deep copy state
      if (this.state && this.state.stepCount === undefined) {
        this.state.stepCount = 0;
      }
    } else {
      // create initial state from config
      const initialTape: Record<number, TapeSymbol> = {};
      config.initialTape.forEach((symbol, index) => {
        initialTape[index] = symbol;
      });

      this.state = {
        currentState: config.initialState,
        headPosition: 0,
        tape: initialTape,
        isHalted: config.haltStates.includes(config.initialState),
        stepCount: 0,
      };
    }
  }

  /**
   * Executes a single step of the simulation.
   */
  public step(): void {
    if (!this.config || !this.state) {
      throw new Error("Simulator is not initialized.");
    }

    if (this.state.isHalted || this.state.errorMessage) {
      return;
    }

    // Save current state to history before changing it
    this.history.push(JSON.parse(JSON.stringify(this.state)));

    const currentSymbol =
      this.state.tape[this.state.headPosition] || this.config.blankSymbol;
    const currentState = this.state.currentState;

    // Look up the transition
    const symbolTransitions = this.config.transitions[currentSymbol];
    if (!symbolTransitions) {
      // No transitions defined for this symbol
      this.state.errorMessage = `No transition defined for symbol '${currentSymbol}'.`;
      this.state.isHalted = true;
      return;
    }

    const transition = symbolTransitions[currentState];
    if (!transition) {
      // No transition defined for this state and symbol combination
      this.state.errorMessage = `No transition defined for state '${currentState}' and symbol '${currentSymbol}'.`;
      this.state.isHalted = true;
      return;
    }

    // Apply the transition
    // 1. Write symbol to tape
    this.state.tape[this.state.headPosition] = transition.writeSymbol;

    // 2. Change state
    this.state.currentState = transition.nextState;

    // 3. Move head
    if (transition.movement === "R") {
      this.state.headPosition += 1;
    } else if (transition.movement === "L") {
      this.state.headPosition -= 1;
    }
    // if 'N', head position stays the same

    this.state.stepCount += 1;

    // Check if the new state is a halting state
    if (this.config.haltStates.includes(this.state.currentState)) {
      this.state.isHalted = true;
    }
  }

  /**
   * Executes a single step backwards by restoring the previous state from history.
   */
  public stepBack(): void {
    if (!this.config || !this.state) {
      throw new Error("Simulator is not initialized.");
    }

    if (this.history.length === 0) {
      // Can't step back further
      return;
    }

    // Pop the last state from history and set it as current
    const previousState = this.history.pop();
    if (previousState) {
      this.state = previousState;
    }
  }

  /**
   * Resets the simulator to its initial state using the stored configuration.
   */
  public reset(): void {
    if (!this.config) {
      throw new Error("Simulator has no configuration to reset to.");
    }
    // Re-initialize with the current config to reset state and clear history
    this.initialize(this.config);
  }

  /**
   * Returns a copy of the current configuration.
   */
  public getConfig(): TMConfig {
    if (!this.config) {
      throw new Error("Simulator is not initialized.");
    }
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Returns a copy of the current state.
   */
  public getCurrentState(): TMState {
    if (!this.state) {
      throw new Error("Simulator is not initialized.");
    }
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Checks if the simulation is finished (halted or error).
   */
  public isFinished(): boolean {
    if (!this.state) return false;
    return this.state.isHalted || !!this.state.errorMessage;
  }
}
