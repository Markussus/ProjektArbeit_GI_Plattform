import { useState } from "react";
import { normalizeBooleanOperatorAliases } from "../domain/booleanSyntax";
import {
  checkDnfExerciseAttempt,
  type DnfExerciseCheckResult,
  type TruthTableAnswer,
} from "../domain/dnfExerciseCheck";
import type { DnfBuilderAnalysis } from "./dnfAnalysis";

interface UseDnfExerciseParams {
  analysis: DnfBuilderAnalysis;
  isExerciseMode: boolean;
  requiresTruthTableAnswers: boolean;
}

export function useDnfExercise({
  analysis,
  isExerciseMode,
  requiresTruthTableAnswers,
}: UseDnfExerciseParams) {
  const [showSolution, setShowSolution] = useState(!isExerciseMode);
  const [truthTableAnswers, setTruthTableAnswers] = useState<
    TruthTableAnswer[]
  >([]);
  const [dnfAnswer, setDnfAnswer] = useState("");
  const [exerciseFeedback, setExerciseFeedback] =
    useState<DnfExerciseCheckResult | null>(null);

  const resetExercise = () => {
    setShowSolution(!isExerciseMode);
    setTruthTableAnswers([]);
    setDnfAnswer("");
    setExerciseFeedback(null);
  };

  const setTruthTableAnswer = (rowIndex: number, value: boolean) => {
    setTruthTableAnswers((currentAnswers) => {
      const nextAnswers = [...currentAnswers];
      nextAnswers[rowIndex] = value;
      return nextAnswers;
    });
    setExerciseFeedback(null);
    setShowSolution(false);
  };

  const updateDnfAnswer = (value: string) => {
    setDnfAnswer(normalizeBooleanOperatorAliases(value));
    setExerciseFeedback(null);
    setShowSolution(false);
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

  const normalizedTruthTableAnswers =
    analysis.status === "valid"
      ? analysis.truthTable.rows.map((row, rowIndex) =>
          requiresTruthTableAnswers
            ? (truthTableAnswers[rowIndex] ?? null)
            : row.result,
        )
      : [];

  return {
    showSolution,
    truthTableAnswers: normalizedTruthTableAnswers,
    dnfAnswer,
    exerciseFeedback,
    setTruthTableAnswer,
    setDnfAnswer: updateDnfAnswer,
    checkExercise,
    toggleSolution: () => setShowSolution((current) => !current),
    resetExercise,
  };
}
