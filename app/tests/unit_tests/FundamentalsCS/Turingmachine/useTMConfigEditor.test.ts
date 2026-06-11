// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useTMConfigEditor } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/application/useTMConfigEditor";
import type { TMProgram } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmProgram";
import { DEFAULT_BLANK_SYMBOL } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmTypes";

function createProgram(overrides: Partial<TMProgram> = {}): TMProgram {
  return {
    states: ["q0", "q1", "qS"],
    inputAlphabet: ["0", "1"],
    tapeAlphabet: ["0", "1", "_"],
    blankSymbol: "_",
    initialState: "q0",
    haltStates: ["qS"],
    transitions: {
      _: {
        q0: { nextState: "qS", writeSymbol: "_", movement: "N" },
      },
      "0": {
        q0: { nextState: "q1", writeSymbol: "1", movement: "R" },
      },
      "1": {
        q1: { nextState: "qS", writeSymbol: "0", movement: "L" },
      },
    },
    initialTape: ["0", "1"],
    ...overrides,
  };
}

describe("useTMConfigEditor", () => {
  // Tests the initial derived editor state, including filtered transition columns and blank-first display rows.
  it("exposes the derived editor state for the provided program", () => {
    const { result } = renderHook(() => useTMConfigEditor(createProgram()));

    expect(result.current.draft.inputAlphabet).toEqual(["0", "1"]);
    expect(result.current.tableHeaders).toEqual(["δ", "q₀", "q₁"]);
    expect(result.current.displayRows).toEqual([
      ["_", "(qS, _, N)", ""],
      ["0", "(q₁, 1, R)", ""],
      ["1", "", "(qS, 0, L)"],
    ]);
    expect(result.current.validationIssues).toEqual([]);
    expect(result.current.blockingCellIssue).toBeNull();
    expect(result.current.hasBlockingCellIssue).toBe(false);
  });

  // Tests that tape, state, row, and column handlers update the draft through the reducer-backed API.
  it("updates the draft through the editing handlers", () => {
    const { result } = renderHook(() => useTMConfigEditor(createProgram()));

    act(() => {
      result.current.handleInitialTapeChange("101");
      result.current.handleInitialStateChange("q1");
      result.current.handleAddRow();
      result.current.handleAddColumn();
      result.current.handleToggleHaltState("q1", true);
      result.current.handleAddHaltState(" qNew ");
      result.current.handleAddHaltState("q₃");
    });

    expect(result.current.draft.initialTape).toEqual(["1", "0", "1"]);
    expect(result.current.draft.initialState).toBe("q1");
    expect(result.current.draft.tapeAlphabet).toEqual(["0", "1", "_", "2"]);
    expect(result.current.draft.states).toEqual([
      "q0",
      "q1",
      "qS",
      "q2",
      "qNew",
      "q3",
    ]);
    expect(result.current.draft.haltStates).toEqual(["qS", "q1", "qNew", "q3"]);
  });

  // Tests the keyboard-friendly blank alias in editor inputs that parse tape symbols.
  it("normalizes <> to the default blank symbol in tape and transition inputs", () => {
    const { result } = renderHook(() =>
      useTMConfigEditor(
        createProgram({
          tapeAlphabet: [DEFAULT_BLANK_SYMBOL, "0", "1"],
          blankSymbol: DEFAULT_BLANK_SYMBOL,
          transitions: {
            [DEFAULT_BLANK_SYMBOL]: {},
            "0": {
              q0: { nextState: "q1", writeSymbol: "1", movement: "R" },
            },
            "1": {
              q1: { nextState: "qS", writeSymbol: "0", movement: "L" },
            },
          },
        }),
      ),
    );

    act(() => {
      result.current.handleInitialTapeChange("0<>1");
    });
    act(() => {
      result.current.handleCellChange(0, 1, "(qS, <>, N)");
    });
    act(() => {
      result.current.handleCellBlur(0, 1);
    });

    expect(result.current.draft.initialTape).toEqual([
      "0",
      DEFAULT_BLANK_SYMBOL,
      "1",
    ]);
    expect(result.current.draft.transitions[DEFAULT_BLANK_SYMBOL]?.q0).toEqual({
      nextState: "qS",
      writeSymbol: DEFAULT_BLANK_SYMBOL,
      movement: "N",
    });
    expect(result.current.displayRows[0][1]).toBe(
      `(qS, ${DEFAULT_BLANK_SYMBOL}, N)`,
    );
  });

  // Tests invalid symbol editing, which should block unrelated cells, mark only the failing cell editable, and clear once a valid rename is committed.
  it("creates and resolves a blocking symbol-edit issue", () => {
    const { result } = renderHook(() => useTMConfigEditor(createProgram()));

    act(() => {
      result.current.handleCellChange(1, 0, "ab");
    });
    act(() => {
      result.current.handleCellBlur(1, 0);
    });

    expect(result.current.blockingCellIssue).toEqual({
      code: "symbol_single_char",
      position: { row: 1, col: 0 },
    });
    expect(result.current.isCellEditable(1, 0)).toBe(true);
    expect(result.current.isCellDisabled(0, 0)).toBe(true);
    expect(result.current.isCellDisabled(2, 1)).toBe(true);

    act(() => {
      result.current.handleCellChange(2, 0, "x");
    });

    expect(result.current.displayRows[2][0]).toBe("1");

    act(() => {
      result.current.handleCellChange(1, 0, "x");
    });
    act(() => {
      result.current.handleCellBlur(1, 0);
    });

    expect(result.current.blockingCellIssue).toBeNull();
    expect(result.current.hasBlockingCellIssue).toBe(false);
    expect(result.current.draft.tapeAlphabet).toEqual(["x", "1", "_"]);
    expect(result.current.displayRows[1][0]).toBe("x");
  });

  // Tests transition-cell validation, including the invalid-format edge case and subsequent successful commit to the program.
  it("validates and commits transition cell edits", () => {
    const { result } = renderHook(() => useTMConfigEditor(createProgram()));

    act(() => {
      result.current.handleCellChange(0, 2, "invalid");
    });
    act(() => {
      result.current.handleCellBlur(0, 2);
    });

    expect(result.current.blockingCellIssue).toEqual({
      code: "transition_invalid",
      position: { row: 0, col: 2 },
    });

    act(() => {
      result.current.handleCellChange(0, 2, "( q1 , 1 , R )");
    });
    act(() => {
      result.current.handleCellBlur(0, 2);
    });

    expect(result.current.blockingCellIssue).toBeNull();
    expect(result.current.draft.transitions._?.q1).toEqual({
      nextState: "q1",
      writeSymbol: "1",
      movement: "R",
    });
    expect(result.current.displayRows[0][2]).toBe("(q₁, 1, R)");
  });

  it("normalizes copied transition cells with subscript state names", () => {
    const { result } = renderHook(() => useTMConfigEditor(createProgram()));

    act(() => {
      result.current.handleCellChange(2, 1, "(q₁, 0, L)");
    });
    act(() => {
      result.current.handleCellBlur(2, 1);
    });

    expect(result.current.blockingCellIssue).toBeNull();
    expect(result.current.draft.transitions["1"]?.q0).toEqual({
      nextState: "q1",
      writeSymbol: "0",
      movement: "L",
    });
    expect(result.current.displayRows[2][1]).toBe("(q₁, 0, L)");
  });

  // Tests header, row, and column removal handlers, including ignored indices that should not mutate the draft.
  it("renames and removes entities through table-oriented handlers", () => {
    const { result } = renderHook(() => useTMConfigEditor(createProgram()));

    act(() => {
      result.current.handleHeaderChange(1, "qStart");
      result.current.handleHeaderChange(0, "ignored");
      result.current.handleRemoveRow(2);
      result.current.handleRemoveRow(99);
      result.current.handleRemoveColumn(2);
      result.current.handleRemoveColumn(99);
    });

    expect(result.current.draft.states).toEqual(["qStart", "qS"]);
    expect(result.current.draft.initialState).toBe("qStart");
    expect(result.current.draft.tapeAlphabet).toEqual(["0", "_"]);
    expect(result.current.tableHeaders).toEqual(["δ", "qStart"]);
  });

  // Tests applyProgram against both blocking-cell and program-level validation failures, then verifies the successful apply path returns a cloned program.
  it("applies only valid programs and stores validation issues for invalid drafts", () => {
    const { result } = renderHook(() => useTMConfigEditor(createProgram()));

    act(() => {
      result.current.handleCellChange(1, 0, "ab");
    });
    act(() => {
      result.current.handleCellBlur(1, 0);
    });

    expect(result.current.applyProgram()).toEqual({ ok: false });
    expect(result.current.validationIssues).toEqual([]);

    act(() => {
      result.current.handleCellChange(1, 0, "0");
    });
    act(() => {
      result.current.handleCellBlur(1, 0);
    });
    act(() => {
      result.current.handleToggleHaltState("qS", false);
    });

    let invalidApplyResult: ReturnType<
      typeof result.current.applyProgram
    > | null = null;
    act(() => {
      invalidApplyResult = result.current.applyProgram();
    });

    expect(invalidApplyResult).toEqual({ ok: false });
    expect(result.current.validationIssues).toContainEqual({
      code: "halt_states_empty",
      path: "haltStates",
    });

    act(() => {
      result.current.handleToggleHaltState("qS", true);
    });

    let applyResult: ReturnType<typeof result.current.applyProgram> | null =
      null;
    act(() => {
      applyResult = result.current.applyProgram();
    });

    expect(applyResult).toEqual({
      ok: true,
      program: result.current.draft,
    });
    if (applyResult.ok) {
      expect(applyResult.program).not.toBe(result.current.draft);
    }
  });

  // Tests that resetToProgram clears transient cell drafts, validation issues, and blocking errors while loading a fresh program draft.
  it("resets the editor back to a supplied program", () => {
    const { result } = renderHook(() => useTMConfigEditor(createProgram()));
    const replacementProgram = createProgram({
      initialTape: ["1", "1", "0"],
      states: ["q0", "q1", "qS", "q2"],
      transitions: {},
    });

    act(() => {
      result.current.handleCellChange(1, 0, "ab");
    });
    act(() => {
      result.current.handleCellBlur(1, 0);
      result.current.handleToggleHaltState("qS", false);
    });
    result.current.applyProgram();

    act(() => {
      result.current.resetToProgram(replacementProgram);
    });

    expect(result.current.draft.initialTape).toEqual(["1", "1", "0"]);
    expect(result.current.draft.inputAlphabet).toEqual(["1", "0"]);
    expect(result.current.blockingCellIssue).toBeNull();
    expect(result.current.validationIssues).toEqual([]);
    expect(result.current.displayRows[1][0]).toBe("0");
  });
});
