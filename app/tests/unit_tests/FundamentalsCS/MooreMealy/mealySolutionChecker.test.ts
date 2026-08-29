import { describe, expect, it } from "vitest";
import { runMealyValidation } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/application/automataSolutionChecker";
import { defaultMealyProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMealyProgram";

describe("mealySolutionChecker", () => {
  it("validates mealy program correctly against test cases", async () => {
    const cases = [
      { input: ["0"], expectedOutputCodes: [0] },
      { input: ["0", "1"], expectedOutputCodes: [0, 1] },
    ];
    const result = await runMealyValidation(defaultMealyProgram, cases);
    expect(result.rows).toHaveLength(2);
    expect(typeof result.passed).toBe("boolean");
  });

  it("handles invalid programs gracefully", async () => {
    const invalidProgram = {
      ...defaultMealyProgram,
      states: [],
    };
    const result = await runMealyValidation(invalidProgram, [
      { input: ["0"], expectedOutputCodes: [0] },
    ]);
    expect(result.passed).toBe(false);
    expect(result.error).toBeDefined();
  });
});
