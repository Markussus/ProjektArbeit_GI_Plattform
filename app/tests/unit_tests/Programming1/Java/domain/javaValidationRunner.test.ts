import { describe, expect, it, vi } from "vitest";
import {
  normalizeOutput,
  runExerciseValidation,
} from "@/pages/Programming1/Java/components/Simulator/domain/javaValidationRunner";
import type { JavaExerciseScenario } from "@/pages/Programming1/Java/exercises";

describe("javaValidationRunner", () => {
  describe("normalizeOutput", () => {
    it("normalizes CRLF to LF and trims trailing whitespace", () => {
      expect(normalizeOutput("hello\r\nworld\r\n  ")).toBe("hello\nworld");
      expect(normalizeOutput("test\n\n")).toBe("test");
    });
  });

  describe("runExerciseValidation", () => {
    it("returns error when exerciseScenario is null", async () => {
      const runAsync = vi.fn();
      const result = await runExerciseValidation({
        exerciseScenario: null,
        code: "public class Main {}",
        standardInput: "",
        timeoutSeconds: 30,
        runAsync,
        exampleCheckUnavailableError: "Check unavailable for examples",
      });

      expect(result.rows).toHaveLength(0);
      expect(result.error).toBe("Check unavailable for examples");
      expect(runAsync).not.toHaveBeenCalled();
    });

    it("evaluates validation cases correctly when run succeeds", async () => {
      const mockScenario: JavaExerciseScenario = {
        kind: "exercise",
        id: "java-programming.exercise1",
        storageId: 0,
        titleKey: "java-programming.exercise1",
        descriptionKey: "java-programming.exercise1Desc",
        fileName: "Main.java",
        starterCode: "",
        solutionCode: "",
        code: "",
        definition: {
          titleKey: "java-programming.exercise1",
          descriptionKey: "java-programming.exercise1Desc",
          difficulty: "easy",
          icon: () => null,
        },
        validationCases: [
          {
            id: "case-1",
            expectedStdout: "Hello\n",
          },
          {
            id: "case-2",
            sourceTransform: (src) => `${src} // transformed`,
            stdin: "input-val",
            expectedStdout: "Transformed Hello\n",
          },
        ],
      };

      const runAsync = vi
        .fn()
        .mockResolvedValueOnce({
          phase: "done",
          stdout: ["Hello\n"],
          stderr: [],
          compilerStatus: "ready",
          issues: [],
          artifacts: null,
        })
        .mockResolvedValueOnce({
          phase: "done",
          stdout: ["Wrong Output\n"],
          stderr: [],
          compilerStatus: "ready",
          issues: [],
          artifacts: null,
        });

      const result = await runExerciseValidation({
        exerciseScenario: mockScenario,
        code: "public class Main {}",
        standardInput: "default-stdin",
        timeoutSeconds: 15,
        runAsync,
        exampleCheckUnavailableError: "Unavailable",
      });

      expect(result.error).toBeUndefined();
      expect(result.rows).toHaveLength(2);

      expect(result.rows[0]?.id).toBe("case-1");
      expect(result.rows[0]?.passed).toBe(true);
      expect(result.rows[0]?.output).toBe("Hello\n");

      expect(result.rows[1]?.id).toBe("case-2");
      expect(result.rows[1]?.passed).toBe(false);
      expect(result.rows[1]?.output).toBe("Wrong Output\n");

      expect(runAsync).toHaveBeenCalledTimes(2);
      expect(runAsync).toHaveBeenNthCalledWith(1, {
        source: "public class Main {}",
        exerciseId: "java-programming.exercise1",
        timeoutMs: 15000,
        stdin: "default-stdin",
      });
      expect(runAsync).toHaveBeenNthCalledWith(2, {
        source: "public class Main {} // transformed",
        exerciseId: "java-programming.exercise1",
        timeoutMs: 15000,
        stdin: "input-val",
      });
    });
  });
});
