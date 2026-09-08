import { cloneJson } from "@/lib/utils";
import type { ISimulator } from "@/types/simulator";
import { validateMealyProgram } from "./mealyProgram";
import type { MealyProgram, MealyRuntime } from "./mealyTypes";

/**
 * Implements the theoretical Mealy automaton model: M = (Q, Sigma, Gamma, delta, lambda, q0)
 * Output function lambda: Q x Sigma -> Gamma depends on the current state and the current input symbol
 */
export class MealyMachineSimulator implements ISimulator<
  MealyProgram,
  MealyRuntime
> {
  private program: MealyProgram | null = null;
  private runtime: MealyRuntime | null = null;
  private history: MealyRuntime[] = [];

  /**
   * Validates state & transition matrices, initializes runtime state at initialState sets position to 0, and clear history
   */
  initialize(program: MealyProgram, runtime?: MealyRuntime): void {
    const issues = validateMealyProgram(program);
    if (issues.length)
      throw new Error(`Invalid Mealy program: ${issues.join(", ")}`);
    this.program = cloneJson(program);
    this.runtime = runtime ?? {
      currentState: program.initialState,
      inputPosition: 0,
      outputSymbols: [],
      stepCount: 0,
      halted: program.inputWord.length === 0,
      transitionHistory: [],
    };
    this.history = [];
  }

  /**
   * Reads input symbol from tape: inputSymbol = inputWord[inputPosition]
   * Evaluates state transition: toState = delta(currentState, inputSymbol)
   * Calculates output: outputSymbol = lambda(currentState, inputSymbol) (Mealy: Output depends on current state and input symbol!)
   * Pushes current state snapshot to history for backward stepping
   */
  step(): void {
    const { program, runtime } = this.context();
    if (runtime.halted) return;
    const inputSymbol = program.inputWord[runtime.inputPosition];
    const toState = program.transitions[inputSymbol]?.[runtime.currentState];
    // Mealy: Output depends on inputSymbol and currentState:
    const outputSymbol =
      program.outputs[inputSymbol]?.[runtime.currentState]?.symbol;
    if (!toState || outputSymbol === undefined)
      throw new Error("mealy_transition_missing");
    this.history.push(cloneJson(runtime));
    const inputPosition = runtime.inputPosition + 1;
    this.runtime = {
      currentState: toState,
      inputPosition,
      outputSymbols: [...runtime.outputSymbols, outputSymbol],
      stepCount: runtime.stepCount + 1,
      halted: inputPosition >= program.inputWord.length,
      transitionHistory: [
        ...runtime.transitionHistory,
        { fromState: runtime.currentState, inputSymbol, toState, outputSymbol },
      ],
    };
  }

  /**
   * Restores prior execution snapshot from history stack
   */
  stepBack(): void {
    this.context();
    this.runtime = this.history.pop() ?? this.runtime;
  }
  reset(): void {
    if (!this.program) throw new Error("mealy_simulator_not_initialized");
    this.initialize(this.program);
  }
  getConfig(): MealyProgram {
    return cloneJson(this.context().program);
  }
  getCurrentState(): MealyRuntime {
    return cloneJson(this.context().runtime);
  }
  isFinished(): boolean {
    return this.runtime?.halted ?? false;
  }
  private context() {
    if (!this.program || !this.runtime)
      throw new Error("mealy_simulator_not_initialized");
    return { program: this.program, runtime: this.runtime };
  }
}
