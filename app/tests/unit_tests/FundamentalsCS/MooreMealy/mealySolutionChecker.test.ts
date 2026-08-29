import { describe, expect, it } from "vitest";
import { runMealyValidation } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/application/automataSolutionChecker";
import { defaultMealyProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMealyProgram";

describe("mealySolutionChecker", () => {
  it("returns the exact transition outputs for matching cases", () => {
    const cases = [
      { input: ["0"], expectedOutputCodes: [0] },
      { input: ["0", "1"], expectedOutputCodes: [0, 1] },
    ];
    const result = runMealyValidation(defaultMealyProgram, cases);

    expect(result).toEqual({
      rows: [
        {
          passed: true,
          input: ["0"],
          outputCodes: [0],
          expectedOutputCodes: [0],
          error: null,
        },
        {
          passed: true,
          input: ["0", "1"],
          outputCodes: [0, 1],
          expectedOutputCodes: [0, 1],
          error: null,
        },
      ],
      passed: true,
      error: null,
    });
  });

  it("marks differing output sequences as failed", () => {
    const result = runMealyValidation(defaultMealyProgram, [
      { input: ["1"], expectedOutputCodes: [99] },
    ]);

    expect(result.passed).toBe(false);
    expect(result.rows[0]).toMatchObject({
      passed: false,
      outputCodes: [2],
      expectedOutputCodes: [99],
      error: null,
    });
  });

  it("reports input symbols outside the configured alphabet", () => {
    const result = runMealyValidation(defaultMealyProgram, [
      { input: ["UNKNOWN"], expectedOutputCodes: [] },
    ]);

    expect(result).toMatchObject({ passed: false, error: null });
    expect(result.rows[0]).toMatchObject({
      passed: false,
      input: ["UNKNOWN"],
      outputCodes: [],
      error: "input_symbol_missing",
    });
  });

  it("handles invalid programs gracefully", () => {
    const invalidProgram = {
      ...defaultMealyProgram,
      states: [],
    };
    const result = runMealyValidation(invalidProgram, [
      { input: ["0"], expectedOutputCodes: [0] },
    ]);

    expect(result.passed).toBe(false);
    expect(result.rows).toEqual([]);
    expect(result.error).toContain("Invalid Mealy program");
  });
});
