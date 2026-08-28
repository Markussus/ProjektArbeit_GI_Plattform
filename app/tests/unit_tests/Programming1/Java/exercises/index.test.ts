import { describe, expect, it } from "vitest";
import {
  getJavaFileName,
  getJavaScenario,
  getJavaStarterCode,
  javaProgrammingExercises,
} from "../../../../../src/pages/Programming1/Java/exercises";

describe("Java exercise lookup helpers", () => {
  describe("when a known exercise id is provided", () => {
    it("returns the matching starter code for that exercise", () => {
      const starterCode = getJavaStarterCode("java-programming.exercise4");

      expect(starterCode).toContain("import java.util.Arrays;");
      expect(starterCode).toContain(
        "// TODO: sort the array in ascending order",
      );
    });

    it("returns the matching file name for that exercise", () => {
      expect(getJavaFileName("java-programming.exercise4")).toBe("Main.java");
    });
  });

  describe("when advanced browser-compatible exercises are registered", () => {
    it("provides beginner, intermediate, and advanced tasks with multiple checks", () => {
      expect(javaProgrammingExercises).toHaveLength(13);
      expect(
        [...javaProgrammingExercises]
          .map((exercise) => exercise.storageId)
          .sort((left, right) => left - right),
      ).toEqual(Array.from({ length: 13 }, (_, storageId) => storageId));
      expect(getJavaScenario("java-programming.exercise10")).toMatchObject({
        kind: "exercise",
        definition: { difficulty: "easy" },
      });
      expect(getJavaScenario("java-programming.exercise11")).toMatchObject({
        kind: "exercise",
        definition: { difficulty: "medium" },
      });

      for (const id of ["java-programming.exercise12", "java-programming.exercise13"]) {
        const scenario = getJavaScenario(id);
        expect(scenario).toMatchObject({
          kind: "exercise",
          definition: { difficulty: "hard" },
        });
        if (scenario?.kind === "exercise") {
          expect(scenario.validationCases.length).toBeGreaterThanOrEqual(2);
          expect(scenario.solutionCode).toContain("public class Main");
        }
      }
    });
  });

  describe("when no exercise id is provided", () => {
    it("falls back to the default starter code", () => {
      const starterCode = getJavaStarterCode();

      expect(starterCode).toContain(
        'System.out.println("Start coding in Java!");',
      );
    });

    it("falls back to the default file name", () => {
      expect(getJavaFileName()).toBe("Main.java");
    });
  });
});
