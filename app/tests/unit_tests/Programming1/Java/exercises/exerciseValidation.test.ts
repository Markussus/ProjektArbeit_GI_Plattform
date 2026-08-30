import { describe, expect, it } from "vitest";
import { createExecutableSource } from "@/pages/Programming1/Java/components/Simulator/workers/javaRunnerHelpers";
import {
  getJavaDefaultStdin,
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
    expect(javaProgrammingExamples.length).toBe(4);
  });

  it("retrieves scenario by id correctly", () => {
    const exercise1 = getJavaScenario("java-programming.exercise1");
    expect(exercise1).toBeDefined();
    expect(exercise1?.kind).toBe("exercise");

    const example1 = getJavaScenario("java-programming.example1Title");
    expect(example1).toBeDefined();
    expect(example1?.kind).toBe("example");

    const example4 = getJavaScenario("java-programming.example4Title");
    expect(example4).toBeDefined();
    expect(example4?.kind).toBe("example");
    expect(example4?.code).toContain("Scanner");

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

  it("returns default stdin for exercises and examples with input", () => {
    expect(getJavaDefaultStdin("java-programming.example4Title")).toBe(
      "Ada Lovelace\n21\n",
    );
    expect(getJavaDefaultStdin("java-programming.exercise6")).toBe(
      "hello java\n",
    );
    expect(getJavaDefaultStdin("java-programming.exercise1")).toBe("");
    expect(getJavaDefaultStdin(null)).toBe("");
  });

  it("inlines example4 with Scanner properly into valid executable source", () => {
    const example4 = getJavaScenario("java-programming.example4Title");
    expect(example4).toBeDefined();
    const executable = createExecutableSource(
      example4!.code,
      example4?.defaultStdin,
    );
    expect(executable).not.toContain("import java.util.Scanner;");
    expect(executable).not.toContain(
      "Scanner scanner = new Scanner(System.in);",
    );
    expect(executable).toContain('String name = "Ada Lovelace";');
    expect(executable).toContain("int age = 21;");
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
