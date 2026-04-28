import { useMemo, useState } from "react";
import type { Exercise } from "@/types/exercise";
import { DEFAULT_DNF_SOURCE, getDnfExerciseSource } from "../../../exercises";
import { dnfExamples } from "../config/dnfExamples";
import { normalizeBooleanOperatorAliases } from "../domain/booleanSyntax";
import { analyzeDnfSource } from "./dnfAnalysis";
import { useDnfExercise } from "./useDnfExercise";

export function useDnfBuilder(
  selectedExercise?: Exercise | null,
  initialSource?: string | null,
) {
  const selectedExerciseId = selectedExercise?.id ?? null;
  const exerciseSource = selectedExerciseId
    ? getDnfExerciseSource(selectedExerciseId)
    : (initialSource ?? DEFAULT_DNF_SOURCE);
  const isExerciseMode = selectedExerciseId !== null;
  const [source, setSource] = useState(exerciseSource);

  const analysis = useMemo(() => analyzeDnfSource(source), [source]);

  const { resetExercise, ...exerciseState } = useDnfExercise({
    analysis,
    isExerciseMode,
  });

  const reset = () => {
    setSource(isExerciseMode ? exerciseSource : DEFAULT_DNF_SOURCE);
    resetExercise();
  };

  const loadExample = (expression: string) => {
    setSource(expression);
    resetExercise();
  };

  const clearSource = () => {
    setSource("");
    resetExercise();
  };

  const updateSource = (value: string) => {
    setSource(normalizeBooleanOperatorAliases(value));
  };

  return {
    source,
    setSource: updateSource,
    analysis,
    examples: dnfExamples,
    isExerciseMode,
    ...exerciseState,
    reset,
    loadExample,
    clearSource,
  };
}
