import { describe, it, expect } from "vitest";
import {
  buildTransitionTableHeaders,
  buildTransitionTableRows,
  getActiveTransitionCell,
  getActiveColumns,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/adapters/faTableAdapter";
import type { FAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import { EPSILON } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import {
  defaultDFAProgram,
  defaultNFAProgram,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/defaultFAProgram";

const nfaWithEpsilon: FAProgram = {
  type: "NFA",
  states: ["s0", "s1"],
  alphabet: ["a"],
  transitions: {
    s0: { a: ["s1"], [EPSILON]: ["s1"] },
    s1: {},
  },
  startState: "s0",
  acceptStates: ["s1"],
};

describe("buildTransitionTableHeaders", () => {
  it("starts with the delta symbol", () => {
    const headers = buildTransitionTableHeaders(["s0", "s1"]);
    expect(headers[0]).toBe("δ");
  });

  it("includes all states after the delta symbol", () => {
    const headers = buildTransitionTableHeaders(["s0", "s1", "s2"]);
    expect(headers).toEqual(["δ", "s0", "s1", "s2"]);
  });

  it("returns only delta for an empty states array", () => {
    expect(buildTransitionTableHeaders([])).toEqual(["δ"]);
  });

  it("has length = states.length + 1", () => {
    const states = defaultDFAProgram.states;
    expect(buildTransitionTableHeaders(states)).toHaveLength(states.length + 1);
  });
});

describe("buildTransitionTableRows — DFA", () => {
  it("produces one row per alphabet symbol", () => {
    const rows = buildTransitionTableRows(defaultDFAProgram);
    expect(rows).toHaveLength(defaultDFAProgram.alphabet.length);
  });

  it("first cell of each row is the input symbol", () => {
    const rows = buildTransitionTableRows(defaultDFAProgram);
    rows.forEach((row, i) => {
      expect(row[0]).toBe(defaultDFAProgram.alphabet[i]);
    });
  });

  it("renders a single target state as its name", () => {
    const rows = buildTransitionTableRows(defaultDFAProgram);
    const rowA = rows.find((r) => r[0] === "a")!;
    // s0 -a-> s1
    const s0ColIndex = defaultDFAProgram.states.indexOf("s0") + 1;
    expect(rowA[s0ColIndex]).toBe("s1");
  });

  it("renders a missing transition as '–'", () => {
    const dfa: FAProgram = {
      type: "DFA",
      states: ["s0", "s1"],
      alphabet: ["a", "b"],
      transitions: { s0: { a: ["s1"] }, s1: {} },
      startState: "s0",
      acceptStates: ["s1"],
    };
    const rows = buildTransitionTableRows(dfa);
    const rowB = rows.find((r) => r[0] === "b")!;
    expect(rowB[1]).toBe("–"); // s0 -b-> nothing
    expect(rowB[2]).toBe("–"); // s1 -b-> nothing
  });

  it("does not include an epsilon row for a DFA", () => {
    const rows = buildTransitionTableRows(defaultDFAProgram);
    expect(rows.some((r) => r[0] === "ε")).toBe(false);
  });
});

describe("buildTransitionTableRows — NFA", () => {
  it("renders multiple targets as {s0, s1} notation", () => {
    const rows = buildTransitionTableRows(defaultNFAProgram);
    const rowA = rows.find((r) => r[0] === "a")!;
    const s0ColIndex = defaultNFAProgram.states.indexOf("s0") + 1;
    expect(rowA[s0ColIndex]).toBe("{s0, s1}");
  });

  it("includes epsilon row when epsilon transitions exist", () => {
    const rows = buildTransitionTableRows(nfaWithEpsilon);
    expect(rows.some((r) => r[0] === "ε")).toBe(true);
  });

  it("does not add epsilon row for NFA without epsilon transitions", () => {
    const rows = buildTransitionTableRows(defaultNFAProgram);
    expect(rows.some((r) => r[0] === "ε")).toBe(false);
  });
});

describe("getActiveTransitionCell", () => {
  it("returns null when all input has been consumed", () => {
    const runtime = {
      activeStates: ["s0"],
      inputWord: ["a"],
      inputPosition: 1,
    };
    expect(getActiveTransitionCell(defaultDFAProgram, runtime)).toBeNull();
  });

  it("returns the correct row and column for a DFA step", () => {
    // s0 is at index 0 → col 1 (offset for symbol col); 'a' is at row 0
    const runtime = {
      activeStates: ["s0"],
      inputWord: ["a"],
      inputPosition: 0,
    };
    const cell = getActiveTransitionCell(defaultDFAProgram, runtime);
    expect(cell).not.toBeNull();
    expect(cell!.row).toBe(0); // 'a' is first symbol
    expect(cell!.col).toBe(1); // s0 is first state → col 1
  });

  it("returns null for an unrecognised symbol", () => {
    const runtime = {
      activeStates: ["s0"],
      inputWord: ["z"],
      inputPosition: 0,
    };
    expect(getActiveTransitionCell(defaultDFAProgram, runtime)).toBeNull();
  });

  it("returns null when activeStates is empty", () => {
    const runtime = {
      activeStates: [],
      inputWord: ["a"],
      inputPosition: 0,
    };
    expect(getActiveTransitionCell(defaultDFAProgram, runtime)).toBeNull();
  });
});

describe("getActiveColumns", () => {
  it("returns column indices offset by 1 for each active state", () => {
    // s0 = index 0 → col 1; s2 = index 2 → col 3
    const cols = getActiveColumns(defaultDFAProgram, ["s0", "s2"]);
    expect(cols).toContain(1);
    expect(cols).toContain(3);
  });

  it("returns an empty array when activeStates is empty", () => {
    expect(getActiveColumns(defaultDFAProgram, [])).toEqual([]);
  });

  it("ignores states that are not in the program", () => {
    const cols = getActiveColumns(defaultDFAProgram, ["ghost"]);
    expect(cols).toHaveLength(0);
  });

  it("returns one entry per active state", () => {
    const cols = getActiveColumns(defaultDFAProgram, ["s0", "s1"]);
    expect(cols).toHaveLength(2);
  });
});
