import { describe, expect, it } from "vitest";
import {
  parseFractionalInput,
  convertDecToBin,
  convertBinToDec,
  computeFractionalConversion,
} from "@/pages/FundamentalsCS/NumberSystems/components/simulator/fractionalConversion";

describe("fractionalConversion", () => {
  describe("parseFractionalInput", () => {
    it("returns null for empty input", () => {
      expect(parseFractionalInput("")).toBeNull();
    });

    it("returns null for minus-only input", () => {
      expect(parseFractionalInput("-")).toBeNull();
    });

    it("returns null for dot-only input", () => {
      expect(parseFractionalInput(".")).toBeNull();
    });

    it("parses a positive decimal number", () => {
      expect(parseFractionalInput("10.5")).toEqual({
        isNegative: false,
        intPartStr: "10",
        fracPartStr: "5",
      });
    });

    it("parses a negative decimal number", () => {
      expect(parseFractionalInput("-10.5")).toEqual({
        isNegative: true,
        intPartStr: "10",
        fracPartStr: "5",
      });
    });

    it("fills missing fractional part with '0'", () => {
      expect(parseFractionalInput("10")).toEqual({
        isNegative: false,
        intPartStr: "10",
        fracPartStr: "0",
      });
    });
  });

  describe("convertDecToBin", () => {
    it("converts 10.5 to 1010.1", () => {
      const result = convertDecToBin({
        isNegative: false,
        intPartStr: "10",
        fracPartStr: "5",
      });
      expect(result.binIntPart).toBe("1010");
      expect(result.binFracPart).toBe("1");
      expect(result.finalResult).toBe("1010.1");
    });

    it("converts negative -10.5 to -1010.1", () => {
      const result = convertDecToBin({
        isNegative: true,
        intPartStr: "10",
        fracPartStr: "5",
      });
      expect(result.finalResult).toBe("-1010.1");
      expect(result.isNegative).toBe(true);
    });

    it("handles zero integer part", () => {
      const result = convertDecToBin({
        isNegative: false,
        intPartStr: "0",
        fracPartStr: "5",
      });
      expect(result.binIntPart).toBe("0");
      expect(result.binFracPart).toBe("1");
      expect(result.finalResult).toBe("0.1");
    });

    it("handles zero fractional part", () => {
      const result = convertDecToBin({
        isNegative: false,
        intPartStr: "10",
        fracPartStr: "0",
      });
      expect(result.binFracPart).toBe("0");
      expect(result.finalResult).toBe("1010.0");
    });

    it("limits fractional steps to 10 digits", () => {
      const result = convertDecToBin({
        isNegative: false,
        intPartStr: "0",
        fracPartStr: "1",
      });
      expect(result.fracSteps.length).toBeLessThanOrEqual(10);
    });
  });

  describe("convertBinToDec", () => {
    it("converts 1010.1 to 10.5", () => {
      const result = convertBinToDec({
        isNegative: false,
        intPartStr: "1010",
        fracPartStr: "1",
      });
      expect(result.intDecVal).toBe(10);
      expect(result.fracDecVal).toBe(0.5);
      expect(result.totalDec).toBe(10.5);
      expect(result.finalResult).toBe("10.5");
    });

    it("converts negative -1010.1 to -10.5", () => {
      const result = convertBinToDec({
        isNegative: true,
        intPartStr: "1010",
        fracPartStr: "1",
      });
      expect(result.totalDec).toBe(10.5);
      expect(result.finalResult).toBe("-10.5");
    });

    it("converts 0.1 binary to 0.5 decimal", () => {
      const result = convertBinToDec({
        isNegative: false,
        intPartStr: "0",
        fracPartStr: "1",
      });
      expect(result.totalDec).toBe(0.5);
      expect(result.finalResult).toBe("0.5");
    });

    it("converts 0.0 binary to 0 decimal", () => {
      const result = convertBinToDec({
        isNegative: false,
        intPartStr: "0",
        fracPartStr: "0",
      });
      expect(result.totalDec).toBe(0);
      expect(result.finalResult).toBe("0");
    });

    it("collects only non-zero integer steps", () => {
      const result = convertBinToDec({
        isNegative: false,
        intPartStr: "1010",
        fracPartStr: "0",
      });
      expect(result.binIntSteps).toEqual([
        { bit: 1, pos: 3, powVal: 8 },
        { bit: 1, pos: 1, powVal: 2 },
      ]);
    });

    it("collects only non-zero fractional steps", () => {
      const result = convertBinToDec({
        isNegative: false,
        intPartStr: "0",
        fracPartStr: "101",
      });
      expect(result.binFracSteps).toEqual([
        { bit: 1, pos: -1, powVal: 0.5 },
        { bit: 1, pos: -3, powVal: 0.125 },
      ]);
    });
  });

  describe("computeFractionalConversion", () => {
    it("returns null for invalid input", () => {
      expect(computeFractionalConversion("", "decToBin")).toBeNull();
      expect(computeFractionalConversion("-", "decToBin")).toBeNull();
      expect(computeFractionalConversion(".", "binToDec")).toBeNull();
    });

    it("selects decToBin branch", () => {
      const result = computeFractionalConversion("10.5", "decToBin");
      expect(result).not.toBeNull();
      expect(result!.mode).toBe("decToBin");
      expect(result!.finalResult).toBe("1010.1");
    });

    it("selects binToDec branch", () => {
      const result = computeFractionalConversion("1010.1", "binToDec");
      expect(result).not.toBeNull();
      expect(result!.mode).toBe("binToDec");
      expect(result!.finalResult).toBe("10.5");
    });
  });
});
