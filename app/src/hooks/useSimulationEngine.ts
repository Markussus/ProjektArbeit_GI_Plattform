import { useCallback, useEffect, useRef, useState } from "react";
import type { ISimulator } from "@/types/simulator";

export type SimulationStatus = "IDLE" | "RUNNING" | "PAUSED" | "ERROR";

export function useSimulationEngine<TConfig, TState>(
  simulator: ISimulator<TConfig, TState>,
  initialConfig: TConfig,
) {
  const [status, setStatus] = useState<SimulationStatus>("IDLE");
  const [speed, setSpeed] = useState<number>(1000);
  const [error, setError] = useState<Error | null>(null);
  const [currentState, setCurrentState] = useState<TState>(() => {
    simulator.initialize(initialConfig);
    return simulator.getCurrentState();
  });

  const timerRef = useRef<number | null>(null);

  const handleStep = useCallback(() => {
    if (simulator.isFinished()) {
      setStatus("IDLE");
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    try {
      simulator.step();
      setCurrentState(simulator.getCurrentState());
      setError(null);
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

  const handleStepBack = useCallback(() => {
    try {
      simulator.stepBack();
      setCurrentState(simulator.getCurrentState());
      setStatus("PAUSED");
      setError(null);
    } catch (err) {
      setStatus("ERROR");
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [simulator]);

  const play = useCallback(() => {
    if (status === "RUNNING" || simulator.isFinished()) return;
    setStatus("RUNNING");
    setError(null);
  }, [status, simulator]);

  const pause = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
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
    }
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [status, speed, handleStep]);

  /**
   * Executes an action on the simulator within the engine's lifecycle,
   * safely pausing any running timer, syncing the state, and catching errors.
   */
  const executeAction = useCallback(
    (action: (sim: ISimulator<TConfig, TState>) => void) => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      try {
        action(simulator);
        setCurrentState(simulator.getCurrentState());
        setStatus(simulator.isFinished() ? "IDLE" : "PAUSED");
        setError(null);
      } catch (err) {
        setStatus("ERROR");
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [simulator],
  );

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
    executeAction,
  };
}
