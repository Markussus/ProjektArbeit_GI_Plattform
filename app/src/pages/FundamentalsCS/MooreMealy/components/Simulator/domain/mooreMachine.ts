import { cloneJson } from "@/lib/utils";
import type { ISimulator } from "@/types/simulator";
import { validateMooreProgram } from "./mooreProgram";
import type { MooreProgram, MooreRuntime } from "./mooreTypes";

export class MooreMachineSimulator implements ISimulator<
  MooreProgram,
  MooreRuntime
> {
  private program: MooreProgram | null = null;
  private runtime: MooreRuntime | null = null;
  private history: MooreRuntime[] = [];

  initialize(program: MooreProgram, runtime?: MooreRuntime): void {
    const issues = validateMooreProgram(program);
    if (issues.length > 0) {
      throw new Error(`Invalid Moore program: ${issues.join(", ")}`);
    }

    this.program = cloneJson(program);
    this.runtime = runtime
      ? cloneJson(runtime)
      : {
          currentState: program.initialState,
          inputPosition: 0,
          outputSymbols: [],
          stepCount: 0,
          halted: program.inputWord.length === 0,
          transitionHistory: [],
        };
    this.history = [];
  }

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
