import { cloneJson } from "@/lib/utils";
import type { ISimulator } from "@/types/simulator";
import { validateMooreProgram } from "./mooreProgram";
import type { MooreProgram, MooreRuntime } from "./mooreTypes";

/**
 * Implements the Moore automaton model: M = (Q, Sigma, Gamma, delta, lambda, q0)
 * Key characteristic: Output function lambda: Q -> Gamma depends on the state
 */
export class MooreMachineSimulator implements ISimulator<
  MooreProgram,
  MooreRuntime
> {
  private program: MooreProgram | null = null;
  private runtime: MooreRuntime | null = null;
  private history: MooreRuntime[] = [];

  /**
   * Validates the transition table, sets the initial state q0 resets the input position to 0, and clears the step history
   */
  initialize(program: MooreProgram, runtime?: MooreRuntime): void {
    const issues = validateMooreProgram(program);
    if (issues.length > 0) {
      throw new Error(`Invalid Moore program: ${issues.join(", ")}`);
    }

    const initialOutputSymbol = program.outputs[program.initialState]?.symbol;
    this.program = cloneJson(program);
    this.runtime = runtime
      ? cloneJson(runtime)
      : {
          currentState: program.initialState,
          inputPosition: 0,
          outputSymbols:
            initialOutputSymbol !== undefined ? [initialOutputSymbol] : [],
          stepCount: 0,
          halted: program.inputWord.length === 0,
          transitionHistory: [],
        };
    this.history = [];
  }

  /**
   * Reads input symbol a from tape at inputPosition
   * Evaluates state transition: nextState = delta(currentState, a)
   * Calculates output: outputSymbol = lambda(nextState)
   * Add snapshot to history stack for step-back
   */
  step(): void {
    const { program, runtime } = this.getContext();
    if (runtime.halted) {
      return;
    }

    const inputSymbol = program.inputWord[runtime.inputPosition];
    const nextState = program.transitions[inputSymbol]?.[runtime.currentState];
    if (!nextState) {
      throw new Error("moore_transition_missing");
    }

    this.history.push(cloneJson(runtime));
    const nextPosition = runtime.inputPosition + 1;
    // Moore: Output depends solely on the state:
    const outputSymbol = program.outputs[nextState].symbol;
    this.runtime = {
      currentState: nextState,
      inputPosition: nextPosition,
      outputSymbols: [...runtime.outputSymbols, outputSymbol],
      stepCount: runtime.stepCount + 1,
      halted: nextPosition >= program.inputWord.length,
      transitionHistory: [
        ...runtime.transitionHistory,
        {
          fromState: runtime.currentState,
          inputSymbol,
          toState: nextState,
          outputSymbol,
        },
      ],
    };
  }

  /**
   * Get the last state snapshot from history stack
   */
  stepBack(): void {
    this.getContext();
    const previousRuntime = this.history.pop();
    if (previousRuntime) {
      this.runtime = previousRuntime;
    }
  }

  reset(): void {
    if (!this.program) {
      throw new Error("moore_simulator_not_initialized");
    }
    this.initialize(this.program);
  }

  getConfig(): MooreProgram {
    return cloneJson(this.getContext().program);
  }

  getCurrentState(): MooreRuntime {
    return cloneJson(this.getContext().runtime);
  }

  isFinished(): boolean {
    return this.runtime?.halted ?? false;
  }

  private getContext(): { program: MooreProgram; runtime: MooreRuntime } {
    if (!this.program || !this.runtime) {
      throw new Error("moore_simulator_not_initialized");
    }
    return { program: this.program, runtime: this.runtime };
  }
}
