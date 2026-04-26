import { describe, expect, it } from "vitest";

import {
  createProgramDraft,
  tmEditorReducer,
} from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/application/tmEditorReducer";
import type { TMProgram } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmProgram";

function createProgram(overrides: Partial<TMProgram> = {}): TMProgram {
  return {
    states: ["q0", "q1", "q2", "halt"],
    inputAlphabet: ["legacy"],
    tapeAlphabet: ["0", "1", "_"],
    blankSymbol: "_",
    initialState: "q0",
    haltStates: ["halt"],
    transitions: {
      _: {
        q1: { nextState: "q0", writeSymbol: "_", movement: "N" },
      },
      "0": {
        q0: { nextState: "q1", writeSymbol: "1", movement: "R" },
        q1: { nextState: "q2", writeSymbol: "0", movement: "R" },
      },
      "1": {
        q1: { nextState: "halt", writeSymbol: "0", movement: "L" },
      },
    },
    initialTape: ["1", "0", "_"],
    ...overrides,
  };
}

describe("tmEditorReducer", () => {
  describe("createProgramDraft", () => {
    // Tests that the draft is deep-cloned and the input alphabet is re-derived from the initial tape.
    it("clones the program and derives the input alphabet from the tape", () => {
      const program = createProgram();
      const draft = createProgramDraft(program);

      expect(draft).toEqual({
        ...program,
        inputAlphabet: ["1", "0", "_"],
      });
      expect(draft).not.toBe(program);
      draft.states.push("extra");
      expect(program.states).toEqual(["q0", "q1", "q2", "halt"]);
    });
  });

  describe("tmEditorReducer", () => {
    // Tests that replacing the program delegates to draft creation so the inserted program is cloned and normalized.
    it("replaces the program with a normalized draft", () => {
      const replacement = createProgram({
        inputAlphabet: [],
        initialTape: ["0", "0", "1"],
      });

      const result = tmEditorReducer(createProgram(), {
        type: "replace_program",
        program: replacement,
      });

      expect(result).toEqual({
        ...replacement,
        inputAlphabet: ["0", "1"],
      });
      expect(result).not.toBe(replacement);
    });

    // Tests the edge case where the initial tape is replaced with an empty string, which should derive an empty input alphabet.
    it("sets the initial tape from a string value", () => {
      expect(
        tmEditorReducer(createProgram(), {
          type: "set_initial_tape",
          value: "",
        }),
      ).toEqual({
        ...createProgram(),
        initialTape: [],
        inputAlphabet: [],
      });
    });

    // Tests that setting the initial state only succeeds for declared states and leaves invalid requests untouched.
    it("updates the initial state only when the state exists", () => {
      const program = createProgram();

      expect(
        tmEditorReducer(program, {
          type: "set_initial_state",
          state: "q1",
        }).initialState,
      ).toBe("q1");
      expect(
        tmEditorReducer(program, {
          type: "set_initial_state",
          state: "missing",
        }),
      ).toBe(program);
    });

    // Tests that halting states can be added idempotently and removed cleanly.
    it("toggles halt states on and off", () => {
      const program = createProgram({ haltStates: ["halt"] });

      expect(
        tmEditorReducer(program, {
          type: "toggle_halt_state",
          state: "q1",
          isHalting: true,
        }).haltStates,
      ).toEqual(["halt", "q1"]);
      expect(
        tmEditorReducer(program, {
          type: "toggle_halt_state",
          state: "halt",
          isHalting: false,
        }).haltStates,
      ).toEqual([]);
    });

    // Tests the edge cases for adding a halt state: blank names, the current initial state, and already-declared states must be rejected.
    it("adds a trimmed halt state and rejects invalid additions", () => {
      const program = createProgram();

      expect(
        tmEditorReducer(program, {
          type: "add_halt_state",
          state: "  qNew  ",
        }),
      ).toEqual({
        ...program,
        states: ["q0", "q1", "q2", "halt", "qNew"],
        haltStates: ["halt", "qNew"],
        inputAlphabet: ["1", "0", "_"],
      });
      expect(
        tmEditorReducer(program, {
          type: "add_halt_state",
          state: "   ",
        }),
      ).toBe(program);
      expect(
        tmEditorReducer(program, {
          type: "add_halt_state",
          state: "q0",
        }),
      ).toBe(program);
      expect(
        tmEditorReducer(program, {
          type: "add_halt_state",
          state: "q1",
        }),
      ).toBe(program);
    });

    // Tests that adding a tape symbol picks the next available symbol from the search order and falls back past Z when all built-ins are exhausted.
    it("adds the next available tape symbol", () => {
      expect(
        tmEditorReducer(createProgram(), {
          type: "add_tape_symbol",
        }).tapeAlphabet,
      ).toEqual(["0", "1", "_", "2"]);

      const allSearchSymbols = [
        ...Array.from({ length: 10 }, (_, index) => String(index)),
        ...Array.from({ length: 26 }, (_, index) =>
          String.fromCharCode("a".charCodeAt(0) + index),
        ),
        ...Array.from({ length: 26 }, (_, index) =>
          String.fromCharCode("A".charCodeAt(0) + index),
        ),
      ];

      expect(
        tmEditorReducer(
          createProgram({
            tapeAlphabet: [...allSearchSymbols, "_"],
            initialTape: [],
            transitions: {},
          }),
          { type: "add_tape_symbol" },
        ).tapeAlphabet.at(-1),
      ).toBe("[");
    });

    // Tests that removing a tape symbol also removes its transition bucket, while blank or missing symbols are ignored.
    it("removes removable tape symbols and their transitions", () => {
      const program = createProgram();

      expect(
        tmEditorReducer(program, {
          type: "remove_tape_symbol",
          symbol: "1",
        }),
      ).toEqual({
        ...program,
        tapeAlphabet: ["0", "_"],
        transitions: {
          _: {
            q1: { nextState: "q0", writeSymbol: "_", movement: "N" },
          },
          "0": {
            q0: { nextState: "q1", writeSymbol: "1", movement: "R" },
            q1: { nextState: "q2", writeSymbol: "0", movement: "R" },
          },
        },
        inputAlphabet: ["1", "0", "_"],
      });
      expect(
        tmEditorReducer(program, {
          type: "remove_tape_symbol",
          symbol: "_",
        }),
      ).toBe(program);
      expect(
        tmEditorReducer(program, {
          type: "remove_tape_symbol",
          symbol: "missing",
        }),
      ).toBe(program);
    });

    // Tests that renaming a tape symbol updates all symbol references and rejects empty, duplicate, or unchanged values.
    it("renames a tape symbol across tape data, blank symbol, and transitions", () => {
      const program = createProgram();

      expect(
        tmEditorReducer(program, {
          type: "rename_tape_symbol",
          currentSymbol: "_",
          nextSymbol: " x ",
        }),
      ).toEqual({
        ...program,
        tapeAlphabet: ["0", "1", "x"],
        blankSymbol: "x",
        initialTape: ["1", "0", "x"],
        transitions: {
          "0": {
            q0: { nextState: "q1", writeSymbol: "1", movement: "R" },
            q1: { nextState: "q2", writeSymbol: "0", movement: "R" },
          },
          "1": {
            q1: { nextState: "halt", writeSymbol: "0", movement: "L" },
          },
          x: {
            q1: { nextState: "q0", writeSymbol: "x", movement: "N" },
          },
        },
        inputAlphabet: ["1", "0", "x"],
      });
      expect(
        tmEditorReducer(program, {
          type: "rename_tape_symbol",
          currentSymbol: "0",
          nextSymbol: "0",
        }),
      ).toBe(program);
      expect(
        tmEditorReducer(program, {
          type: "rename_tape_symbol",
          currentSymbol: "0",
          nextSymbol: " ",
        }),
      ).toBe(program);
      expect(
        tmEditorReducer(program, {
          type: "rename_tape_symbol",
          currentSymbol: "0",
          nextSymbol: "1",
        }),
      ).toBe(program);
    });

    // Tests that adding a state chooses the first missing q-index instead of always appending numerically.
    it("adds the next available state name", () => {
      expect(
        tmEditorReducer(
          createProgram({
            states: ["q0", "q2", "halt"],
          }),
          { type: "add_state" },
        ).states,
      ).toEqual(["q0", "q2", "halt", "q1"]);
    });

    // Tests state removal, including the edge case where the removed state is the initial state and transition targets must be rewired to a fallback state.
    it("removes a state and rewrites initial and transition references when needed", () => {
      const program = createProgram();
      const result = tmEditorReducer(createProgram(), {
        type: "remove_state",
        state: "q0",
      });

      expect(result).toEqual({
        ...createProgram(),
        states: ["q1", "q2", "halt"],
        initialState: "q1",
        transitions: {
          _: {
            q1: { nextState: "q1", writeSymbol: "_", movement: "N" },
          },
          "0": {
            q1: { nextState: "q2", writeSymbol: "0", movement: "R" },
          },
          "1": {
            q1: { nextState: "halt", writeSymbol: "0", movement: "L" },
          },
        },
        inputAlphabet: ["1", "0", "_"],
      });

      const singleStateProgram = createProgram({
        states: ["q0"],
        haltStates: [],
        transitions: {},
      });

      expect(
        tmEditorReducer(singleStateProgram, {
          type: "remove_state",
          state: "q0",
        }),
      ).toBe(singleStateProgram);
      expect(
        tmEditorReducer(program, {
          type: "remove_state",
          state: "missing",
        }),
      ).toBe(program);
    });

    // Tests that renaming a state updates state lists, the initial state, transition keys, and transition targets, while invalid renames are ignored.
    it("renames a state across the full program graph", () => {
      const program = createProgram({
        haltStates: ["q2", "halt"],
      });

      expect(
        tmEditorReducer(program, {
          type: "rename_state",
          currentState: "q1",
          nextState: " qNext ",
        }),
      ).toEqual({
        ...program,
        states: ["q0", "qNext", "q2", "halt"],
        transitions: {
          _: {
            qNext: { nextState: "q0", writeSymbol: "_", movement: "N" },
          },
          "0": {
            q0: { nextState: "qNext", writeSymbol: "1", movement: "R" },
            qNext: { nextState: "q2", writeSymbol: "0", movement: "R" },
          },
          "1": {
            qNext: { nextState: "halt", writeSymbol: "0", movement: "L" },
          },
        },
        haltStates: ["q2", "halt"],
        inputAlphabet: ["1", "0", "_"],
      });
      expect(
        tmEditorReducer(program, {
          type: "rename_state",
          currentState: "q1",
          nextState: "q1",
        }),
      ).toBe(program);
      expect(
        tmEditorReducer(program, {
          type: "rename_state",
          currentState: "q1",
          nextState: " ",
        }),
      ).toBe(program);
      expect(
        tmEditorReducer(program, {
          type: "rename_state",
          currentState: "q1",
          nextState: "q0",
        }),
      ).toBe(program);
    });

    // Tests transition updates for both insertion and deletion, including creation of a missing read-symbol bucket.
    it("adds, replaces, and removes transitions", () => {
      const inserted = tmEditorReducer(createProgram({ transitions: {} }), {
        type: "update_transition",
        readSymbol: "1",
        currentState: "q0",
        transition: {
          nextState: "halt",
          writeSymbol: "0",
          movement: "L",
        },
      });

      expect(inserted.transitions).toEqual({
        "1": {
          q0: { nextState: "halt", writeSymbol: "0", movement: "L" },
        },
      });

      expect(
        tmEditorReducer(createProgram(), {
          type: "update_transition",
          readSymbol: "0",
          currentState: "q0",
          transition: null,
        }).transitions,
      ).toEqual({
        _: {
          q1: { nextState: "q0", writeSymbol: "_", movement: "N" },
        },
        "0": {
          q1: { nextState: "q2", writeSymbol: "0", movement: "R" },
        },
        "1": {
          q1: { nextState: "halt", writeSymbol: "0", movement: "L" },
        },
      });
    });

    // Tests the reducer default branch, which should return the input program unchanged for unknown actions.
    it("returns the original program for unknown actions", () => {
      const program = createProgram();

      expect(tmEditorReducer(program, { type: "unknown" } as never)).toBe(
        program,
      );
    });
  });
});
