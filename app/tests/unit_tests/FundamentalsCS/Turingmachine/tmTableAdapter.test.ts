import { describe, expect, it } from "vitest";

import {
  buildTransitionTableHeaders,
  buildTransitionTableRows,
  getActiveTransitionCell,
  getOrderedTapeAlphabet,
} from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/adapters/tmTableAdapter";
import type { TMProgram } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmProgram";
import type { TMRuntime } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmRuntime";

function createProgram(overrides: Partial<TMProgram> = {}): TMProgram {
  return {
    states: ["q0", "q1", "q10", "halt"],
    inputAlphabet: ["0", "1"],
    tapeAlphabet: ["0", "1", "_"],
    blankSymbol: "_",
    initialState: "q0",
    haltStates: ["halt"],
    transitions: {
      _: {
        q0: { nextState: "halt", writeSymbol: "_", movement: "N" },
      },
      "0": {
        q0: { nextState: "q1", writeSymbol: "1", movement: "R" },
      },
      "1": {
        q1: { nextState: "q10", writeSymbol: "0", movement: "L" },
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

describe("tmTableAdapter", () => {
  describe("getOrderedTapeAlphabet", () => {
    // Tests that the blank symbol is always moved to the front while the remaining symbols keep their relative order.
    it("returns the blank symbol first and removes the duplicate from the remainder", () => {
      expect(
        getOrderedTapeAlphabet({
          blankSymbol: "_",
          tapeAlphabet: ["0", "_", "1", "0"],
        }),
      ).toEqual(["_", "0", "1", "0"]);
    });
  });

  describe("buildTransitionTableHeaders", () => {
    // Tests that the header starts with delta and formats digits in state names as Unicode subscripts.
    it("builds headers with formatted state labels", () => {
      expect(buildTransitionTableHeaders(["q0", "q10", "halt"])).toEqual([
        "δ",
        "q₀",
        "q₁₀",
        "halt",
      ]);
    });
  });

  describe("buildTransitionTableRows", () => {
    // Tests the default row-building path, including blank-first ordering and empty strings for missing transitions.
    it("builds transition rows for the program states in ordered tape-symbol order", () => {
      expect(buildTransitionTableRows(createProgram())).toEqual([
        ["_", "(halt, _, N)", "", "", ""],
        ["0", "(q₁, 1, R)", "", "", ""],
        ["1", "", "(q₁₀, 0, L)", "", ""],
      ]);
    });

    // Tests the edge case where a custom state subset is supplied instead of the full program state list.
    it("builds rows for an explicitly provided state list", () => {
      expect(buildTransitionTableRows(createProgram(), ["q1"])).toEqual([
        ["_", ""],
        ["0", ""],
        ["1", "(q₁₀, 0, L)"],
      ]);
    });
  });

  describe("getActiveTransitionCell", () => {
    // Tests the null-runtime edge case, which should produce no active cell.
    it("returns null when no runtime is provided", () => {
      expect(getActiveTransitionCell(createProgram(), null)).toBeNull();
      expect(getActiveTransitionCell(createProgram(), undefined)).toBeNull();
    });

    // Tests that an existing state and current tape symbol map to the expected table row and state column.
    it("returns the active table cell for the current state and read symbol", () => {
      expect(getActiveTransitionCell(createProgram(), createRuntime())).toEqual(
        {
          row: 1,
          col: 1,
        },
      );
    });

    // Tests the blank-read edge case where the current tape cell is unset and the blank row should be selected.
    it("uses the blank-symbol row when the current cell is empty", () => {
      expect(
        getActiveTransitionCell(
          createProgram(),
          createRuntime({ headPosition: 3, tape: {} }),
        ),
      ).toEqual({
        row: 0,
        col: 1,
      });
    });

    // Tests that unknown symbols and unknown states are rejected instead of producing an invalid table position.
    it("returns null when the runtime state or symbol is not represented in the table", () => {
      expect(
        getActiveTransitionCell(
          createProgram(),
          createRuntime({ tape: { 0: "x" }, headPosition: 0 }),
        ),
      ).toBeNull();
      expect(
        getActiveTransitionCell(
          createProgram(),
          createRuntime({ currentState: "missing" }),
        ),
      ).toBeNull();
    });
  });
});
