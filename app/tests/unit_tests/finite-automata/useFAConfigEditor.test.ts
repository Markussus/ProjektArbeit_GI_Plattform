/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFAConfigEditor } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/application/useFAConfigEditor";
import {
  defaultDFAProgram,
  defaultNFAProgram,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/defaultFAProgram";
import type { FAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import { EPSILON } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";

function editor(initial: FAProgram = defaultDFAProgram) {
  return renderHook(() => useFAConfigEditor(structuredClone(initial))).result;
}

describe("useFAConfigEditor — automaton type", () => {
  it("swaps the default DFA for the default NFA and back", () => {
    const result = editor();

    act(() => result.current.setAutomatonType("NFA"));
    expect(result.current.draft).toEqual(defaultNFAProgram);

    act(() => result.current.setAutomatonType("DFA"));
    expect(result.current.draft).toEqual(defaultDFAProgram);
  });

  it("keeps the current program when it is not one of the defaults", () => {
    const custom: FAProgram = {
      type: "DFA",
      states: ["A"],
      alphabet: ["x"],
      transitions: { A: { x: ["A"] } },
      startState: "A",
      acceptStates: ["A"],
    };
    const result = editor(custom);

    act(() => result.current.setAutomatonType("NFA"));

    expect(result.current.draft).toEqual({ ...custom, type: "NFA" });
  });

  it("is a no-op when the type is already the requested one", () => {
    const result = editor();
    const before = result.current.draft;

    act(() => result.current.setAutomatonType("DFA"));

    expect(result.current.draft).toBe(before);
  });
});

describe("useFAConfigEditor — states", () => {
  it("parses a comma-separated list and trims blank entries", () => {
    const result = editor();

    act(() => result.current.setStates(" A , B ,, C "));

    expect(result.current.draft.states).toEqual(["A", "B", "C"]);
  });

  it("drops accept states that no longer exist", () => {
    const result = editor();

    act(() => result.current.setStates("S0,S1"));

    expect(result.current.draft.acceptStates).not.toContain("S2");
  });

  it("keeps the start state when it survives the edit", () => {
    const result = editor();

    act(() => result.current.setStates("S0,S1,S2"));

    expect(result.current.draft.startState).toBe("S0");
  });

  it("falls back to the first state when the start state is removed", () => {
    const result = editor();

    act(() => result.current.setStates("S1,S2"));

    expect(result.current.draft.startState).toBe("S1");
  });

  it("leaves the start state empty when every state is removed", () => {
    const result = editor();

    act(() => result.current.setStates(""));

    expect(result.current.draft.states).toEqual([]);
    expect(result.current.draft.startState).toBe("");
  });

  it("prunes transitions of and to states that were removed", () => {
    const result = editor();

    act(() => result.current.setStates("S0"));

    expect(Object.keys(result.current.draft.transitions)).toEqual(["S0"]);
    for (const targets of Object.values(result.current.draft.transitions.S0)) {
      expect(targets).toEqual(["S0"]);
    }
  });

  it("gives a state with no stored row an empty transition row", () => {
    const result = editor();

    act(() => result.current.setStates("S0,S9"));

    expect(result.current.draft.transitions.S9).toEqual({});
  });
});

describe("useFAConfigEditor — alphabet", () => {
  it("accepts only single-character symbols", () => {
    const result = editor();

    act(() => result.current.setAlphabet("a, bb, c , xyz"));

    expect(result.current.draft.alphabet).toEqual(["a", "c"]);
  });

  it("prunes transitions on symbols that left the alphabet", () => {
    const result = editor();

    act(() => result.current.setAlphabet("a"));

    for (const row of Object.values(result.current.draft.transitions)) {
      expect(Object.keys(row)).not.toContain("b");
    }
  });

  it("keeps epsilon transitions even though ε is never in the alphabet", () => {
    const withEpsilon: FAProgram = {
      ...defaultNFAProgram,
      transitions: {
        ...defaultNFAProgram.transitions,
        S0: { [EPSILON]: ["S1"] },
      },
    };
    const result = editor(withEpsilon);

    act(() => result.current.setAlphabet("a,b"));

    expect(result.current.draft.transitions.S0[EPSILON]).toEqual(["S1"]);
  });
});

describe("useFAConfigEditor — start and accept states", () => {
  it("trims the start state", () => {
    const result = editor();

    act(() => result.current.setStartState("  S1  "));

    expect(result.current.draft.startState).toBe("S1");
  });

  it("parses accept states as a comma-separated list", () => {
    const result = editor();

    act(() => result.current.setAcceptStates("S1, S2"));

    expect(result.current.draft.acceptStates).toEqual(["S1", "S2"]);
  });
});

describe("useFAConfigEditor — transitions", () => {
  it("sets the targets of one cell", () => {
    const result = editor();

    act(() => result.current.setTransition("S0", "a", "S1, S2"));

    expect(result.current.draft.transitions.S0.a).toEqual(["S1", "S2"]);
  });

  it("deletes the cell when the targets are cleared", () => {
    const result = editor();

    act(() => result.current.setTransition("S0", "a", "  "));

    expect(result.current.draft.transitions.S0).not.toHaveProperty("a");
  });

  it("creates a missing row before writing into it", () => {
    const result = editor();

    act(() => result.current.setTransition("Sx", "a", "S0"));

    expect(result.current.draft.transitions.Sx).toEqual({ a: ["S0"] });
  });
});

describe("useFAConfigEditor — add and remove states", () => {
  it("adds the first unused S-name", () => {
    const result = editor();

    act(() => result.current.addState());

    expect(result.current.draft.states).toContain("S3");
  });

  it("adopts the new state as the start state when there was none", () => {
    const noStart: FAProgram = {
      type: "DFA",
      states: [],
      alphabet: ["a"],
      transitions: {},
      startState: "",
      acceptStates: [],
    };
    const result = editor(noStart);

    act(() => result.current.addState());

    expect(result.current.draft.startState).toBe("S0");
  });

  it("removes a state along with its transitions", () => {
    const result = editor();

    act(() => result.current.removeState("S2"));

    expect(result.current.draft.states).not.toContain("S2");
    expect(result.current.draft.acceptStates).not.toContain("S2");
    expect(result.current.draft.transitions).not.toHaveProperty("S2");
  });

  it("moves the start state when the start state itself is removed", () => {
    const result = editor();

    act(() => result.current.removeState("S0"));

    expect(result.current.draft.startState).toBe("S1");
  });

  it("refuses to remove the last remaining state", () => {
    const single: FAProgram = {
      type: "DFA",
      states: ["S0"],
      alphabet: ["a"],
      transitions: { S0: {} },
      startState: "S0",
      acceptStates: [],
    };
    const result = editor(single);
    const before = result.current.draft;

    act(() => result.current.removeState("S0"));

    expect(result.current.draft).toBe(before);
  });
});

describe("useFAConfigEditor — validation, apply and reset", () => {
  it("reports a valid default program", () => {
    const result = editor();

    expect(result.current.isValid).toBe(true);
    expect(result.current.validationIssues).toEqual([]);
  });

  it("applies a valid draft as a new program", () => {
    const result = editor();

    const applied = result.current.applyProgram();

    expect(applied.ok).toBe(true);
    expect(applied.ok && applied.program).toEqual(result.current.draft);
  });

  it("refuses to apply a draft with validation issues", () => {
    const result = editor();

    act(() => result.current.setStartState("nowhere"));

    expect(result.current.isValid).toBe(false);
    expect(result.current.applyProgram().ok).toBe(false);
  });

  it("resets the draft back to a given program", () => {
    const result = editor();

    act(() => result.current.setStates("A"));
    act(() => result.current.resetToProgram(defaultNFAProgram));

    expect(result.current.draft).toEqual(defaultNFAProgram);
  });

  it("exposes table headers and rows derived from the draft", () => {
    const result = editor();

    expect(result.current.tableHeaders).toEqual([
      "δ",
      ...defaultDFAProgram.states,
    ]);
    expect(result.current.tableRows).toHaveLength(
      defaultDFAProgram.alphabet.length,
    );
  });
});
