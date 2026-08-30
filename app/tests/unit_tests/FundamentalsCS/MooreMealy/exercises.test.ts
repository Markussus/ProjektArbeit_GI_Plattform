import { describe, expect, it } from "vitest";
import {
  automataExerciseScenarios,
  getAutomataExerciseScenario,
  mealyExerciseScenarios,
  mooreExerciseScenarios,
  mooreMealyExercises,
} from "@/pages/FundamentalsCS/MooreMealy/exercises";
import {
  runMealyValidation,
  runMooreValidation,
} from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/application/automataSolutionChecker";
import { validateMealyProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mealyProgram";
import { validateMooreProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mooreProgram";

describe("Moore and Mealy exercise scenarios", () => {
  it("defines distinct, retrievable scenarios in both machine categories", () => {
    expect(mooreExerciseScenarios).toHaveLength(7);
    expect(mealyExerciseScenarios).toHaveLength(4);
    expect(mooreMealyExercises).toHaveLength(11);

    const ids = automataExerciseScenarios.map((scenario) => scenario.id);
    const storageIds = automataExerciseScenarios.map(
      (scenario) => scenario.storageId,
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(storageIds).size).toBe(storageIds.length);

    for (const scenario of automataExerciseScenarios) {
      expect(getAutomataExerciseScenario(scenario.id)).toBe(scenario);
      expect(scenario.validationCases.length).toBeGreaterThan(0);
    }
  });

  it("contains valid starter and solution programs", () => {
    for (const scenario of mooreExerciseScenarios) {
      expect(validateMooreProgram(scenario.starterProgram)).toEqual([]);
      expect(validateMooreProgram(scenario.solutionProgram)).toEqual([]);
    }
    for (const scenario of mealyExerciseScenarios) {
      expect(validateMealyProgram(scenario.starterProgram)).toEqual([]);
      expect(validateMealyProgram(scenario.solutionProgram)).toEqual([]);
    }
  });

  it("verifies every solution against independently specified output cases", () => {
    for (const scenario of automataExerciseScenarios) {
      const result =
        scenario.machineType === "moore"
          ? runMooreValidation(
              scenario.solutionProgram,
              scenario.validationCases,
            )
          : runMealyValidation(
              scenario.solutionProgram,
              scenario.validationCases,
            );

      expect(result.error, scenario.id).toBeNull();
      expect(result.passed, scenario.id).toBe(true);
      expect(
        result.rows.every((row) => row.passed),
        scenario.id,
      ).toBe(true);

      for (const validationCase of scenario.validationCases) {
        const expectedLength =
          validationCase.input.length +
          (scenario.machineType === "moore" ? 1 : 0);
        expect(validationCase.expectedOutputCodes, scenario.id).toHaveLength(
          expectedLength,
        );
      }
    }
  });

  it("returns null for an unknown exercise id", () => {
    expect(getAutomataExerciseScenario("unknown-id" as never)).toBeNull();
  });
});
