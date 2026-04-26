import { describe, expect, it } from "vitest";

import {
  deriveInputAlphabet,
  deriveTapeAlphabet,
  withDerivedAlphabets,
  type TMProgram,
  type TransitionTable,
} from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmProgram";

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
    },
    initialTape: ["1", "0"],
    ...overrides,
  };
}

describe("tmProgram", () => {
  describe("deriveInputAlphabet", () => {
    // Tests that duplicate symbols are removed while preserving first-seen order.
    it("collects unique symbols from the initial tape in insertion order", () => {
      expect(
        deriveInputAlphabet({
          initialTape: ["1", "0", "1", "_", "0"],
        }),
      ).toEqual(["1", "0", "_"]);
    });

    // Tests the empty-tape edge case, which should derive an empty input alphabet.
    it("returns an empty alphabet for an empty initial tape", () => {
      expect(deriveInputAlphabet({ initialTape: [] })).toEqual([]);
    });
  });

  describe("deriveTapeAlphabet", () => {
    // Tests that all symbol sources are merged and deduplicated in the order the implementation appends them.
    it("derives symbols from the declared tape alphabet, tape contents, blank symbol, and transitions", () => {
      const program = createProgram({
        tapeAlphabet: ["x", "0", "x"],
        initialTape: ["1", "x", "1"],
        blankSymbol: "_",
        transitions: {
          "0": {
            q0: { nextState: "q1", writeSymbol: "1", movement: "R" },
          },
          _: {
            q1: { nextState: "halt", writeSymbol: "y", movement: "N" },
          },
        },
      });

      expect(deriveTapeAlphabet(program)).toEqual(["x", "0", "1", "_", "y"]);
    });

    // Tests the edge case where a transition bucket exists but its entry is undefined, which should still include the read symbol and ignore the missing transition.
    it("includes read symbols even when a transition entry is undefined", () => {
      const program = createProgram({
        tapeAlphabet: [],
        initialTape: [],
        transitions: {
          z: {
            q0: undefined,
          },
        } as TransitionTable,
      });

      expect(deriveTapeAlphabet(program)).toEqual(["_", "z"]);
    });
  });

  describe("withDerivedAlphabets", () => {
    // Tests that only the input alphabet is recalculated and duplicate tape input symbols are removed.
    it("replaces the input alphabet with the derived initial-tape symbols", () => {
      const program = createProgram({
        inputAlphabet: ["legacy"],
        initialTape: ["1", "1", "0"],
      });

      expect(withDerivedAlphabets(program)).toEqual({
        ...program,
        inputAlphabet: ["1", "0"],
      });
    });

    // Tests the immutability edge case so callers do not receive the original object back.
    it("returns a new program object and leaves unrelated fields unchanged", () => {
      const program = createProgram();
      const derivedProgram = withDerivedAlphabets(program);

      expect(derivedProgram).not.toBe(program);
      expect(derivedProgram.tapeAlphabet).toBe(program.tapeAlphabet);
      expect(derivedProgram.transitions).toBe(program.transitions);
      expect(derivedProgram.inputAlphabet).toEqual(["1", "0"]);
    });
  });
});
