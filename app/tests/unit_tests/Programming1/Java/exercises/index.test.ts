import { describe, expect, it } from "vitest";
import {
  getJavaFileName,
  getJavaStarterCode,
} from "../../../../../src/pages/Programming1/Java/exercises";

describe("Java exercise lookup helpers", () => {
  describe("when a known exercise id is provided", () => {
    it("returns the matching starter code for that exercise", () => {
      const starterCode = getJavaStarterCode("java.exercise4");

      expect(starterCode).toContain("import java.util.Arrays;");
      expect(starterCode).toContain(
        "// TODO: sort the array in ascending order",
      );
    });

    it("returns the matching file name for that exercise", () => {
      expect(getJavaFileName("java.exercise4")).toBe("Main.java");
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
