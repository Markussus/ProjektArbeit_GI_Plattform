import { describe, expect, it } from "vitest";

import {
  buildTapeCells,
  getResponsiveWindowRadius,
  getTapeTransitionDurationMs,
  resolveTapeViewport,
  shouldAnimateTapeShift,
} from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/presentation/tmTapeViewLogic";

describe("tmTapeViewLayout", () => {
  describe("resolveTapeViewport", () => {
    it("keeps the head near the center while respecting both radius limits", () => {
      expect(resolveTapeViewport(12, 10, 5, 8)).toEqual({
        effectiveWindowRadius: 8,
        effectiveHeadWindowRadius: 5,
        startIndex: -1,
        endIndex: 15,
      });
    });
  });

  describe("getTapeTransitionDurationMs", () => {
    it("disables short animations and clamps longer ones into the allowed range", () => {
      expect(getTapeTransitionDurationMs(100)).toBe(0);
      expect(getTapeTransitionDurationMs(300)).toBe(180);
      expect(getTapeTransitionDurationMs(2000)).toBe(600);
    });
  });

  describe("buildTapeCells", () => {
    it("builds focused cells and falls back to the blank symbol for empty slots", () => {
      expect(buildTapeCells({ 0: "1", 2: "" }, 1, "_", 0, 2)).toEqual([
        { index: 0, value: "1", isFocused: false },
        { index: 1, value: "_", isFocused: true },
        { index: 2, value: "_", isFocused: false },
      ]);
    });
  });

  describe("getResponsiveWindowRadius", () => {
    it("derives the largest radius that still fits the viewport", () => {
      expect(
        getResponsiveWindowRadius({
          viewportWidth: 120,
          baseWidthPx: 0,
          cellWidthPx: 20,
          cellPitchPx: 20,
          maxWindowRadius: 10,
        }),
      ).toBe(2);
    });
  });

  describe("shouldAnimateTapeShift", () => {
    it("animates only single-cell shifts with a non-zero transition duration", () => {
      expect(shouldAnimateTapeShift(1, 200)).toBe(true);
      expect(shouldAnimateTapeShift(0, 200)).toBe(false);
      expect(shouldAnimateTapeShift(2, 200)).toBe(false);
      expect(shouldAnimateTapeShift(1, 0)).toBe(false);
    });
  });
});
