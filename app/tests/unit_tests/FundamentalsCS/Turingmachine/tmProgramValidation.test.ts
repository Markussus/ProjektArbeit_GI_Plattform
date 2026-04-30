import { describe, expect, it } from "vitest";

import type { TMProgram } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmProgram";
import {
  isTMProgramValid,
  validateTMProgram,
} from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmProgramValidation";

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
        q1: { nextState: "halt", writeSymbol: "0", movement: "N" },
      },
    },
    initialTape: ["0", "1"],
    ...overrides,
  };
}

describe("tmProgramValidation", () => {
  describe("validateTMProgram", () => {
    // Tests the happy path where every program invariant is satisfied and no issues should be returned.
    it("returns no issues for a valid program", () => {
      expect(validateTMProgram(createProgram())).toEqual([]);
    });

    // Tests the empty-states edge case, which must report the missing state collection separately from other issues.
    it("reports an empty states list", () => {
      expect(validateTMProgram(createProgram({ states: [] }))).toContainEqual({
        code: "states_empty",
        path: "states",
      });
    });

    // Tests the missing-initial-state edge case when the declared initial state is not part of the state set.
    it("reports an initial state that is not declared", () => {
      expect(
        validateTMProgram(createProgram({ initialState: "missing" })),
      ).toContainEqual({
        code: "initial_state_missing",
        path: "initialState",
        params: { state: "missing" },
      });
    });

    // Tests the no-halt-states edge case, which should be flagged even if other states are valid.
    it("reports when no halt states are declared", () => {
      expect(
        validateTMProgram(createProgram({ haltStates: [] })),
      ).toContainEqual({
        code: "halt_states_empty",
        path: "haltStates",
      });
    });

    // Tests duplicate missing halt states to ensure the validator de-duplicates repeated values before reporting them.
    it("reports each missing halt state only once", () => {
      expect(
        validateTMProgram(
          createProgram({ haltStates: ["missing", "missing"] }),
        ),
      ).toEqual([
        {
          code: "halt_state_missing",
          path: "haltStates",
          params: { state: "missing" },
        },
      ]);
    });

    // Tests an invalid multi-character blank symbol, which should be rejected both as the blank symbol itself and as part of the tape alphabet.
    it("reports an invalid blank symbol", () => {
      expect(
        validateTMProgram(
          createProgram({ blankSymbol: "__", tapeAlphabet: ["0", "1"] }),
        ),
      ).toEqual(
        expect.arrayContaining([
          {
            code: "blank_symbol_invalid",
            path: "blankSymbol",
            params: { symbol: "__" },
          },
          {
            code: "tape_symbol_invalid",
            path: "tapeAlphabet",
            params: { symbol: "__" },
          },
        ]),
      );
    });

    // Tests an invalid declared tape symbol to ensure multi-character alphabet members are rejected.
    it("reports invalid symbols inside the tape alphabet", () => {
      expect(
        validateTMProgram(createProgram({ tapeAlphabet: ["0", "11", "_"] })),
      ).toContainEqual({
        code: "tape_symbol_invalid",
        path: "tapeAlphabet",
        params: { symbol: "11" },
      });
    });

    // Tests the edge case where a single-character tape symbol is on the initial tape but not in the input alphabet.
    it("reports initial tape symbols that are missing from the input alphabet", () => {
      expect(
        validateTMProgram(
          createProgram({
            inputAlphabet: ["0"],
            initialTape: ["0", "1", "1"],
          }),
        ),
      ).toEqual([
        {
          code: "initial_tape_invalid_symbol",
          path: "initialTape",
          params: { symbol: "1" },
        },
      ]);
    });

    // Tests the edge case where an initial tape symbol is declared in the input alphabet but still invalid because it spans multiple code points.
    it("reports invalid multi-character symbols on the initial tape", () => {
      expect(
        validateTMProgram(
          createProgram({
            inputAlphabet: ["ab"],
            initialTape: ["ab"],
            tapeAlphabet: ["ab", "_"],
          }),
        ),
      ).toEqual(
        expect.arrayContaining([
          {
            code: "tape_symbol_invalid",
            path: "tapeAlphabet",
            params: { symbol: "ab" },
          },
          {
            code: "initial_tape_invalid_symbol",
            path: "initialTape",
            params: { symbol: "ab" },
          },
        ]),
      );
    });

    // Tests an invalid transition read symbol so the validator rejects multi-character keys in the transition table.
    it("reports invalid transition read symbols", () => {
      expect(
        validateTMProgram(
          createProgram({
            transitions: {
              ab: {
                q0: { nextState: "q1", writeSymbol: "1", movement: "R" },
              },
            },
          }),
        ),
      ).toEqual(
        expect.arrayContaining([
          {
            code: "tape_symbol_invalid",
            path: "tapeAlphabet",
            params: { symbol: "ab" },
          },
          {
            code: "transition_read_symbol_invalid",
            path: "transitions.ab",
            params: { symbol: "ab" },
          },
        ]),
      );
    });

    // Tests a transition defined under an undeclared source state, which should produce a state-specific transition error.
    it("reports transitions whose source state is not declared", () => {
      expect(
        validateTMProgram(
          createProgram({
            transitions: {
              "0": {
                missing: { nextState: "q1", writeSymbol: "1", movement: "R" },
              },
            },
          }),
        ),
      ).toContainEqual({
        code: "transition_state_missing",
        path: "transitions.0.missing",
        params: { state: "missing", symbol: "0" },
      });
    });

    // Tests a transition whose next state does not exist, which should be reported on the nested nextState field.
    it("reports transitions whose next state is not declared", () => {
      expect(
        validateTMProgram(
          createProgram({
            transitions: {
              "0": {
                q0: {
                  nextState: "missing",
                  writeSymbol: "1",
                  movement: "R",
                },
              },
            },
          }),
        ),
      ).toContainEqual({
        code: "transition_next_state_missing",
        path: "transitions.0.q0.nextState",
        params: { state: "q0", symbol: "0", nextState: "missing" },
      });
    });

    // Tests an invalid transition write symbol, which should be rejected even though it is automatically derived into the tape alphabet.
    it("reports invalid transition write symbols", () => {
      expect(
        validateTMProgram(
          createProgram({
            transitions: {
              "0": {
                q0: { nextState: "q1", writeSymbol: "xy", movement: "R" },
              },
            },
          }),
        ),
      ).toEqual(
        expect.arrayContaining([
          {
            code: "tape_symbol_invalid",
            path: "tapeAlphabet",
            params: { symbol: "xy" },
          },
          {
            code: "transition_write_symbol_invalid",
            path: "transitions.0.q0.writeSymbol",
            params: { state: "q0", symbol: "0", writeSymbol: "xy" },
          },
        ]),
      );
    });

    // Tests the derived-alphabet edge case showing that omitted blank and transition symbols are treated as present by validation.
    it("does not report missing-symbol issues for symbols that are derived from blank and transition usage", () => {
      const issues = validateTMProgram(
        createProgram({
          tapeAlphabet: ["0"],
          transitions: {
            "1": {
              q0: { nextState: "halt", writeSymbol: "x", movement: "N" },
            },
          },
        }),
      );

      expect(issues).not.toContainEqual(
        expect.objectContaining({ code: "blank_symbol_missing" }),
      );
      expect(issues).not.toContainEqual(
        expect.objectContaining({ code: "transition_read_symbol_missing" }),
      );
      expect(issues).not.toContainEqual(
        expect.objectContaining({ code: "transition_write_symbol_missing" }),
      );
    });
  });

  describe("isTMProgramValid", () => {
    // Tests that a valid program is recognized as valid without inspecting issue details.
    it("returns true for a valid program", () => {
      expect(isTMProgramValid(createProgram())).toBe(true);
    });

    // Tests that any validation issue causes the convenience validity check to return false.
    it("returns false for an invalid program", () => {
      expect(isTMProgramValid(createProgram({ initialState: "missing" }))).toBe(
        false,
      );
    });
  });
});
