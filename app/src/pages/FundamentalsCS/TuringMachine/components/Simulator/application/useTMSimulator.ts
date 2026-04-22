import { useEffect, useMemo } from "react";
import { cloneJson } from "@/lib/utils";
import { useSimulationEngine } from "@/hooks/useSimulationEngine";
import type { ISimulator } from "@/types/simulator";
import { createInitialRuntime, stepRuntime } from "../domain/tmMachine";
import type { TMProgram } from "../domain/tmProgram";
import type { TMRuntime } from "../domain/tmRuntime";
import { validateTMProgram } from "../domain/tmProgramValidation";

export function useTMSimulator(program: TMProgram) {
  const simulator = useMemo(() => new TuringMachineSimulator(), []);
  const engine = useSimulationEngine(simulator, program);
  const reset = engine.reset;

  useEffect(() => {
    reset(program);
  }, [program, reset]);

  return {
    runtime: engine.currentState,
    status: engine.status,
    speed: engine.speed,
    error: engine.error,
    play: engine.play,
    pause: engine.pause,
    step: engine.step,
    stepBack: engine.stepBack,
    reset,
    setSpeed: engine.setSpeed,
  };
}

class TuringMachineSimulator implements ISimulator<TMProgram, TMRuntime> {
  private program: TMProgram | null = null;
  private runtime: TMRuntime | null = null;
  private history: TMRuntime[] = [];

  public initialize(program: TMProgram, runtime?: TMRuntime): void {
    const issues = validateTMProgram(program);

    if (issues.length > 0) {
      throw new Error(
        `Invalid TM program: ${issues.map((issue) => issue.code).join(", ")}`,
      );
    }

    this.program = cloneJson(program);
    this.history = [];
    this.runtime = runtime
      ? normalizeRuntime(this.program, runtime)
      : createInitialRuntime(this.program);
  }

  public step(): void {
    const { program, runtime } = this.getInitializedContext();

    if (runtime.halted) {
      return;
    }

    this.history.push(cloneJson(runtime));
    this.runtime = stepRuntime(program, runtime);
  }

  public stepBack(): void {
    this.getInitializedContext();

    const previousRuntime = this.history.pop();
    if (previousRuntime) {
      this.runtime = previousRuntime;
    }
  }

  public reset(): void {
    if (!this.program) {
      throw new Error("Simulator has no configuration to reset to.");
    }

    this.initialize(this.program);
  }

  public getConfig(): TMProgram {
    const { program } = this.getInitializedContext();
    return cloneJson(program);
  }

  public getCurrentState(): TMRuntime {
    const { runtime } = this.getInitializedContext();
    return cloneJson(runtime);
  }

  public isFinished(): boolean {
    return this.runtime?.halted ?? false;
  }

  private getInitializedContext(): {
    program: TMProgram;
    runtime: TMRuntime;
  } {
    if (!this.program || !this.runtime) {
      throw new Error("Simulator is not initialized.");
    }

    return {
      program: this.program,
      runtime: this.runtime,
    };
  }
}

function normalizeRuntime(program: TMProgram, runtime: TMRuntime): TMRuntime {
  const nextRuntime = cloneJson(runtime);

  if (nextRuntime.stepCount === undefined) {
    nextRuntime.stepCount = 0;
  }

  if (nextRuntime.haltReason === undefined) {
    nextRuntime.haltReason = null;
  }

  if (nextRuntime.halted === undefined) {
    nextRuntime.halted = false;
  }

  if (
    !nextRuntime.haltReason &&
    program.haltStates.includes(nextRuntime.currentState)
  ) {
    nextRuntime.halted = true;
    nextRuntime.haltReason = {
      type: "halt_state",
      state: nextRuntime.currentState,
    };
  }

  return nextRuntime;
}
