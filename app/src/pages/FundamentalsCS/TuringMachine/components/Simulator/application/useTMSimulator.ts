import { useEffect, useMemo } from "react";
import { useSimulationEngine } from "@/hooks/useSimulationEngine";
import { TuringMachineSimulator } from "../TuringMachineSimulator";
import type { TMProgram } from "../domain/tmProgram";

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
