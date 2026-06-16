import { useEffect, useMemo } from "react";
import { useSimulationEngine } from "@/hooks/useSimulationEngine";
import { MooreMachineSimulator } from "../domain/mooreMachine";
import type { MooreProgram } from "../domain/mooreTypes";

export function useMooreSimulator(program: MooreProgram) {
  const simulator = useMemo(() => new MooreMachineSimulator(), []);
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
