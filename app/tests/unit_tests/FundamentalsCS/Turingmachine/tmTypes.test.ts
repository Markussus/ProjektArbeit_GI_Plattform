import { describe, expect, it } from "vitest";

import {
  DEFAULT_BLANK_SYMBOL,
  isSingleTapeSymbol,
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
});
