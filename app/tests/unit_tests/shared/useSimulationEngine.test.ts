/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSimulationEngine } from "@/hooks/useSimulationEngine";
import type { ISimulator } from "@/types/simulator";

interface TestConfig {
  maxSteps: number;
}

interface TestState {
  step: number;
  done: boolean;
}

class TestSimulator implements ISimulator<TestConfig, TestState> {
  public config: TestConfig = { maxSteps: 3 };
  public state: TestState = { step: 0, done: false };
  public history: TestState[] = [];

  public initError: Error | string | null = null;
  public stepError: Error | string | null = null;
  public stepBackError: Error | string | null = null;
  public resetError: Error | string | null = null;
  public getStateError: Error | string | null = null;

  initialize(config: TestConfig): void {
    if (this.initError) {
      throw this.initError;
    }
    this.config = { ...config };
    this.state = { step: 0, done: false };
    this.history = [];
  }

  step(): void {
    if (this.stepError) {
      throw this.stepError;
    }
    if (this.state.done) return;
    this.history.push({ ...this.state });
    const nextStep = this.state.step + 1;
    this.state = {
      step: nextStep,
      done: nextStep >= this.config.maxSteps,
    };
  }

  stepBack(): void {
    if (this.stepBackError) {
      throw this.stepBackError;
    }
    const prev = this.history.pop();
    if (prev) {
      this.state = { ...prev };
    }
  }

  reset(): void {
    if (this.resetError) {
      throw this.resetError;
    }
    this.initialize(this.config);
  }

  getConfig(): TestConfig {
    return { ...this.config };
  }

  getCurrentState(): TestState {
    if (this.getStateError) {
      throw this.getStateError;
    }
    return { ...this.state };
  }

  isFinished(): boolean {
    return this.state.done;
  }
}

