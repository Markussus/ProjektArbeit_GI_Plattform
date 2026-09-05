import { describe, expect, it } from "vitest";
import { validateAgainstSolution } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faExerciseValidation";
import type { FAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import { EPSILON } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";

/** DFA over {0,1} accepting exactly the words that end in "01". */
const endsWith01: FAProgram = {
  type: "DFA",
  states: ["S0", "S1", "S2"],
  alphabet: ["0", "1"],
  transitions: {
    S0: { "0": ["S1"], "1": ["S0"] },
    S1: { "0": ["S1"], "1": ["S2"] },
    S2: { "0": ["S1"], "1": ["S0"] },
  },
  startState: "S0",
  acceptStates: ["S2"],
};

/** Same language, expressed as an ε-NFA — the ε-closure must be followed. */
const endsWith01Nfa: FAProgram = {
  type: "NFA",
  states: ["N0", "N1", "S0", "S1", "S2"],
  alphabet: ["0", "1"],
  transitions: {
    N0: { [EPSILON]: ["N1"] },
    N1: { [EPSILON]: ["S0"] },
    S0: { "0": ["S1"], "1": ["S0"] },
    S1: { "0": ["S1"], "1": ["S2"] },
    S2: { "0": ["S1"], "1": ["S0"] },
  },
  startState: "N0",
  acceptStates: ["S2"],
};

describe("validateAgainstSolution", () => {
  it("passes when the student's automaton matches the reference", () => {
    const result = validateAgainstSolution(endsWith01, endsWith01);

    expect(result.passed).toBe(true);
    expect(result.failedCount).toBe(0);
    expect(result.firstFailure).toBeNull();
    expect(result.structuralIssues).toEqual([]);
    expect(result.passedCount).toBe(result.total);
  });

  it("passes for an equivalent automaton with a different shape", () => {
    const result = validateAgainstSolution(endsWith01Nfa, endsWith01);

    expect(result.passed).toBe(true);
    expect(result.failedCount).toBe(0);
  });

  it("reports the first mismatching word as the counterexample", () => {
    // Accepts everything ending in "0" instead of "01".
    const endsWith0: FAProgram = {
      ...endsWith01,
      acceptStates: ["S1"],
    };

    const result = validateAgainstSolution(endsWith0, endsWith01);

    expect(result.passed).toBe(false);
    expect(result.failedCount).toBeGreaterThan(0);
    expect(result.firstFailure).not.toBeNull();
    expect(result.firstFailure!.expected).not.toBe(result.firstFailure!.got);
  });

  it("surfaces structural problems as issue codes and fails the check", () => {
    const broken: FAProgram = {
      ...endsWith01,
      transitions: {
        ...endsWith01.transitions,
        S0: { "0": ["Sx"], "1": ["S0"] },
      },
    };

    const result = validateAgainstSolution(broken, endsWith01);

    expect(result.structuralIssues).toContain("transition_target_invalid");
    expect(result.passed).toBe(false);
  });

  it("rejects every word using a symbol outside the student's alphabet", () => {
    const narrowAlphabet: FAProgram = {
      ...endsWith01,
      alphabet: ["0"],
    };

    const result = validateAgainstSolution(narrowAlphabet, endsWith01);

    expect(result.passed).toBe(false);
    // "01" is accepted by the reference but the student cannot read "1".
    expect(result.cases.find((c) => c.word === "01")?.got).toBe(false);
  });

  it("enumerates words up to maxLen over the union of both alphabets", () => {
    const result = validateAgainstSolution(endsWith01, endsWith01, {
      maxLen: 2,
    });

    // ε + 2 words of length 1 + 4 of length 2.
    expect(result.total).toBe(7);
    expect(result.cases.map((c) => c.word)).toContain("");
  });

  it("caps the returned cases at maxSamples without changing the totals", () => {
    const result = validateAgainstSolution(endsWith01, endsWith01, {
      maxLen: 3,
      maxSamples: 4,
    });

    expect(result.cases).toHaveLength(4);
    expect(result.total).toBe(15);
    expect(result.passedCount).toBe(15);
  });

  it("stops a run as soon as the student's automaton dead-ends", () => {
    const partial: FAProgram = {
      type: "DFA",
      states: ["S0"],
      alphabet: ["0", "1"],
      transitions: { S0: {} },
      startState: "S0",
      acceptStates: ["S0"],
    };

    const result = validateAgainstSolution(partial, endsWith01, { maxLen: 2 });

    // Only ε survives; every longer word dies on the first symbol.
    expect(result.cases.filter((c) => c.got)).toHaveLength(1);
    expect(result.cases.find((c) => c.word === "")?.got).toBe(true);
  });
});
