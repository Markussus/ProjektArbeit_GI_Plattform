import { describe, expect, it } from "vitest";
import { runMooreValidation } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/application/automataSolutionChecker";
import type { MooreProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mooreTypes";
import type { MooreValidationCase } from "@/pages/FundamentalsCS/MooreMealy/exercises";

const solution: MooreProgram = {
  states: ["LOCKED", "UNLOCKED"],
  inputSymbols: ["COIN", "PASS"],
  transitions: {
    COIN: { LOCKED: "UNLOCKED", UNLOCKED: "UNLOCKED" },
    PASS: { LOCKED: "LOCKED", UNLOCKED: "LOCKED" },
  },
  outputs: {
    LOCKED: { symbol: "LOCKED", code: 0 },
    UNLOCKED: { symbol: "FREE", code: 1 },
  },
  initialState: "LOCKED",
  inputWord: [],
  representation: "binary",
};

describe("runMooreValidation", () => {
  const validationCases: MooreValidationCase[] = [
    { input: [], expectedOutputCodes: [0] },
    { input: ["COIN"], expectedOutputCodes: [0, 1] },
    { input: ["PASS"], expectedOutputCodes: [0, 0] },
    { input: ["COIN", "PASS"], expectedOutputCodes: [0, 1, 0] },
  ];

  it("accepts equivalent behavior with renamed states and outputs", () => {
    const renamed: MooreProgram = {
      states: ["A", "B"],
      inputSymbols: ["COIN", "PASS"],
      transitions: {
        COIN: { A: "B", B: "B" },
        PASS: { A: "A", B: "A" },
      },
      outputs: {
        A: { symbol: "RED", code: 0 },
        B: { symbol: "GREEN", code: 1 },
      },
      initialState: "A",
      inputWord: [],
      representation: "decimal",
    };

    expect(runMooreValidation(renamed, validationCases).passed).toBe(true);
  });

  it("rejects behavior that differs from the solution", () => {
    const incorrect: MooreProgram = {
      ...solution,
      transitions: {
        ...solution.transitions,
        COIN: { LOCKED: "LOCKED", UNLOCKED: "UNLOCKED" },
      },
    };

    const result = runMooreValidation(incorrect, validationCases);
    expect(result.passed).toBe(false);
    expect(result.rows.some((row) => !row.passed)).toBe(true);
  });
});
