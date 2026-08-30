import { describe, expect, it } from "vitest";
import {
  buildWorkerErrorFromEvent,
  createExecutableSource,
  createJavaStringLiteral,
  createWorkerError,
  getErrorMessage,
  inferCompilationCategory,
  inferCompilationMessage,
  inlineScannerInput,
  mapDiagnostic,
  normalizeWorkerError,
  ScannerInputCursor,
  type UpstreamWorkerMessage,
} from "@/pages/Programming1/Java/components/Simulator/workers/javaRunnerHelpers";

describe("javaRunnerHelpers", () => {
  describe("ScannerInputCursor", () => {
    it("reads lines and tokens sequentially", () => {
      const cursor = new ScannerInputCursor("Ada Lovelace\n21\n");
      expect(cursor.nextLine()).toBe("Ada Lovelace");
      expect(cursor.nextInt()).toBe(21);
      expect(cursor.nextLine()).toBe("");
    });

    it("reads tokens with whitespace skipping", () => {
      const cursor = new ScannerInputCursor("   foo   bar   42   3.14   true   ");
      expect(cursor.nextToken()).toBe("foo");
      expect(cursor.nextToken()).toBe("bar");
      expect(cursor.nextInt()).toBe(42);
      expect(cursor.nextDouble()).toBe(3.14);
      expect(cursor.nextBoolean()).toBe(true);
    });
  });

  describe("createJavaStringLiteral", () => {
    it("escapes special characters correctly", () => {
      expect(createJavaStringLiteral("Hello World")).toBe('"Hello World"');
      expect(createJavaStringLiteral('Hello "World"')).toBe(
        '"Hello \\"World\\""',
      );
      expect(createJavaStringLiteral("Line 1\nLine 2")).toBe(
        '"Line 1\\nLine 2"',
      );
      expect(createJavaStringLiteral("Tab\tValue")).toBe('"Tab\\tValue"');
      expect(createJavaStringLiteral("CR\rValue")).toBe('"CR\\rValue"');
      expect(createJavaStringLiteral("Backslash\\Value")).toBe(
        '"Backslash\\\\Value"',
      );
    });
  });

  describe("inlineScannerInput and createExecutableSource", () => {
    it("returns unmodified sourceCode if no stdin is provided", () => {
      const code =
        "public class Main { public static void main(String[] args) {} }";
      expect(createExecutableSource(code)).toBe(code);
      expect(createExecutableSource(code, "")).toBe(code);
    });

    it("inlines Scanner nextLine() calls with String literals and strips Scanner declaration", () => {
      const code = `import java.util.Scanner;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String line1 = sc.nextLine();\n    String line2 = sc.nextLine();\n  }\n}`;
      const stdin = "First Line\nSecond Line";
      const result = inlineScannerInput(code, stdin);

      expect(result).not.toContain("import java.util.Scanner;");
      expect(result).not.toContain("Scanner sc = new Scanner(System.in);");
      expect(result).toContain('String line1 = "First Line";');
      expect(result).toContain('String line2 = "Second Line";');
    });

    it("inlines Scanner nextInt() calls with integer constants", () => {
      const code = `import java.util.Scanner;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    int a = scanner.nextInt();\n    int b = scanner.nextInt();\n  }\n}`;
      const stdin = "42 99";
      const result = inlineScannerInput(code, stdin);

      expect(result).not.toContain("import java.util.Scanner;");
      expect(result).not.toContain("Scanner scanner = new Scanner(System.in);");
      expect(result).toContain("int a = 42;");
      expect(result).toContain("int b = 99;");
    });

    it("handles mixed nextLine() and nextInt() in sequence (Example 4 scenario)", () => {
      const code = `import java.util.Scanner;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    String name = scanner.nextLine();\n    int age = scanner.nextInt();\n\n    System.out.println("Hallo " + name + "! In 10 Jahren bist du " + (age + 10) + " Jahre alt.");\n  }\n}`;
      const stdin = "Ada Lovelace\n21\n";
      const result = inlineScannerInput(code, stdin);

      expect(result).not.toContain("import java.util.Scanner;");
      expect(result).not.toContain("Scanner scanner = new Scanner(System.in);");
      expect(result).toContain('String name = "Ada Lovelace";');
      expect(result).toContain("int age = 21;");
    });

    it("handles next(), nextDouble(), and nextBoolean() calls", () => {
      const code = `String word = sc.next();\ndouble price = sc.nextDouble();\nboolean flag = sc.nextBoolean();`;
      const stdin = "test 19.99 true";
      const result = inlineScannerInput(code, stdin);

      expect(result).toContain('String word = "test";');
      expect(result).toContain("double price = 19.99;");
      expect(result).toContain("boolean flag = true;");
    });

    it("handles fallback to default values when stdin is exhausted or empty", () => {
      const code = `String line = sc.nextLine();\nint num = sc.nextInt();`;
      const result = inlineScannerInput(code, "");

      expect(result).toContain('String line = "";');
      expect(result).toContain("int num = 0;");
    });
  });

  describe("mapDiagnostic", () => {
    it("maps javac compiler diagnostic message", () => {
      const message: UpstreamWorkerMessage = {
        command: "compiler-diagnostic",
        message: "Cannot find symbol",
        lineNumber: 10,
        columnNumber: 5,
        fileName: "Main.java",
        severity: "error",
      };

      const issue = mapDiagnostic(message);
      expect(issue.code).toBe("javac_diagnostic");
      expect(issue.stage).toBe("javac");
      expect(issue.severity).toBe("error");
      expect(issue.line).toBe(10);
      expect(issue.column).toBe(5);
      expect(issue.message).toBe("Cannot find symbol");
    });

    it("maps teavm diagnostic message and handles default severity and message", () => {
      const message: UpstreamWorkerMessage = {
        command: "diagnostic",
        severity: "other",
      };

      const issue = mapDiagnostic(message);
      expect(issue.code).toBe("teavm_diagnostic");
      expect(issue.stage).toBe("teavm");
      expect(issue.severity).toBe("info");
      expect(issue.message).toBe("Unknown compiler diagnostic");
    });
  });

  describe("createWorkerError and normalizeWorkerError", () => {
    it("creates and normalizes custom worker error", () => {
      const error = createWorkerError("javac", "Compilation failed", [
        {
          code: "javac_error",
          stage: "javac",
          severity: "error",
          message: "Syntax error",
        },
      ]);

      expect(error.__javaWorkerError).toBe(true);
      const normalized = normalizeWorkerError(error);
      expect(normalized.errorCategory).toBe("javac");
      expect(normalized.message).toBe("Compilation failed");
      expect(normalized.diagnostics).toHaveLength(1);
    });

    it("normalizes standard Error objects and primitives", () => {
      const errorObj = new Error("Standard error occurred");
      const normalizedObj = normalizeWorkerError(errorObj);
      expect(normalizedObj.errorCategory).toBe("unknown");
      expect(normalizedObj.message).toBe("Standard error occurred");

      const stringError = "Something failed";
      const normalizedStr = normalizeWorkerError(stringError);
      expect(normalizedStr.message).toBe("Something failed");
    });
  });

  describe("buildWorkerErrorFromEvent", () => {
    it("builds error when compiler was already ready", () => {
      const event = new ErrorEvent("error", { message: "Out of memory" });
      const error = buildWorkerErrorFromEvent(event, true);
      expect(error.errorCategory).toBe("teavm");
      expect(error.message).toContain("WebAssembly generation failed");
    });

    it("builds error when compiler was not yet ready", () => {
      const event = new ErrorEvent("error", { message: "Network error" });
      const error = buildWorkerErrorFromEvent(event, false);
      expect(error.errorCategory).toBe("compiler-load");
      expect(error.message).toContain("Compiler could not be loaded");
    });
  });

  describe("getErrorMessage", () => {
    it("extracts error message correctly", () => {
      expect(getErrorMessage(new Error("Foo"))).toBe("Foo");
      expect(getErrorMessage("Direct string")).toBe("Direct string");
      expect(getErrorMessage(1234)).toBe("1234");
    });
  });

  describe("inferCompilationCategory and inferCompilationMessage", () => {
    it("identifies teavm vs javac errors", () => {
      const javacIssues = [
        {
          code: "javac_1",
          stage: "javac" as const,
          severity: "error" as const,
          message: "Javac Error",
        },
      ];
      expect(inferCompilationCategory(javacIssues)).toBe("javac");
      expect(inferCompilationMessage(javacIssues)).toBe(
        "Java compilation failed.",
      );

      const teavmIssues = [
        {
          code: "teavm_1",
          stage: "teavm" as const,
          severity: "error" as const,
          message: "TeaVM Error",
        },
      ];
      expect(inferCompilationCategory(teavmIssues)).toBe("teavm");
      expect(inferCompilationMessage(teavmIssues)).toBe(
        "WebAssembly generation failed.",
      );
    });
  });
});
