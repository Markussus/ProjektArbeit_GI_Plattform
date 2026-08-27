import { describe, expect, it } from "vitest";
import { JAVA_COMPILER_CAPABILITIES } from "../../../../../src/pages/Programming1/Java/components/Simulator/domain/javaCompilerCapabilities";

describe("JAVA_COMPILER_CAPABILITIES", () => {
  it("advertises only the Scanner input calls implemented by the worker", () => {
    const inputCapability = JAVA_COMPILER_CAPABILITIES.find(
      ({ id }) => id === "input",
    );

    expect(inputCapability?.examples).toEqual([
      "Scanner.nextLine()",
      "Scanner.nextInt()",
    ]);
    expect(inputCapability?.examples.join(" ")).not.toContain("BufferedReader");
  });
});
