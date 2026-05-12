// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ISimulator } from "@/types/simulator";
import { useTMSimulator } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/application/useTMSimulator";
import type { TMProgram } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmProgram";
import type { TMRuntime } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmRuntime";

const mockState = vi.hoisted(() => {
  return {
    capturedSimulator: null as ISimulator<TMProgram, TMRuntime> | null,
    useSimulationEngineMock: vi.fn(),
  };
});

vi.mock("@/hooks/useSimulationEngine", () => {
  return {
    useSimulationEngine: (
      simulator: ISimulator<TMProgram, TMRuntime>,
      program: TMProgram,
    ) => {
      mockState.capturedSimulator = simulator;
      return mockState.useSimulationEngineMock(simulator, program);
    },
  };
});

function createProgram(overrides: Partial<TMProgram> = {}): TMProgram {
  return {
    states: ["q0", "q1", "halt"],
    inputAlphabet: ["0", "1"],
    tapeAlphabet: ["0", "1", "_"],
    blankSymbol: "_",
    initialState: "q0",
    haltStates: ["halt"],
    transitions: {
      "0": {
        q0: { nextState: "q1", writeSymbol: "1", movement: "R" },
      },
      "1": {
        q1: { nextState: "halt", writeSymbol: "0", movement: "L" },
      },
      _: {
        q0: { nextState: "halt", writeSymbol: "_", movement: "N" },
      },
    },
    initialTape: ["0", "1"],
    ...overrides,
  };
}

function createRuntime(overrides: Partial<TMRuntime> = {}): TMRuntime {
  return {
    currentState: "q0",
    headPosition: 0,
    tape: { 0: "0", 1: "1" },
    stepCount: 0,
    halted: false,
    haltReason: null,
    ...overrides,
  };
}

function setupHook(program: TMProgram = createProgram()) {
  const engine = {
    currentState: createRuntime(),
    status: "IDLE" as const,
    speed: 250,
    error: null,
    play: vi.fn(),
    pause: vi.fn(),
    step: vi.fn(),
    stepBack: vi.fn(),
    reset: vi.fn(),
    setSpeed: vi.fn(),
  };

  mockState.useSimulationEngineMock.mockReturnValue(engine);

  const rendered = renderHook(
    ({ currentProgram }) => useTMSimulator(currentProgram),
    {
      initialProps: { currentProgram: program },
    },
  );

  return {
    ...rendered,
    engine,
    simulator: mockState.capturedSimulator,
  };
}