describe("useSimulationEngine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("initializes with initial config and IDLE status", () => {
    const simulator = new TestSimulator();
    const { result } = renderHook(() =>
      useSimulationEngine(simulator, { maxSteps: 3 }),
    );

    expect(result.current.status).toBe("IDLE");
    expect(result.current.speed).toBe(1000);
    expect(result.current.error).toBeNull();
    expect(result.current.currentState).toEqual({ step: 0, done: false });
  });

  it("executes single step correctly", () => {
    const simulator = new TestSimulator();
    const { result } = renderHook(() =>
      useSimulationEngine(simulator, { maxSteps: 3 }),
    );

    act(() => {
      result.current.step();
    });

    expect(result.current.currentState.step).toBe(1);
    expect(result.current.currentState.done).toBe(false);
    expect(result.current.status).toBe("IDLE");
  });

  it("steps until finished and automatically sets status to IDLE", () => {
    const simulator = new TestSimulator();
    const { result } = renderHook(() =>
      useSimulationEngine(simulator, { maxSteps: 1 }),
    );

    act(() => {
      result.current.step();
    });

    expect(result.current.currentState.step).toBe(1);
    expect(result.current.currentState.done).toBe(true);
    expect(result.current.status).toBe("IDLE");

    // Calling step when finished does not advance
    act(() => {
      result.current.step();
    });
    expect(result.current.currentState.step).toBe(1);
  });

  it("clears active timer if handleStep is called when simulator is already finished", () => {
    const simulator = new TestSimulator();
    const { result } = renderHook(() =>
      useSimulationEngine(simulator, { maxSteps: 3 }),
    );

    act(() => {
      result.current.play();
    });
    expect(result.current.status).toBe("RUNNING");

    // Finished externally while timer is running
    simulator.state.done = true;

    act(() => {
      result.current.step();
    });
    expect(result.current.status).toBe("IDLE");

    // Timers should not tick further
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.currentState.step).toBe(0);
  });

  it("steps back to previous state and changes status to PAUSED", () => {
    const simulator = new TestSimulator();
    const { result } = renderHook(() =>
      useSimulationEngine(simulator, { maxSteps: 3 }),
    );

    act(() => {
      result.current.step();
      result.current.step();
    });
    expect(result.current.currentState.step).toBe(2);

    act(() => {
      result.current.stepBack();
    });
    expect(result.current.currentState.step).toBe(1);
    expect(result.current.status).toBe("PAUSED");
  });

  it("sets ERROR status if step() throws", () => {
    const simulator = new TestSimulator();
    simulator.stepError = new Error("step_crash");
    const { result } = renderHook(() =>
      useSimulationEngine(simulator, { maxSteps: 3 }),
    );

    act(() => {
      result.current.step();
    });

    expect(result.current.status).toBe("ERROR");
    expect(result.current.error?.message).toBe("step_crash");

    // Non-Error exception
    simulator.stepError = "string_crash";
    act(() => {
      result.current.step();
    });
    expect(result.current.status).toBe("ERROR");
    expect(result.current.error?.message).toBe("string_crash");
  });

  it("recovers from ERROR status on subsequent successful step or stepBack", () => {
    const simulator = new TestSimulator();
    const { result } = renderHook(() =>
      useSimulationEngine(simulator, { maxSteps: 3 }),
    );

    simulator.stepError = new Error("step_crash");
    act(() => {
      result.current.step();
    });
    expect(result.current.status).toBe("ERROR");

    // Recover via stepBack
    simulator.stepError = null;
    act(() => {
      result.current.stepBack();
    });
    expect(result.current.status).toBe("PAUSED");
    expect(result.current.error).toBeNull();
    expect(result.current.currentState.step).toBe(0);
  });

  it("sets ERROR status if stepBack() throws", () => {
    const simulator = new TestSimulator();
    simulator.stepBackError = new Error("step_back_crash");
    const { result } = renderHook(() =>
      useSimulationEngine(simulator, { maxSteps: 3 }),
    );

    act(() => {
      result.current.stepBack();
    });
    expect(result.current.status).toBe("ERROR");
    expect(result.current.error?.message).toBe("step_back_crash");

    simulator.stepBackError = "string_step_back_crash";
    act(() => {
      result.current.stepBack();
    });
    expect(result.current.status).toBe("ERROR");
    expect(result.current.error?.message).toBe("string_step_back_crash");
  });

  it("starts and runs timer on play() and pauses on pause()", () => {
    const simulator = new TestSimulator();
    const { result } = renderHook(() =>
      useSimulationEngine(simulator, { maxSteps: 3 }),
    );

    act(() => {
      result.current.play();
    });
    expect(result.current.status).toBe("RUNNING");

    // Calling play again while running is a no-op
    act(() => {
      result.current.play();
    });
    expect(result.current.status).toBe("RUNNING");

    // Advance 1 tick
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.currentState.step).toBe(1);

    // Pause simulation
    act(() => {
      result.current.pause();
    });
    expect(result.current.status).toBe("PAUSED");

    // Advance time after pause, state shouldn't advance
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.currentState.step).toBe(1);
  });

  it("stops running automatically when simulation reaches finished state", () => {
    const simulator = new TestSimulator();
    const { result } = renderHook(() =>
      useSimulationEngine(simulator, { maxSteps: 2 }),
    );

    act(() => {
      result.current.play();
    });

    act(() => {
      vi.advanceTimersByTime(1000); // step 1
    });
    expect(result.current.currentState.step).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000); // step 2 -> finished
    });
    expect(result.current.currentState.step).toBe(2);
    expect(result.current.currentState.done).toBe(true);
    expect(result.current.status).toBe("IDLE");

    // Playing when finished is a no-op
    act(() => {
      result.current.play();
    });
    expect(result.current.status).toBe("IDLE");
  });

  it("pausing when not running is a no-op", () => {
    const simulator = new TestSimulator();
    const { result } = renderHook(() =>
      useSimulationEngine(simulator, { maxSteps: 3 }),
    );

    act(() => {
      result.current.pause();
    });
    expect(result.current.status).toBe("IDLE");
  });

  it("handles step error thrown during timer execution", () => {
    const simulator = new TestSimulator();
    const { result } = renderHook(() =>
      useSimulationEngine(simulator, { maxSteps: 3 }),
    );

    act(() => {
      result.current.play();
    });
    expect(result.current.status).toBe("RUNNING");

    simulator.stepError = new Error("timer_step_crash");
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.status).toBe("ERROR");
    expect(result.current.error?.message).toBe("timer_step_crash");
  });

  it("respects speed configuration updates", () => {
    const simulator = new TestSimulator();
    const { result } = renderHook(() =>
      useSimulationEngine(simulator, { maxSteps: 5 }),
    );

    act(() => {
      result.current.setSpeed(250);
      result.current.play();
    });
    expect(result.current.speed).toBe(250);

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current.currentState.step).toBe(1);

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current.currentState.step).toBe(2);
  });

  it("resets simulator state and status to IDLE", () => {
    const simulator = new TestSimulator();
    const { result } = renderHook(() =>
      useSimulationEngine(simulator, { maxSteps: 3 }),
    );

    act(() => {
      result.current.step();
    });
    expect(result.current.currentState.step).toBe(1);

    act(() => {
      result.current.reset();
    });
    expect(result.current.currentState.step).toBe(0);
    expect(result.current.status).toBe("IDLE");
    expect(result.current.error).toBeNull();
  });

  it("resets while running and clears active timer", () => {
    const simulator = new TestSimulator();
    const { result } = renderHook(() =>
      useSimulationEngine(simulator, { maxSteps: 3 }),
    );

    act(() => {
      result.current.play();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.currentState.step).toBe(1);

    act(() => {
      result.current.reset();
    });
    expect(result.current.status).toBe("IDLE");
    expect(result.current.currentState.step).toBe(0);

    // Timers should not tick further
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.currentState.step).toBe(0);
  });

  it("resets with newConfig if provided", () => {
    const simulator = new TestSimulator();
    const { result } = renderHook(() =>
      useSimulationEngine(simulator, { maxSteps: 3 }),
    );

    act(() => {
      result.current.reset({ maxSteps: 10 });
    });
    expect(simulator.getConfig().maxSteps).toBe(10);
    expect(result.current.currentState.step).toBe(0);
  });

  it("handles errors during reset()", () => {
    const simulator = new TestSimulator();
    simulator.resetError = new Error("reset_crash");
    const { result } = renderHook(() =>
      useSimulationEngine(simulator, { maxSteps: 3 }),
    );

    act(() => {
      result.current.reset();
    });
    expect(result.current.status).toBe("ERROR");
    expect(result.current.error?.message).toBe("reset_crash");

    simulator.resetError = "string_reset_crash";
    act(() => {
      result.current.reset();
    });
    expect(result.current.status).toBe("ERROR");
    expect(result.current.error?.message).toBe("string_reset_crash");
  });

  it("executeAction executes an action within engine lifecycle and syncs state", () => {
    const simulator = new TestSimulator();
    const { result } = renderHook(() =>
      useSimulationEngine(simulator, { maxSteps: 3 }),
    );

    // Run action that mutates simulator state
    act(() => {
      result.current.executeAction((sim) => {
        (sim as TestSimulator).state = { step: 2, done: false };
      });
    });
    expect(result.current.currentState.step).toBe(2);
    expect(result.current.status).toBe("PAUSED");

    // When action finishes simulation, status becomes IDLE
    act(() => {
      result.current.executeAction((sim) => {
        (sim as TestSimulator).state = { step: 3, done: true };
      });
    });
    expect(result.current.currentState.step).toBe(3);
    expect(result.current.status).toBe("IDLE");

    // When action throws an Error
    act(() => {
      result.current.executeAction(() => {
        throw new Error("action_crash");
      });
    });
    expect(result.current.status).toBe("ERROR");
    expect(result.current.error?.message).toBe("action_crash");

    // When action throws a non-Error
    act(() => {
      result.current.executeAction(() => {
        throw "string_action_crash";
      });
    });
    expect(result.current.status).toBe("ERROR");
    expect(result.current.error?.message).toBe("string_action_crash");
  });

  it("executeAction clears running timer when invoked during RUNNING status", () => {
    const simulator = new TestSimulator();
    const { result } = renderHook(() =>
      useSimulationEngine(simulator, { maxSteps: 5 }),
    );

    act(() => {
      result.current.play();
    });
    expect(result.current.status).toBe("RUNNING");

    act(() => {
      result.current.executeAction((sim) => {
        (sim as TestSimulator).state = { step: 2, done: false };
      });
    });
    expect(result.current.status).toBe("PAUSED");
    expect(result.current.currentState.step).toBe(2);

    // Advance time, verify timer was cleared and does not tick further
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.currentState.step).toBe(2);
  });

  it("cleans up active timer on unmount", () => {
    const simulator = new TestSimulator();
    const { result, unmount } = renderHook(() =>
      useSimulationEngine(simulator, { maxSteps: 5 }),
    );

    act(() => {
      result.current.play();
    });
    expect(result.current.status).toBe("RUNNING");

    unmount();
    // Advancing timers should not cause errors or state updates
    act(() => {
      vi.advanceTimersByTime(2000);
    });
  });
});
