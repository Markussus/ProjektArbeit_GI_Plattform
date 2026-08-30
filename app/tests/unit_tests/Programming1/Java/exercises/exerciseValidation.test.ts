import { describe, expect, it } from "vitest";
import {
  getJavaFileName,
  getJavaScenario,
  getJavaStarterCode,
  javaProgrammingExerciseDefinitions,
  javaProgrammingExercises,
  javaProgrammingExamples,
} from "@/pages/Programming1/Java/exercises";

describe("Java Exercises & Definitions", () => {
  it("exports matching exercise definitions for all exercises", () => {
    expect(javaProgrammingExerciseDefinitions).toHaveLength(
      javaProgrammingExercises.length,
    );
    expect(javaProgrammingExercises.length).toBe(13);
  });

  it("exports all example definitions", () => {
    expect(javaProgrammingExamples.length).toBe(3);
  });

  it("retrieves scenario by id correctly", () => {
    const exercise1 = getJavaScenario("java-programming.exercise1");
    expect(exercise1).toBeDefined();
    expect(exercise1?.kind).toBe("exercise");

    const example1 = getJavaScenario("java-programming.example1Title");
    expect(example1).toBeDefined();
    expect(example1?.kind).toBe("example");

    const unknown = getJavaScenario("non-existent-scenario");
    expect(unknown).toBeNull();

    const empty = getJavaScenario(null);
    expect(empty).toBeNull();
  });

  it("returns starter code for exercises, examples, and fallback", () => {
    const exerciseCode = getJavaStarterCode("java-programming.exercise1");
    expect(exerciseCode).toContain("public class Main");

    const exampleCode = getJavaStarterCode("java-programming.example1Title");
    expect(exampleCode).toContain("Hello World");

    const defaultCode = getJavaStarterCode(null);
    expect(defaultCode).toContain("Start coding in Java!");
  });

  it("returns file name for given items", () => {
    expect(getJavaFileName("java-programming.exercise1")).toBe("Main.java");
    expect(getJavaFileName(null)).toBe("Main.java");
  });

  describe("Validation Cases and Source Transforms for each Exercise", () => {
    for (const exercise of javaProgrammingExercises) {
      describe(`Exercise: ${exercise.id}`, () => {
        it("has valid starter code and solution code", () => {
          expect(exercise.starterCode).toBeTruthy();
          expect(exercise.solutionCode).toBeTruthy();
          expect(exercise.validationCases.length).toBeGreaterThan(0);
        });

        for (const validationCase of exercise.validationCases) {
          it(`executes validation case: ${validationCase.id}`, () => {
            if (validationCase.sourceTransform) {
              const transformed = validationCase.sourceTransform(
                exercise.solutionCode,
              );
              expect(transformed).toBeTruthy();
              expect(transformed).not.toBe(exercise.solutionCode);
            }

            expect(validationCase.expectedStdout).toBeTruthy();
          });
        }
      });
    }
  });
});
