import { describe, expect, it } from "vitest";
import { JAVA_COMPILER_CAPABILITIES } from "../../../../../src/pages/Programming1/Java/components/Simulator/domain/javaCompilerCapabilities";

describe("JAVA_COMPILER_CAPABILITIES", () => {
  it("advertises only the Scanner input calls implemented by the worker", () => {
    const inputCapability = JAVA_COMPILER_CAPABILITIES.find(
      ({ id }) => id === "input",
    );

    expect(inputCapability?.examples).toEqual([
      "import java.util.Scanner;",
      "Scanner sc = new Scanner(System.in);",
      "sc.nextLine()",
      "sc.next()",
      "sc.nextInt()",
      "sc.nextDouble()",
      "sc.nextBoolean()",
    ]);
    expect(inputCapability?.examples.join(" ")).not.toContain("BufferedReader");
  });
});
