import { useEffect, useMemo } from "react";
import { useSimulationEngine } from "@/hooks/useSimulationEngine";
import type { TMProgram } from "../domain/tmProgram";
import { TuringMachineSimulator } from "./tmSimulator.ts";

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
