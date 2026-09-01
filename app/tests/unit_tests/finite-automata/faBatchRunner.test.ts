import { describe, expect, it } from "vitest";
import { runBatch } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faBatchRunner";
import type { FAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import { EPSILON } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import { defaultDFAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/defaultFAProgram";

/** Accepts exactly the words over {a, b} that end in "ab". */
const endsWithAb = defaultDFAProgram;

describe("runBatch", () => {
  it("returns one result per input word, in order", () => {
    const results = runBatch(endsWithAb, ["ab", "ba", "aab"]);

    expect(results.map((r) => r.inputWord)).toEqual(["ab", "ba", "aab"]);
  });

  it("accepts a word that reaches an accept state", () => {
    const [result] = runBatch(endsWithAb, ["aab"]);

    expect(result.accepted).toBe(true);
    expect(result.steps).toBe(3);
    expect(result.finalStates).toEqual(["S2"]);
    expect(result.failStepIndex).toBeNull();
  });

  it("rejects a word that halts in a non-accepting state", () => {
    const [result] = runBatch(endsWithAb, ["aba"]);

    expect(result.accepted).toBe(false);
    expect(result.failStepIndex).toBeNull();
    expect(result.finalStates.length).toBeGreaterThan(0);
  });

  it("records the step index where the run hit a dead end", () => {
    // A partial DFA: "b" from S0 has no transition at all.
    const partial: FAProgram = {
      type: "DFA",
      states: ["S0", "S1"],
      alphabet: ["a", "b"],
      transitions: { S0: { a: ["S1"] }, S1: {} },
      startState: "S0",
      acceptStates: ["S1"],
    };

    const [result] = runBatch(partial, ["ba"]);

    expect(result.accepted).toBe(false);
    expect(result.failStepIndex).toBe(0);
    expect(result.finalStates).toEqual([]);
  });

  it("accepts the empty word when the start state is accepting", () => {
    const acceptsEmpty: FAProgram = {
      ...endsWithAb,
      acceptStates: [endsWithAb.startState],
    };

    const [result] = runBatch(acceptsEmpty, [""]);

    expect(result.accepted).toBe(true);
    expect(result.steps).toBe(0);
  });

  it("follows epsilon transitions before reading the first symbol", () => {
    const withEpsilon: FAProgram = {
      type: "NFA",
      states: ["S0", "S1"],
      alphabet: ["a"],
      transitions: { S0: { [EPSILON]: ["S1"] }, S1: {} },
      startState: "S0",
      acceptStates: ["S1"],
    };

    const [result] = runBatch(withEpsilon, [""]);

    expect(result.accepted).toBe(true);
    expect(result.finalStates).toContain("S1");
  });

  it("returns an empty list for an empty batch", () => {
    expect(runBatch(endsWithAb, [])).toEqual([]);
  });
});
