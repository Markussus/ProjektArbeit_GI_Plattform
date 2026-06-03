import { describe, expect, it } from "vitest";
import { numberSystemsExamples } from "../../../../../src/pages/FundamentalsCS/NumberSystems/examples";

describe("Number Systems examples", () => {
  describe("example definitions", () => {
    it("exports 13 examples", () => {
      expect(numberSystemsExamples).toHaveLength(13);
    });

    it("defines example_u03_1 for decimal-to-binary conversion", () => {
      const example = numberSystemsExamples.find(
        (ex) => ex.titleKey === "number.example_u03_1",
      );

      expect(example).toBeDefined();
      expect(example?.difficulty).toBe("easy");
    });

    it("defines example_u03_2 for binary addition", () => {
      const example = numberSystemsExamples.find(
        (ex) => ex.titleKey === "number.example_u03_2",
      );

      expect(example).toBeDefined();
      expect(example?.difficulty).toBe("easy");
    });

    it("defines four examples for unit 04 (conversions)", () => {
      const unit04Examples = numberSystemsExamples.filter((ex) =>
        ex.titleKey.includes("example_u04"),
      );

      expect(unit04Examples).toHaveLength(4);
    });

    it("defines four examples for unit 05 (fractional/IEEE754)", () => {
      const unit05Examples = numberSystemsExamples.filter((ex) =>
        ex.titleKey.includes("example_u05"),
      );

      expect(unit05Examples).toHaveLength(4);
    });

    it("defines three examples for unit 06 (arithmetic)", () => {
      const unit06Examples = numberSystemsExamples.filter((ex) =>
        ex.titleKey.includes("example_u06"),
      );

      expect(unit06Examples).toHaveLength(3);
    });

    it("defines example_u05_4 for IEEE754 decode", () => {
      const example = numberSystemsExamples.find(
        (ex) => ex.titleKey === "number.example_u05_4",
      );

      expect(example).toBeDefined();
      expect(example?.difficulty).toBe("easy");
    });

    it("defines example_u06_1_add for binary addition", () => {
      const example = numberSystemsExamples.find(
        (ex) => ex.titleKey === "number.example_u06_1_add",
      );

      expect(example).toBeDefined();
      expect(example?.difficulty).toBe("easy");
    });

    it("defines example_u06_1_sub for binary subtraction", () => {
      const example = numberSystemsExamples.find(
        (ex) => ex.titleKey === "number.example_u06_1_sub",
      );

      expect(example).toBeDefined();
      expect(example?.difficulty).toBe("easy");
    });

    it("defines example_u06_2 for binary multiplication", () => {
      const example = numberSystemsExamples.find(
        (ex) => ex.titleKey === "number.example_u06_2",
      );

      expect(example).toBeDefined();
      expect(example?.difficulty).toBe("easy");
    });

    it("all examples have a title key and description key", () => {
      for (const example of numberSystemsExamples) {
        expect(example.titleKey).toBeTruthy();
        expect(example.descriptionKey).toBeTruthy();
        expect(example.icon).toBeTruthy();
      }
    });

    it("all examples are easy difficulty", () => {
      for (const example of numberSystemsExamples) {
        expect(example.difficulty).toBe("easy");
      }
    });
  });

  describe("example grouping", () => {
    it("examples can be grouped by unit number from titleKey", () => {
      const groups: Record<string, typeof numberSystemsExamples> = {};
      for (const ex of numberSystemsExamples) {
        const match = ex.titleKey.match(/example_u(\d{2})/);
        if (match) {
          const group = match[1];
          if (!groups[group]) groups[group] = [];
          groups[group].push(ex);
        }
      }

      expect(Object.keys(groups)).toContain("03");
      expect(Object.keys(groups)).toContain("04");
      expect(Object.keys(groups)).toContain("05");
      expect(Object.keys(groups)).toContain("06");
    });
  });
});
