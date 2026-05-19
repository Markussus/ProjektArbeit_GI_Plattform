import { describe, expect, it } from "vitest";

import {
  formatTMStateName,
  formatTMTransition,
} from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmFormatting";

describe("tmFormatting", () => {
  describe("formatTMStateName", () => {
    it("formats digits in state names as unicode subscripts", () => {
      expect(formatTMStateName("q10")).toBe("q\u2081\u2080");
      expect(formatTMStateName("halt")).toBe("halt");
    });
  });

  describe("formatTMTransition", () => {
    it("formats transitions with a formatted next state", () => {
      expect(
        formatTMTransition({
          nextState: "q10",
          writeSymbol: "1",
          movement: "L",
        }),
      ).toBe("(q\u2081\u2080, 1, L)");
    });

    it("returns an empty string for a missing transition", () => {
      expect(formatTMTransition()).toBe("");
      expect(formatTMTransition(null)).toBe("");
    });
  });
});
