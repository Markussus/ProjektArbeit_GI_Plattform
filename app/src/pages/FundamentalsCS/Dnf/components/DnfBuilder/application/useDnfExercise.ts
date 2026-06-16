import { useMemo, useState } from "react";
import { normalizeBooleanOperatorAliases } from "../domain/booleanSyntax";
import {
  checkDnfExerciseAttempt,
  type DnfExerciseCheckResult,
  type TruthTableAnswer,
} from "../domain/dnfExerciseCheck";
import type { DnfBuilderAnalysis } from "./dnfAnalysis";
import type { DnfExerciseTransferDraft } from "../domain/dnfTransfer";
import { useDnfSimplification } from "./useDnfSimplification";

interface UseDnfExerciseParams {
  analysis: DnfBuilderAnalysis;
  isExerciseMode: boolean;
  requiresTruthTableAnswers: boolean;
  initialAttempt?: DnfExerciseTransferDraft;
}

export function useDnfExercise({
  analysis,
  isExerciseMode,
  requiresTruthTableAnswers,
  initialAttempt,
}: UseDnfExerciseParams) {
  const [showSolution, setShowSolution] = useState(!isExerciseMode);
  const [truthTableAnswers, setTruthTableAnswers] = useState<
    TruthTableAnswer[]
  >(() => initialAttempt?.truthTableAnswers ?? []);
  const [dnfAnswer, setDnfAnswer] = useState(initialAttempt?.dnfAnswer ?? "");
  const [exerciseFeedback, setExerciseFeedback] =
    useState<DnfExerciseCheckResult | null>(null);
  const simplification = useDnfSimplification(
    initialAttempt?.simplificationAnswer,
  );

  const resetExercise = () => {
    setShowSolution(!isExerciseMode);
    setTruthTableAnswers([]);
    setDnfAnswer("");
    setExerciseFeedback(null);
    simplification.reset();
  };

  const setTruthTableAnswer = (rowIndex: number, value: boolean) => {
    setTruthTableAnswers((currentAnswers) => {
      const nextAnswers = [...currentAnswers];
      nextAnswers[rowIndex] = value;
      return nextAnswers;
    });
    setExerciseFeedback(null);
    setShowSolution(false);
    simplification.reset();
  };

  const updateDnfAnswer = (value: string) => {
    setDnfAnswer(normalizeBooleanOperatorAliases(value));
    setExerciseFeedback(null);
    setShowSolution(false);
    simplification.reset();
  };

  const checkExercise = () => {
    if (analysis.status !== "valid") {
      return;
    }

    setExerciseFeedback(
      checkDnfExerciseAttempt(
        analysis.truthTable,
        truthTableAnswers,
        dnfAnswer,
        { checkTruthTable: requiresTruthTableAnswers },
      ),
    );
  };

  const loadAttempt = (attempt: DnfExerciseTransferDraft) => {
    setShowSolution(false);
    setTruthTableAnswers([...attempt.truthTableAnswers]);
    setDnfAnswer(normalizeBooleanOperatorAliases(attempt.dnfAnswer));
    setExerciseFeedback(null);
    simplification.setAnswer(attempt.simplificationAnswer);
  };

  const normalizedTruthTableAnswers = useMemo(
    () =>
      analysis.status === "valid"
        ? analysis.truthTable.rows.map((row, rowIndex) =>
            requiresTruthTableAnswers
              ? (truthTableAnswers[rowIndex] ?? null)
              : row.result,
          )
        : [],
    [analysis, requiresTruthTableAnswers, truthTableAnswers],
  );

  return {
    showSolution,
    truthTableAnswers: normalizedTruthTableAnswers,
    dnfAnswer,
    exerciseFeedback,
    setTruthTableAnswer,
    setDnfAnswer: updateDnfAnswer,
    checkExercise,
    loadAttempt,
    toggleSolution: () => setShowSolution((current) => !current),
    resetExercise,
    simplification,
  };
}
