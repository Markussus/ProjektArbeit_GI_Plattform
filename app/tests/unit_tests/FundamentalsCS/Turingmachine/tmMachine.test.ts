import { describe, expect, it } from "vitest";

import {
  canStep,
  createInitialRuntime,
  readCurrentSymbol,
  stepRuntime,
} from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmMachine";
import {
  createTestProgram as createProgram,
  createTestRuntime as createRuntime,
} from "./fixtures/defaultTMProgram";

describe("tmMachine", () => {
  describe("createInitialRuntime", () => {
    // Tests that the initial tape array is copied into indexed tape cells and the runtime starts in a running state.
    it("creates a fresh runtime from the program defaults", () => {
      const runtime = createInitialRuntime(createProgram());

      expect(runtime).toEqual({
        currentState: "q0",
        headPosition: 0,
        tape: { 0: "0", 1: "1" },
        stepCount: 0,
        halted: false,
        haltReason: null,
      });
    });

    // Tests the edge case where the initial state is already a halt state, which should stop the machine immediately.
    it("halts immediately when the initial state is a halt state", () => {
      const runtime = createInitialRuntime(
        createProgram({
          initialState: "halt",
        }),
      );

      expect(runtime).toEqual({
        currentState: "halt",
        headPosition: 0,
        tape: { 0: "0", 1: "1" },
        stepCount: 0,
        halted: true,
        haltReason: {
          type: "halt_state",
          state: "halt",
        },
      });
    });
  });

  describe("readCurrentSymbol", () => {
    // Tests the normal read path where the current head cell already contains a symbol.
    it("returns the symbol stored under the current head position", () => {
      expect(
        readCurrentSymbol(
          { blankSymbol: "_" },
          { tape: { 1: "1" }, headPosition: 1 },
        ),
      ).toBe("1");
    });

    // Tests the missing-cell edge case, including a negative index, where the blank symbol should be read instead.
    it("falls back to the blank symbol when the current cell is unset", () => {
      expect(
        readCurrentSymbol(
          { blankSymbol: "_" },
          { tape: { 0: "0" }, headPosition: -1 },
        ),
      ).toBe("_");
    });
  });

  describe("canStep", () => {
    // Tests that a non-halted runtime is allowed to execute another transition.
    it("returns true when the runtime is still running", () => {
      expect(canStep(createProgram(), createRuntime())).toBe(true);
    });

    // Tests that a halted runtime cannot continue stepping regardless of the program.
    it("returns false when the runtime is halted", () => {
      expect(
        canStep(
          createProgram(),
          createRuntime({
            halted: true,
            haltReason: { type: "halt_state", state: "halt" },
          }),
        ),
      ).toBe(false);
    });
  });

  describe("stepRuntime", () => {
    // Tests the already-halted edge case, where the implementation should return the identical runtime object unchanged.
    it("returns the same runtime object when the machine is already halted", () => {
      const runtime = createRuntime({
        halted: true,
        haltReason: { type: "halt_state", state: "halt" },
      });

      expect(stepRuntime(createProgram(), runtime)).toBe(runtime);
    });

    // Tests the missing-transition edge case, which should halt without mutating position, tape, or step count.
    it("halts with a missing-transition reason when no transition matches the current state and symbol", () => {
      const runtime = createRuntime({
        currentState: "q1",
        headPosition: 0,
        tape: { 0: "0" },
        stepCount: 3,
      });

      expect(stepRuntime(createProgram(), runtime)).toEqual({
        ...runtime,
        halted: true,
        haltReason: {
          type: "missing_transition",
          state: "q1",
          symbol: "0",
        },
      });
    });

    // Tests the main transition path, ensuring the machine writes, moves right, changes state, and increments the step counter immutably.
    it("applies a matching transition and returns the updated runtime", () => {
      const runtime = createRuntime();
      const nextRuntime = stepRuntime(createProgram(), runtime);

      expect(nextRuntime).toEqual({
        currentState: "q1",
        headPosition: 1,
        tape: { 0: "1", 1: "1" },
        stepCount: 1,
        halted: false,
        haltReason: null,
      });
      expect(nextRuntime.tape).not.toBe(runtime.tape);
      expect(runtime).toEqual(createRuntime());
    });

    // Tests left movement at the tape boundary, which should allow the head position to become negative.
    it("moves the head left into negative positions when the transition requests it", () => {
      const runtime = createRuntime({
        currentState: "q1",
        headPosition: 0,
        tape: { 0: "1" },
      });

      expect(stepRuntime(createProgram(), runtime)).toEqual({
        currentState: "halt",
        headPosition: -1,
        tape: { 0: "0" },
        stepCount: 1,
        halted: true,
        haltReason: {
          type: "halt_state",
          state: "halt",
        },
      });
    });

    // Tests the blank-read and no-movement edge case, where an unset cell uses the blank transition and stays on the same tape index.
    it("reads the blank symbol from an empty cell and supports no head movement", () => {
      const runtime = createRuntime({
        tape: {},
        headPosition: 5,
      });

      expect(stepRuntime(createProgram(), runtime)).toEqual({
        currentState: "halt",
        headPosition: 5,
        tape: { 5: "_" },
        stepCount: 1,
        halted: true,
        haltReason: {
          type: "halt_state",
          state: "halt",
        },
      });
    });
  });
});
