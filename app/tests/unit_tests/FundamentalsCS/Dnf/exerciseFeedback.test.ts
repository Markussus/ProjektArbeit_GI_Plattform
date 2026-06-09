import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";
import { checkDnfExerciseAttempt } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfExerciseCheck";
import { createTruthTableFromResults } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/truthTable";
import {
  buildFeedbackItems,
  buildFeedbackTip,
  isTruthTableReady,
} from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/presentation/exerciseFeedback";

const t = ((key: string) => key) as TFunction;
const table = createTruthTableFromResults(["a"], [false, true]);

describe("DNF exercise feedback", () => {
  it("defers DNF feedback until the truth table is complete", () => {
    const feedback = checkDnfExerciseAttempt(table, [], "a");

    expect(isTruthTableReady(feedback)).toBe(false);
    expect(buildFeedbackItems(feedback, table, true, t)).toEqual([
      "dnf.builder.exercise.tableIncomplete",
      "dnf.builder.exercise.dnfDeferredUntilTable",
    ]);
    expect(buildFeedbackTip(feedback, t)).toBe(
      "dnf.builder.exercise.tipCompleteTable",
    );
  });

  it("reports DNF syntax feedback after the truth table is ready", () => {
    const feedback = checkDnfExerciseAttempt(table, [false, true], "(");

    expect(isTruthTableReady(feedback)).toBe(true);
    expect(buildFeedbackItems(feedback, table, true, t)).toEqual([
      "dnf.builder.exercise.dnfSyntax",
    ]);
    expect(buildFeedbackTip(feedback, t)).toBe(
      "dnf.builder.exercise.tipSyntax",
    );
  });
});
