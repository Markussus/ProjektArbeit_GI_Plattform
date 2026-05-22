import { useMemo } from "react";
import type { Exercise } from "@/types/exercise";
import {
  getDnfExerciseDefinition,
  getDnfExerciseSource,
} from "../../../exercises";
import { analyzeDnfSource, analyzeDnfTruthTable } from "./dnfAnalysis";
import { useDnfExercise } from "./useDnfExercise";

export function useDnfBuilder(selectedExercise: Exercise) {
  const selectedExerciseId = selectedExercise.id;
  const exerciseDefinition = getDnfExerciseDefinition(selectedExerciseId);
  const source = getDnfExerciseSource(selectedExerciseId);
  const exerciseMode = exerciseDefinition?.mode ?? "expression_to_truth_table";
  const requiresTruthTableAnswers =
    exerciseMode === "expression_to_truth_table";
  const resultHeader = exerciseMode === "truth_table_to_dnf" ? "f" : source;

  const analysis = useMemo(() => {
    if (exerciseDefinition?.mode === "truth_table_to_dnf") {
      return analyzeDnfTruthTable(exerciseDefinition.truthTable);
    }

    return analyzeDnfSource(source);
  }, [exerciseDefinition, source]);

  const { resetExercise, ...exerciseState } = useDnfExercise({
    analysis,
    isExerciseMode: true,
    requiresTruthTableAnswers,
  });

  const reset = () => {
    resetExercise();
  };

  return {
    source,
    analysis,
    requiresTruthTableAnswers,
    resultHeader,
    ...exerciseState,
    reset,
  };
}
