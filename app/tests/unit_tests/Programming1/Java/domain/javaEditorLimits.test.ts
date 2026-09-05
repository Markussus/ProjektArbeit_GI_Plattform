import { describe, expect, it } from "vitest";
import {
  getJavaEditorLimitReason,
  JAVA_EDITOR_MAX_CHARACTERS,
  JAVA_EDITOR_MAX_LINES,
  wouldPasteExceedJavaEditorLimit,
} from "@/pages/Programming1/Java/components/Simulator/domain/javaEditorLimits";

describe("Java editor limits", () => {
  it("accepts source at the line limit", () => {
    const sourceCode = "x\n".repeat(JAVA_EDITOR_MAX_LINES - 1);

    expect(getJavaEditorLimitReason(sourceCode)).toBeNull();
  });

  it("rejects source above the line limit", () => {
    const sourceCode = "x\n".repeat(JAVA_EDITOR_MAX_LINES);

    expect(getJavaEditorLimitReason(sourceCode)).toBe("lines");
  });

  it("rejects a single oversized line", () => {
    const sourceCode = "x".repeat(JAVA_EDITOR_MAX_CHARACTERS + 1);

    expect(getJavaEditorLimitReason(sourceCode)).toBe("characters");
  });

  it("accounts for replaced text when checking a paste", () => {
    expect(
      wouldPasteExceedJavaEditorLimit({
        currentCharacterCount: JAVA_EDITOR_MAX_CHARACTERS,
        currentLineCount: JAVA_EDITOR_MAX_LINES,
        selectedCharacterCount: 10,
        selectedLineBreakCount: 1,
        pastedText: "short\ntext",
      }),
    ).toBeNull();
  });

  it("blocks a paste that would exceed the line limit", () => {
    expect(
      wouldPasteExceedJavaEditorLimit({
        currentCharacterCount: 10,
        currentLineCount: JAVA_EDITOR_MAX_LINES,
        selectedCharacterCount: 0,
        selectedLineBreakCount: 0,
        pastedText: "\n",
      }),
    ).toBe("lines");
  });
});
