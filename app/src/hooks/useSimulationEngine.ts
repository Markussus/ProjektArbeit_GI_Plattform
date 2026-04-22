import { useState, useEffect, useRef, useCallback } from "react";
import type { ISimulator } from "../types/simulator";

export type SimulationStatus = "IDLE" | "RUNNING" | "PAUSED" | "ERROR";

export function useSimulationEngine<TConfig, TState>(
  simulator: ISimulator<TConfig, TState>,
  initialConfig: TConfig,
) {
  const [status, setStatus] = useState<SimulationStatus>("IDLE");
  const [speed, setSpeed] = useState<number>(1000); // ms per step
  const [error, setError] = useState<Error | null>(null);

  // Initialize the simulator with the configuration and get the first state
  const [currentState, setCurrentState] = useState<TState>(() => {
    simulator.initialize(initialConfig);
    return simulator.getCurrentState();
  });

  const timerRef = useRef<number | null>(null);

  // Wrapper for a single simulation step definition
  const handleStep = useCallback(() => {
    try {
      if (simulator.isFinished()) {
        setStatus("IDLE");
        return;
      }

      simulator.step();
      setCurrentState(simulator.getCurrentState());

      if (simulator.isFinished()) {
        setStatus("IDLE");
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    } catch (err) {
      setStatus("ERROR");
      setError(err instanceof Error ? err : new Error(String(err)));
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [simulator]);

  // Wrapper for stepping back (if implemented by the simulator instance)
  const handleStepBack = useCallback(() => {
    try {
      simulator.stepBack();
      setCurrentState(simulator.getCurrentState());
      if (status === "ERROR") {
        setStatus("PAUSED");
        setError(null);
      }
    } catch (err) {
      setStatus("ERROR");
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [simulator, status]);

  const play = useCallback(() => {
    if (status === "RUNNING" || status === "ERROR" || simulator.isFinished())
      return;
    setStatus("RUNNING");
  }, [status, simulator]);

  const pause = useCallback(() => {
    if (status === "RUNNING") {
      setStatus("PAUSED");
    }
  }, [status]);

  const reset = useCallback(
    (newConfig?: TConfig) => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }

      try {
        if (newConfig) {
          simulator.initialize(newConfig);
        } else {
          simulator.reset();
        }
        setCurrentState(simulator.getCurrentState());
        setStatus("IDLE");
        setError(null);
      } catch (err) {
        setStatus("ERROR");
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [simulator],
  );

  useEffect(() => {
    if (status === "RUNNING") {
      timerRef.current = window.setInterval(handleStep, speed);
    } else if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [status, speed, handleStep]);

  return {
    status,
    speed,
    error,
    currentState,
    play,
    pause,
    step: handleStep,
    stepBack: handleStepBack,
    reset,
    setSpeed,
  };
}
