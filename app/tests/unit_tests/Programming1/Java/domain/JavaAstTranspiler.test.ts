import { describe, expect, it } from "vitest";
import { transpileJava } from "../../../../../src/pages/Programming1/Java/components/Simulator/domain/JavaAstTranspiler";
import { disinfectJavaSource } from "../../../../../src/pages/Programming1/Java/components/Simulator/domain/disinfectJavaSource";

describe("Java AST transpiler", () => {
  it("keeps disinfect as a pass-through step", () => {
    const source = `public class Main {\n  public static void main(String[] args) {}\n}`;
    const result = disinfectJavaSource(source);

    expect(result.sanitizedSource).toBe(source);
    expect(result.issues).toEqual([]);
  });

  it("transpiles println and array helpers for the exercise subset", () => {
    const result = transpileJava(`import java.util.Arrays;

public class Main {
  public static void main(String[] args) {
    int[] numbers = {5, 2, 9, 1, 4};
    Arrays.sort(numbers);
    System.out.println(Arrays.toString(numbers));
  }
}
`);

    expect(result.diagnostics).toEqual([]);
    expect(result.javascript).toContain("let numbers = [5, 2, 9, 1, 4];");
    expect(result.javascript).toContain("runtime.javaArrays.sort(numbers);");
    expect(result.javascript).toContain(
      "runtime.println(runtime.javaArrays.toString(numbers));",
    );
  });

  it("reports a blocking diagnostic when no main method exists", () => {
    const result = transpileJava("public class Main {}");

    expect(result.javascript).toBe("");
    expect(result.diagnostics[0]?.code).toBe("main_method_missing");
  });

  it("reports a parse error for invalid Java syntax", () => {
    const result = transpileJava("this is not java at all !!!{{{");

    expect(result.javascript).toBe("");
    expect(result.diagnostics[0]?.code).toBe("parse_error");
  });

  it("reports an error for unsupported Scanner usage", () => {
    const result = transpileJava(`public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
  }
}`);

    expect(result.javascript).toBe("");
    expect(
      result.diagnostics.some((d) => d.code === "scanner_not_supported"),
    ).toBe(true);
  });

  it("transpiles enhanced for-loop correctly", () => {
    const result = transpileJava(`public class Main {
  public static void main(String[] args) {
    int[] nums = {1, 2, 3};
    for (int n : nums) {
      System.out.println(n);
    }
  }
}`);

    expect(result.diagnostics).toEqual([]);
    expect(result.javascript).toContain("for (const n of nums)");
    expect(result.javascript).toContain("runtime.println(n)");
  });
});
