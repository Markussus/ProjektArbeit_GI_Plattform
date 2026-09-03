import { describe, expect, it } from "vitest";
import { buildDnfResetValue } from "../../../../src/pages/FundamentalsCS/Dnf/components/dnfSimulatorReset";
import type { DnfTransferValue } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfTransfer";
import { dnfWalkthroughExamples } from "../../../../src/pages/FundamentalsCS/Dnf/examples/walkthroughExamples";

describe("dnfSimulatorReset", () => {
  describe("buildDnfResetValue routing", () => {
    it("returns exercise_attempt draft if hasSelectedExercise is true", () => {
      const result = buildDnfResetValue({
        hasSelectedExercise: true,
        storedValue: null,
        visibleMode: "expression_to_truth_table",
        walkthroughExample: null,
      });
      expect(result).toEqual({
        mode: "exercise_attempt",
        truthTableAnswers: [],
        dnfAnswer: "",
        simplificationAnswer: "",
      });
    });

    it("returns null when visibleMode is expression_to_truth_table and not committed / no example", () => {
      const result = buildDnfResetValue({
        hasSelectedExercise: false,
        storedValue: null,
        visibleMode: "expression_to_truth_table",
        walkthroughExample: null,
      });
      expect(result).toBeNull();
    });

    it("resets with walkthrough example if provided in expression mode", () => {
      const example = dnfWalkthroughExamples.find(
        (ex) => ex.mode === "expression_to_truth_table",
      )!;
      const result = buildDnfResetValue({
        hasSelectedExercise: false,
        storedValue: null,
        visibleMode: "expression_to_truth_table",
        walkthroughExample: example,
      });
      expect(result?.mode).toBe("expression_to_truth_table");
      if (result?.mode === "expression_to_truth_table") {
        expect(result.expression).toBe(example.expression);
        expect(result.committed).toBe(true);
      }
    });

    it("retains committed expression on reset in expression mode", () => {
      const stored: DnfTransferValue = {
        mode: "expression_to_truth_table",
        expression: "a | b",
        committed: true,
        truthTableAnswers: [],
        dnfAnswer: "something",
        simplificationAnswer: "",
      };
      const result = buildDnfResetValue({
        hasSelectedExercise: false,
        storedValue: stored,
        visibleMode: "expression_to_truth_table",
        walkthroughExample: null,
      });
      expect(result?.mode).toBe("expression_to_truth_table");
      if (result?.mode === "expression_to_truth_table") {
        expect(result.expression).toBe("a | b");
        expect(result.committed).toBe(true);
        expect(result.dnfAnswer).toBe("");
      }
    });
  });

  describe("truth_table_to_dnf mode", () => {
    it("returns default truth table reset value when no stored state", () => {
      const result = buildDnfResetValue({
        hasSelectedExercise: false,
        storedValue: null,
        visibleMode: "truth_table_to_dnf",
        walkthroughExample: null,
      });
      expect(result?.mode).toBe("truth_table_to_dnf");
      if (result?.mode === "truth_table_to_dnf") {
        expect(result.variableCount).toBe(3);
        expect(result.resultValues).toEqual(new Array(8).fill(false));
        expect(result.committed).toBe(false);
      }
    });

    it("resets with walkthrough example if provided in truth table mode", () => {
      const example = dnfWalkthroughExamples.find(
        (ex) => ex.mode === "truth_table_to_dnf",
      )!;
      const result = buildDnfResetValue({
        hasSelectedExercise: false,
        storedValue: null,
        visibleMode: "truth_table_to_dnf",
        walkthroughExample: example,
      });
      expect(result?.mode).toBe("truth_table_to_dnf");
      if (result?.mode === "truth_table_to_dnf") {
        expect(result.variableCount).toBe(example.variables.length);
        expect(result.resultValues).toEqual(example.resultValues);
        expect(result.committed).toBe(true);
      }
    });

    it("preserves committed resultValues when resetting committed state", () => {
      const stored: DnfTransferValue = {
        mode: "truth_table_to_dnf",
        variableCount: 2,
        resultValues: [true, false, true, false],
        committed: true,
        truthTableAnswers: [],
        dnfAnswer: "a & b",
        simplificationAnswer: "a",
      };
      const result = buildDnfResetValue({
        hasSelectedExercise: false,
        storedValue: stored,
        visibleMode: "truth_table_to_dnf",
        walkthroughExample: null,
      });
      expect(result?.mode).toBe("truth_table_to_dnf");
      if (result?.mode === "truth_table_to_dnf") {
        expect(result.committed).toBe(true);
        expect(result.resultValues).toEqual([true, false, true, false]);
        expect(result.dnfAnswer).toBe("");
        expect(result.simplificationAnswer).toBe("");
      }
    });

    it("resets uncommitted state to default empty table", () => {
      const stored: DnfTransferValue = {
        mode: "truth_table_to_dnf",
        variableCount: 2,
        resultValues: [true, false, true, false],
        committed: false,
        truthTableAnswers: [],
        dnfAnswer: "",
        simplificationAnswer: "",
      };
      const result = buildDnfResetValue({
        hasSelectedExercise: false,
        storedValue: stored,
        visibleMode: "truth_table_to_dnf",
        walkthroughExample: null,
      });
      expect(result?.mode).toBe("truth_table_to_dnf");
      if (result?.mode === "truth_table_to_dnf") {
        expect(result.committed).toBe(false);
        expect(result.variableCount).toBe(2);
        expect(result.resultValues).toEqual(new Array(4).fill(false));
      }
    });
  });
});
