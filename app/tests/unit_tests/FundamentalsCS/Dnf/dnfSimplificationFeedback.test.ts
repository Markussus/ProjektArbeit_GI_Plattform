import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";
import {
  buildSimplificationDetail,
  getSimplificationStatusTone,
} from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/presentation/dnfSimplificationFeedback";
import type { DnfSimplificationCheckResult } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfSimplificationCheck";

const mockT = ((key: string, options?: Record<string, unknown>) => {
  if (options) {
    return `${key}:${JSON.stringify(options)}`;
  }
  return key;
}) as unknown as TFunction;

describe("dnfSimplificationFeedback", () => {
  describe("buildSimplificationDetail", () => {
    it("handles empty feedback", () => {
      const result: DnfSimplificationCheckResult = { status: "empty" };
      expect(buildSimplificationDetail(result, mockT)).toBe(
        "dnf.builder.exercise.simplificationDetail.empty",
      );
    });

    it("handles syntax_error feedback", () => {
      const result: DnfSimplificationCheckResult = {
        status: "syntax_error",
        error: "invalid syntax",
      };
      expect(buildSimplificationDetail(result, mockT)).toBe(
        "dnf.builder.exercise.simplificationDetail.syntax_error",
      );
    });

    it("handles unknown_variable feedback", () => {
      const result: DnfSimplificationCheckResult = {
        status: "unknown_variable",
        unknownVariables: ["x", "y"],
      };
      expect(buildSimplificationDetail(result, mockT)).toContain("x, y");
    });

    it("handles not_equivalent feedback", () => {
      const result: DnfSimplificationCheckResult = { status: "not_equivalent" };
      expect(buildSimplificationDetail(result, mockT)).toBe(
        "dnf.builder.exercise.simplificationDetail.not_equivalent",
      );
    });

    it("handles equivalent_not_shorter feedback", () => {
      const result: DnfSimplificationCheckResult = {
        status: "equivalent_not_shorter",
        userLiteralCount: 4,
        canonicalLiteralCount: 4,
      };
      expect(buildSimplificationDetail(result, mockT)).toContain("4");
    });

    it("handles accepted_not_minimal feedback", () => {
      const result: DnfSimplificationCheckResult = {
        status: "accepted_not_minimal",
        userLiteralCount: 3,
        canonicalLiteralCount: 4,
        acceptedMinimumLiteralCount: 2,
      };
      expect(buildSimplificationDetail(result, mockT)).toContain(
        "accepted_not_minimal",
      );
    });

    it("handles accepted_minimal feedback", () => {
      const result: DnfSimplificationCheckResult = {
        status: "accepted_minimal",
        userLiteralCount: 2,
        canonicalLiteralCount: 4,
        acceptedMinimumLiteralCount: 2,
      };
      expect(buildSimplificationDetail(result, mockT)).toContain(
        "accepted_minimal",
      );
    });
  });

  describe("getSimplificationStatusTone", () => {
    it("returns correct tone for minimal", () => {
      const tone = getSimplificationStatusTone("accepted_minimal");
      expect(tone.containerClass).toContain("emerald");
    });

    it("returns correct tone for not minimal", () => {
      const tone = getSimplificationStatusTone("accepted_not_minimal");
      expect(tone.containerClass).toContain("amber");
    });

    it("returns default tone for errors and undefined", () => {
      const tone = getSimplificationStatusTone("syntax_error");
      expect(tone.containerClass).toContain("border-border");
      const defTone = getSimplificationStatusTone(undefined);
      expect(defTone.containerClass).toContain("border-border");
    });
  });
});
