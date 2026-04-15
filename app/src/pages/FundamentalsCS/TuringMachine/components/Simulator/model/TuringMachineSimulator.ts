import { cloneJson } from "@/lib/utils";
import type { ISimulator } from "@/types/simulator.ts";
import type { HeadMovement, TMConfig, TMState, TMTransition } from "../types";
import { validateTMConfig } from "./tmConfigValidation";
import { createInitialTMState, readTapeSymbol } from "./tmState";

export class TuringMachineSimulator implements ISimulator<TMConfig, TMState> {
  private config: TMConfig | null = null;
  private state: TMState | null = null;
  private history: TMState[] = [];

  public initialize(config: TMConfig, state?: TMState): void {
    validateTMConfig(config);

    this.config = cloneJson(config);
    this.history = [];
    this.state = state
      ? this.normalizeState(state)
      : createInitialTMState(this.config);
  }

  public step(): void {
    const { config, state } = this.getInitializedContext();

    if (state.isHalted || state.errorMessage) {
      return;
    }

    this.history.push(cloneJson(state));

    const currentSymbol = this.getCurrentSymbol(config, state);
    const transition = this.resolveTransition(
      config,
      state.currentState,
      currentSymbol,
    );

    if (!transition) {
      return;
    }

    this.applyTransition(state, transition);
    this.updateHaltingStatus(config, state);
  }

  public stepBack(): void {
    this.getInitializedContext();

    const previousState = this.history.pop();
    if (previousState) {
      this.state = previousState;
    }
  }

  public reset(): void {
    if (!this.config) {
      throw new Error("Simulator has no configuration to reset to.");
    }

    this.initialize(this.config);
  }

  public getConfig(): TMConfig {
    const { config } = this.getInitializedContext();
    return cloneJson(config);
  }

  public getCurrentState(): TMState {
    const { state } = this.getInitializedContext();
    return cloneJson(state);
  }

  public isFinished(): boolean {
    return this.state
      ? this.state.isHalted || !!this.state.errorMessage
      : false;
  }

  private getInitializedContext(): { config: TMConfig; state: TMState } {
    if (!this.config || !this.state) {
      throw new Error("Simulator is not initialized.");
    }

    return { config: this.config, state: this.state };
  }

  private normalizeState(state: TMState): TMState {
    const nextState = cloneJson(state);

    if (nextState.stepCount === undefined) {
      nextState.stepCount = 0;
    }

    return nextState;
  }

  private getCurrentSymbol(config: TMConfig, state: TMState) {
    return readTapeSymbol(state.tape, state.headPosition, config.blankSymbol);
  }

  private resolveTransition(
    config: TMConfig,
    currentState: string,
    currentSymbol: string,
  ): TMTransition | null {
    const symbolTransitions = config.transitions[currentSymbol];
    if (!symbolTransitions) {
      return this.haltWithError(
        `No transition defined for symbol '${currentSymbol}'.`,
      );
    }

    const transition = symbolTransitions[currentState];
    if (!transition) {
      return this.haltWithError(
        `No transition defined for state '${currentState}' and symbol '${currentSymbol}'.`,
      );
    }

    return transition;
  }

  private haltWithError(message: string): null {
    if (this.state) {
      this.state.errorMessage = message;
      this.state.isHalted = true;
    }

    return null;
  }

  private applyTransition(state: TMState, transition: TMTransition): void {
    state.tape[state.headPosition] = transition.writeSymbol;
    state.currentState = transition.nextState;
    state.headPosition = this.getNextHeadPosition(
      state.headPosition,
      transition.movement,
    );
    state.stepCount += 1;
  }

  private getNextHeadPosition(
    headPosition: number,
    movement: HeadMovement,
  ): number {
    if (movement === "R") {
      return headPosition + 1;
    }

    if (movement === "L") {
      return headPosition - 1;
    }

    return headPosition;
  }

  private updateHaltingStatus(config: TMConfig, state: TMState): void {
    if (config.haltStates.includes(state.currentState)) {
      state.isHalted = true;
    }
  }
}
