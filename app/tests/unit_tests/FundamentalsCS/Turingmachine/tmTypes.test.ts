import { describe, expect, it } from "vitest";

import {
  DEFAULT_BLANK_SYMBOL,
  isSingleTapeSymbol,
  normalizeTapeSymbolInput,
  parseTapeInput,
} from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmTypes";

describe("tmTypes", () => {
  describe("isSingleTapeSymbol", () => {
    // Tests that a plain one-character ASCII symbol is accepted as a valid tape symbol.
    it("returns true for a single ASCII character", () => {
      expect(isSingleTapeSymbol("a")).toBe(true);
    });

    // Tests that a single Unicode code point is treated as one tape symbol.
    it("returns true for a single Unicode symbol", () => {
      expect(isSingleTapeSymbol(DEFAULT_BLANK_SYMBOL)).toBe(true);
      expect(isSingleTapeSymbol("😀")).toBe(true);
    });

    // Tests the empty-string edge case, which must not count as a tape symbol.
    it("returns false for an empty string", () => {
      expect(isSingleTapeSymbol("")).toBe(false);
    });

    // Tests multi-code-point input, including composed-looking text, to ensure it is rejected.
    it("returns false for strings containing more than one code point", () => {
      expect(isSingleTapeSymbol("ab")).toBe(false);
      expect(isSingleTapeSymbol("é")).toBe(false);
    });
  });

  describe("blank symbol input alias", () => {
    // Tests that the keyboard-friendly blank alias is normalized before single-symbol validation.
    it("normalizes <> to the default blank symbol", () => {
      expect(normalizeTapeSymbolInput("<>")).toBe(DEFAULT_BLANK_SYMBOL);
      expect(normalizeTapeSymbolInput(" <> ")).toBe(DEFAULT_BLANK_SYMBOL);
    });

    // Tests that the tape input parser treats <> as one blank symbol instead of two characters.
    it("parses <> as a single blank tape symbol", () => {
      expect(parseTapeInput("0<>1")).toEqual(["0", DEFAULT_BLANK_SYMBOL, "1"]);
    });
  });
});
