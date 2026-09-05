import { describe, expect, it } from "vitest";
import {
  bitsNeeded,
  bitsToNumber,
  createNextInputSymbol,
  createNextStateName,
  createVariableNames,
  formatInternalNumber,
  hasUniqueNonEmptyValues,
  parseInternalNumber,
  toBits,
} from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/programCommon";

describe("programCommon domain utilities", () => {
  describe("createNextStateName", () => {
    it("generates STATE_0 for empty list", () => {
      expect(createNextStateName([])).toBe("STATE_0");
    });

    it("generates next sequential state name", () => {
      expect(createNextStateName(["STATE_0", "STATE_1"])).toBe("STATE_2");
      expect(createNextStateName(["S0", "STATE_0"])).toBe("STATE_2");
    });
  });

  describe("createNextInputSymbol", () => {
    it("generates binary digits '0', '1', '10', etc.", () => {
      expect(createNextInputSymbol([])).toBe("0");
      expect(createNextInputSymbol(["0"])).toBe("1");
      expect(createNextInputSymbol(["0", "1"])).toBe("10");
    });
  });

  describe("bit operations", () => {
    it("computes bitsNeeded correctly", () => {
      expect(bitsNeeded(1)).toBe(1);
      expect(bitsNeeded(2)).toBe(1);
      expect(bitsNeeded(3)).toBe(2);
      expect(bitsNeeded(4)).toBe(2);
      expect(bitsNeeded(5)).toBe(3);
      expect(bitsNeeded(8)).toBe(3);
      expect(bitsNeeded(9)).toBe(4);
    });

    it("converts numbers to bit arrays", () => {
      expect(toBits(0, 3)).toEqual([0, 0, 0]);
      expect(toBits(5, 3)).toEqual([1, 0, 1]);
      expect(toBits(3, 4)).toEqual([0, 0, 1, 1]);
    });

    it("converts bit arrays back to numbers", () => {
      expect(bitsToNumber([0, 0, 0])).toBe(0);
      expect(bitsToNumber([1, 0, 1])).toBe(5);
      expect(bitsToNumber([0, 0, 1, 1])).toBe(3);
    });

    it("generates variable names", () => {
      expect(createVariableNames("s", 3)).toEqual(["s0", "s1", "s2"]);
      expect(createVariableNames("e", 1)).toEqual(["e0"]);
    });
  });

  describe("number formatting and parsing", () => {
    it("formats internal numbers in decimal and binary", () => {
      expect(formatInternalNumber(5, "decimal")).toBe("5");
      expect(formatInternalNumber(5, "binary")).toBe("101");
      expect(formatInternalNumber(0, "binary")).toBe("0");
    });

    it("parses valid decimal and binary inputs", () => {
      expect(parseInternalNumber("42", "decimal")).toBe(42);
      expect(parseInternalNumber("1010", "binary")).toBe(10);
      expect(parseInternalNumber("0", "binary")).toBe(0);
    });

    it("returns null for invalid inputs", () => {
      expect(parseInternalNumber("", "decimal")).toBeNull();
      expect(parseInternalNumber("abc", "decimal")).toBeNull();
      expect(parseInternalNumber("-5", "decimal")).toBeNull();
      expect(parseInternalNumber("102", "binary")).toBeNull();
    });
  });

  describe("hasUniqueNonEmptyValues", () => {
    it("returns true for unique non-empty strings", () => {
      expect(hasUniqueNonEmptyValues(["a", "b", "c"])).toBe(true);
      expect(hasUniqueNonEmptyValues([])).toBe(true);
    });

    it("returns false for duplicates or empty strings", () => {
      expect(hasUniqueNonEmptyValues(["a", "b", "a"])).toBe(false);
      expect(hasUniqueNonEmptyValues(["a", "   "])).toBe(false);
      expect(hasUniqueNonEmptyValues([""])).toBe(false);
    });
  });
});
