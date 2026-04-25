import { useState } from "react";
import {
  checkDnfExerciseAttempt,
  type DnfExerciseCheckResult,
  type TruthTableAnswer,
} from "../domain/dnfExerciseCheck";
import type { TruthTable } from "../domain/truthTable";

type DnfExerciseAnalysis =
  | {
      status: "valid";
      truthTable: TruthTable;
    }
  | {
      status: "invalid";
    };

interface UseDnfExerciseParams {
  analysis: DnfExerciseAnalysis;
  isExerciseMode: boolean;
}

export function useDnfExercise({
  analysis,
  isExerciseMode,
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
    setDnfAnswer(value);
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
      ),
    );
  };

  const normalizedTruthTableAnswers =
    analysis.status === "valid"
      ? analysis.truthTable.rows.map(
          (_row, rowIndex) => truthTableAnswers[rowIndex] ?? null,
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
