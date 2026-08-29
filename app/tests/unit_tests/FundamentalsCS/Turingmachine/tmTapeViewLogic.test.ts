import { describe, expect, it } from "vitest";

import {
  buildTapeCells,
  getResponsiveWindowRadius,
  getTapeContentRange,
  getTapeRenderRange,
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
        minIndex: -1,
        maxIndex: 15,
      });
    });

    it("handles negative head position correctly", () => {
      expect(resolveTapeViewport(-10, 10, 5, 8)).toEqual({
        effectiveWindowRadius: 8,
        effectiveHeadWindowRadius: 5,
        minIndex: -13,
        maxIndex: 3,
      });
    });

    it("handles zero or negative window radius limits gracefully", () => {
      expect(resolveTapeViewport(0, 0, 0, 0)).toEqual({
        effectiveWindowRadius: 0,
        effectiveHeadWindowRadius: 0,
        minIndex: 0,
        maxIndex: 0,
      });
    });
  });

  describe("getTapeContentRange", () => {
    it("returns fallbackIndex when tape is empty or only contains blanks/empty strings", () => {
      expect(getTapeContentRange({}, "_", 0)).toEqual({
        minIndex: 0,
        maxIndex: 0,
      });

      expect(getTapeContentRange({ 0: "", 1: "_", 5: "_" }, "_", 3)).toEqual({
        minIndex: 3,
        maxIndex: 3,
      });
    });

    it("identifies min and max indices of non-blank symbols across positive and negative ranges", () => {
      expect(
        getTapeContentRange(
          {
            "-5": "1",
            "-2": "0",
            0: "_",
            4: "X",
            10: "_",
          },
          "_",
          0,
        ),
      ).toEqual({
        minIndex: -5,
        maxIndex: 4,
      });
    });
  });

  describe("getTapeRenderRange", () => {
    it("derives render range combining viewport and content boundaries with padding", () => {
      const result = getTapeRenderRange({
        viewportStartIndex: -5,
        viewportEndIndex: 5,
        contentRange: { minIndex: -10, maxIndex: 8 },
        paddingCells: 2,
      });

      expect(result).toEqual({
        minIndex: -12,
        maxIndex: 10,
      });
    });

    it("clamps negative padding cells to 0 and keeps viewport bounds if content is within viewport", () => {
      const result = getTapeRenderRange({
        viewportStartIndex: -10,
        viewportEndIndex: 10,
        contentRange: { minIndex: 0, maxIndex: 2 },
        paddingCells: -5,
      });

      expect(result).toEqual({
        minIndex: -10,
        maxIndex: 10,
      });
    });
  });

  describe("getTapeTransitionDurationMs", () => {
    it("disables short animations and clamps longer ones into the allowed range", () => {
      expect(getTapeTransitionDurationMs(100)).toBe(0);
      expect(getTapeTransitionDurationMs(140)).toBe(0);
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

    it("handles negative indices and null/undefined values correctly", () => {
      const cells = buildTapeCells(
        { "-2": "A", 0: null as unknown as string },
        -2,
        "_",
        -2,
        0,
      );

      expect(cells).toEqual([
        { index: -2, value: "A", isFocused: true },
        { index: -1, value: "_", isFocused: false },
        { index: 0, value: "_", isFocused: false },
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

    it("returns maxWindowRadius when cell dimensions are zero or negative", () => {
      expect(
        getResponsiveWindowRadius({
          viewportWidth: 120,
          baseWidthPx: 0,
          cellWidthPx: 0,
          cellPitchPx: 20,
          maxWindowRadius: 5,
        }),
      ).toBe(5);

      expect(
        getResponsiveWindowRadius({
          viewportWidth: 120,
          baseWidthPx: 0,
          cellWidthPx: 20,
          cellPitchPx: 0,
          maxWindowRadius: 5,
        }),
      ).toBe(5);
    });
  });

  describe("shouldAnimateTapeShift", () => {
    it("animates only single-cell shifts with a non-zero transition duration", () => {
      expect(shouldAnimateTapeShift(1, 200)).toBe(true);
      expect(shouldAnimateTapeShift(-1, 200)).toBe(true);
      expect(shouldAnimateTapeShift(0, 200)).toBe(false);
      expect(shouldAnimateTapeShift(2, 200)).toBe(false);
      expect(shouldAnimateTapeShift(-2, 200)).toBe(false);
      expect(shouldAnimateTapeShift(1, 0)).toBe(false);
    });
  });
});
