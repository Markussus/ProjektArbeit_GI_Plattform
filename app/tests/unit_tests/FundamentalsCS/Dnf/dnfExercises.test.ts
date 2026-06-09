import { describe, expect, it } from "vitest";
import {
  analyzeDnfSource,
  analyzeDnfTruthTable,
} from "@/pages/FundamentalsCS/Dnf/components/DnfBuilder/application/dnfAnalysis";
import {
  dnfExercises,
  getDnfExerciseDefinition,
} from "@/pages/FundamentalsCS/Dnf/exercises";

describe("DNF exercises", () => {
  it("defines a balanced catalog across modes and difficulties", () => {
    expect(dnfExercises).toHaveLength(6);
    expect(
      dnfExercises.filter((exercise) => exercise.difficulty === "easy"),
    ).toHaveLength(2);
    expect(
      dnfExercises.filter((exercise) => exercise.difficulty === "medium"),
    ).toHaveLength(2);
    expect(
      dnfExercises.filter((exercise) => exercise.difficulty === "hard"),
    ).toHaveLength(2);
    expect(
      dnfExercises.filter(
        (exercise) => exercise.mode === "expression_to_truth_table",
      ),
    ).toHaveLength(3);
    expect(
      dnfExercises.filter((exercise) => exercise.mode === "truth_table_to_dnf"),
    ).toHaveLength(3);
  });

  it("uses unique translation keys and resolves every exercise", () => {
    const titleKeys = dnfExercises.map((exercise) => exercise.titleKey);

    expect(new Set(titleKeys).size).toBe(titleKeys.length);
    for (const exercise of dnfExercises) {
      expect(exercise.descriptionKey).toBeTruthy();
      expect(getDnfExerciseDefinition(exercise.titleKey)).toBe(exercise);
    }
  });

  it("contains only valid expressions and truth tables", () => {
    for (const exercise of dnfExercises) {
      const analysis =
        exercise.mode === "expression_to_truth_table"
          ? analyzeDnfSource(exercise.expression)
          : analyzeDnfTruthTable(exercise.truthTable);

      expect(analysis.status, exercise.titleKey).toBe("valid");
    }
  });
});
