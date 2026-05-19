import { useEffect, useMemo, useCallback } from "react";
import { cloneJson } from "@/lib/utils";
import { useSimulationEngine } from "@/hooks/useSimulationEngine";
import type { ISimulator } from "@/types/simulator";
import { createInitialRuntime, stepRuntime } from "../domain/faMachine";
import type { FAProgram } from "../domain/faTypes";
import type { FARuntime } from "../domain/faRuntime";
import { validateFAProgram } from "../domain/faProgramValidation";

export interface FASimulatorConfig {
  program: FAProgram;
  inputWord: string[];
}

export function useFASimulator(program: FAProgram, inputWord: string) {
  const simulator = useMemo(() => new FiniteAutomatonSimulator(), []);
  const config: FASimulatorConfig = useMemo(
    () => ({ program, inputWord: inputWord.split("") }),
    [program, inputWord],
  );
  const engine = useSimulationEngine(simulator, config);
  const reset = engine.reset;

  useEffect(() => {
    reset(config);
  }, [config, reset]);

  const jumpToStep = useCallback(
    (stepIndex: number) => {
      simulator.jumpToStep(stepIndex);
      engine.forceStateRefresh();
    },
    [simulator, engine],
  );

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
    jumpToStep,
    totalSteps: engine.currentState.stepCount,
  };
}

class FiniteAutomatonSimulator implements ISimulator<
  FASimulatorConfig,
  FARuntime
> {
  private config: FASimulatorConfig | null = null;
  private runtime: FARuntime | null = null;
  private history: FARuntime[] = [];

  public initialize(config: FASimulatorConfig, runtime?: FARuntime): void {
    const issues = validateFAProgram(config.program);
    if (issues.length > 0) {
      throw new Error(
        `Invalid FA program: ${issues.map((i) => i.code).join(", ")}`,
      );
    }

    this.config = cloneJson(config);
    this.history = [];
    this.runtime = runtime
      ? cloneJson(runtime)
      : createInitialRuntime(this.config.program, this.config.inputWord);
  }

  public step(): void {
    const { config, runtime } = this.getContext();
    if (runtime.halted) return;

    this.history.push(cloneJson(runtime));
    this.runtime = stepRuntime(config.program, runtime);
  }

  public stepBack(): void {
    this.getContext();
    const prev = this.history.pop();
    if (prev) {
      this.runtime = prev;
    }
  }

  public reset(): void {
    if (!this.config) {
      throw new Error("Simulator has no configuration to reset to.");
    }
    this.initialize(this.config);
  }

  public getConfig(): FASimulatorConfig {
    return cloneJson(this.getContext().config);
  }

  public getCurrentState(): FARuntime {
    return cloneJson(this.getContext().runtime);
  }

  public isFinished(): boolean {
    return this.runtime?.halted ?? false;
  }

  public jumpToStep(targetStep: number): void {
    const { config } = this.getContext();
    const initial = createInitialRuntime(config.program, config.inputWord);
    this.history = [];
    this.runtime = initial;

    for (let i = 0; i < targetStep; i++) {
      if (this.runtime.halted) break;
      this.history.push(cloneJson(this.runtime));
      this.runtime = stepRuntime(config.program, this.runtime);
    }
  }

  private getContext(): { config: FASimulatorConfig; runtime: FARuntime } {
    if (!this.config || !this.runtime) {
      throw new Error("Simulator is not initialized.");
    }
    return { config: this.config, runtime: this.runtime };
  }
}
