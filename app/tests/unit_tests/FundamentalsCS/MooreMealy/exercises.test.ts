import { describe, expect, it } from "vitest";
import {
  getMooreExerciseScenario,
  mooreMealyExercises,
} from "@/pages/FundamentalsCS/MooreMealy/exercises";
import { runMooreValidation } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/application/automataSolutionChecker";

describe("mooreExercises scenarios and solution verification", () => {
  it("defines 7 distinct exercise items with starter and solution programs", () => {
    expect(mooreMealyExercises).toHaveLength(7);
    for (const exercise of mooreMealyExercises) {
      const scenario = getMooreExerciseScenario(exercise.titleKey);
      expect(scenario).not.toBeNull();
      expect(scenario!.starterProgram).toBeDefined();
      expect(scenario!.solutionProgram).toBeDefined();
      expect(scenario!.validationCases.length).toBeGreaterThan(0);
    }
  });

  it("verifies that all exercise solutionPrograms pass 100% of their validationCases", async () => {
    for (const exercise of mooreMealyExercises) {
      const scenario = getMooreExerciseScenario(exercise.titleKey)!;
      const result = await runMooreValidation(
        scenario.solutionProgram,
        scenario.validationCases,
      );
      expect(result.passed).toBe(true);
      expect(result.error).toBeNull();
      expect(result.rows.every((row) => row.passed)).toBe(true);
    }
  });

  it("returns null for unknown exercise id", () => {
    expect(getMooreExerciseScenario("unknown-id" as never)).toBeNull();
  });
});