describe("useTMSimulator", () => {
  beforeEach(() => {
    mockState.capturedSimulator = null;
    mockState.useSimulationEngineMock.mockReset();
  });

  // Tests that the hook passes the simulator through to the shared engine, triggers a reset effect, and exposes the engine API unchanged.
  it("integrates with the shared simulation engine and resets on program changes", () => {
    const program = createProgram();
    const { result, rerender, engine, simulator } = setupHook(program);

    expect(mockState.useSimulationEngineMock).toHaveBeenCalledWith(
      simulator,
      program,
    );
    expect(engine.reset).toHaveBeenCalledWith(program);
    expect(result.current.runtime).toBe(engine.currentState);
    expect(result.current.status).toBe("IDLE");
    expect(result.current.play).toBe(engine.play);
    expect(result.current.pause).toBe(engine.pause);
    expect(result.current.step).toBe(engine.step);
    expect(result.current.stepBack).toBe(engine.stepBack);
    expect(result.current.reset).toBe(engine.reset);
    expect(result.current.setSpeed).toBe(engine.setSpeed);

    const nextProgram = createProgram({ initialTape: ["1"] });
    rerender({ currentProgram: nextProgram });

    expect(mockState.capturedSimulator).toBe(simulator);
    expect(engine.reset).toHaveBeenLastCalledWith(nextProgram);
  });

  // Tests the edge case where simulator methods are used before initialization, which should throw for stateful operations but report not-finished safely.
  it("rejects uninitialized simulator operations", () => {
    const { simulator } = setupHook();

    expect(simulator).not.toBeNull();
    expect(simulator?.isFinished()).toBe(false);
    expect(() => simulator?.step()).toThrow("Simulator is not initialized.");
    expect(() => simulator?.stepBack()).toThrow(
      "Simulator is not initialized.",
    );
    expect(() => simulator?.getConfig()).toThrow(
      "Simulator is not initialized.",
    );
    expect(() => simulator?.getCurrentState()).toThrow(
      "Simulator is not initialized.",
    );
    expect(() => simulator?.reset()).toThrow(
      "Simulator has no configuration to reset to.",
    );
  });

  // Tests invalid program initialization so the simulator surfaces the validation issue codes in its thrown error.
  it("throws when initialized with an invalid program", () => {
    const { simulator } = setupHook();

    expect(() =>
      simulator?.initialize(createProgram({ states: [], initialState: "q0" })),
    ).toThrow("Invalid TM program: states_empty, initial_state_missing");
  });

  // Tests initialization without a supplied runtime, which should build the standard initial runtime from the program.
  it("initializes the simulator from the program when no runtime is supplied", () => {
    const { simulator } = setupHook();

    simulator?.initialize(createProgram());

    expect(simulator?.getCurrentState()).toEqual({
      currentState: "q0",
      headPosition: 0,
      tape: { 0: "0", 1: "1" },
      stepCount: 0,
      halted: false,
      haltReason: null,
    });
  });

  // Tests runtime normalization, including missing metadata fields and the edge case where the supplied state is already a halting state.
  it("normalizes provided runtimes during initialization", () => {
    const { simulator } = setupHook();

    simulator?.initialize(createProgram(), {
      currentState: "halt",
      headPosition: 4,
      tape: { 4: "1" },
    } as TMRuntime);

    expect(simulator?.getCurrentState()).toEqual({
      currentState: "halt",
      headPosition: 4,
      tape: { 4: "1" },
      stepCount: 0,
      halted: true,
      haltReason: {
        type: "halt_state",
        state: "halt",
      },
    });
    expect(simulator?.isFinished()).toBe(true);
  });

  // Tests stepping, history storage, step-back, and the halted-runtime edge case where a later step must do nothing.
  it("steps forward, steps back, and ignores step calls after halting", () => {
    const { simulator } = setupHook();

    simulator?.initialize(createProgram());
    simulator?.step();

    expect(simulator?.getCurrentState()).toEqual({
      currentState: "q1",
      headPosition: 1,
      tape: { 0: "1", 1: "1" },
      stepCount: 1,
      halted: false,
      haltReason: null,
    });

    simulator?.stepBack();

    expect(simulator?.getCurrentState()).toEqual({
      currentState: "q0",
      headPosition: 0,
      tape: { 0: "0", 1: "1" },
      stepCount: 0,
      halted: false,
      haltReason: null,
    });

    simulator?.initialize(
      createProgram(),
      createRuntime({
        currentState: "halt",
        halted: true,
        haltReason: { type: "halt_state", state: "halt" },
      }),
    );

    const haltedState = simulator?.getCurrentState();
    simulator?.step();
    expect(simulator?.getCurrentState()).toEqual(haltedState);
  });

  // Tests reset and defensive cloning so callers cannot mutate the simulator's stored program or runtime snapshots from the outside.
  it("resets to the stored configuration and returns cloned data", () => {
    const { simulator } = setupHook();

    simulator?.initialize(createProgram());
    simulator?.step();

    const config = simulator?.getConfig();
    const state = simulator?.getCurrentState();

    if (config) {
      config.states.push("mutated");
    }
    if (state) {
      state.tape[0] = "x";
    }

    expect(simulator?.getConfig().states).toEqual(["q0", "q1", "halt"]);
    expect(simulator?.getCurrentState().tape).toEqual({ 0: "1", 1: "1" });

    simulator?.reset();

    expect(simulator?.getCurrentState()).toEqual({
      currentState: "q0",
      headPosition: 0,
      tape: { 0: "0", 1: "1" },
      stepCount: 0,
      halted: false,
      haltReason: null,
    });
  });
});
