import { describe, expect, it } from "vitest";
import {
  buildViolationEdgeKeys,
  findDFAViolations,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faDeterminismCheck";
import type { FAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import { EPSILON } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import {
  defaultDFAProgram,
  defaultNFAProgram,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/defaultFAProgram";

describe("findDFAViolations", () => {
  it("reports nothing for a well-formed DFA", () => {
    expect(findDFAViolations(defaultDFAProgram)).toEqual([]);
  });

  it("reports nothing for an NFA, however nondeterministic", () => {
    expect(findDFAViolations(defaultNFAProgram)).toEqual([]);
  });

  it("flags a transition with more than one target", () => {
    const program: FAProgram = {
      ...defaultDFAProgram,
      transitions: {
        ...defaultDFAProgram.transitions,
        S0: { a: ["S0", "S1"], b: ["S0"] },
      },
    };

    expect(findDFAViolations(program)).toEqual([
      {
        state: "S0",
        symbol: "a",
        targets: ["S0", "S1"],
        type: "nondeterministic",
      },
    ]);
  });

  it("flags an epsilon transition even when it has a single target", () => {
    const program: FAProgram = {
      ...defaultDFAProgram,
      transitions: {
        ...defaultDFAProgram.transitions,
        S0: { [EPSILON]: ["S1"] },
      },
    };

    expect(findDFAViolations(program)).toEqual([
      { state: "S0", symbol: EPSILON, targets: ["S1"], type: "epsilon" },
    ]);
  });

  it("reports every violating row of the table", () => {
    const program: FAProgram = {
      ...defaultDFAProgram,
      transitions: {
        S0: { a: ["S0", "S1"], [EPSILON]: ["S2"] },
        S1: { b: ["S1", "S2"] },
        S2: {},
      },
    };

    expect(findDFAViolations(program).map((v) => v.type)).toEqual([
      "nondeterministic",
      "epsilon",
      "nondeterministic",
    ]);
  });
});

describe("buildViolationEdgeKeys", () => {
  it("returns an empty set when there are no violations", () => {
    expect(buildViolationEdgeKeys([]).size).toBe(0);
  });

  it("emits one key per (source, target) pair", () => {
    const keys = buildViolationEdgeKeys([
      {
        state: "S0",
        symbol: "a",
        targets: ["S0", "S1"],
        type: "nondeterministic",
      },
      { state: "S1", symbol: EPSILON, targets: ["S2"], type: "epsilon" },
    ]);

    expect([...keys].sort()).toEqual(["S0__S0", "S0__S1", "S1__S2"]);
  });
});
