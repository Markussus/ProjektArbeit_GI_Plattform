import { useMemo, useState } from "react";
import type { Exercise } from "@/types/exercise";
import { DEFAULT_DNF_SOURCE, getDnfExerciseSource } from "../../../exercises";
import type { DnfDerivation } from "../domain/dnfDerivation";
import {
  deriveDnfFromTruthTable,
  formatDnfExpression,
} from "../domain/dnfDerivation";
import {
  parseBooleanExpression,
  type DnfParseIssue,
} from "../domain/dnfParser";
import { generateTruthTable, type TruthTable } from "../domain/truthTable";
import { useDnfExercise } from "./useDnfExercise";

export type DnfExampleId = "lectureExample" | "alreadyDnf" | "xorExample";

export interface DnfExample {
  id: DnfExampleId;
  expression: string;
}

export const dnfExamples: DnfExample[] = [
  { id: "lectureExample", expression: "a ∨ (b ∧ c)" },
  { id: "alreadyDnf", expression: "(¬a ∧ ¬b ∧ ¬c) ∨ (a ∧ b ∧ c)" },
  { id: "xorExample", expression: "(¬x ∧ y) ∨ (x ∧ ¬y)" },
];

export type DnfBuilderAnalysis =
  | {
      status: "valid";
      truthTable: TruthTable;
      derivation: DnfDerivation;
      formattedDnf: string;
    }
  | {
      status: "invalid";
      issue: DnfParseIssue;
    };

export function useDnfBuilder(selectedExercise?: Exercise | null) {
  const selectedExerciseId = selectedExercise?.id ?? null;
  const exerciseSource = selectedExerciseId
    ? getDnfExerciseSource(selectedExerciseId)
    : DEFAULT_DNF_SOURCE;
  const isExerciseMode = selectedExerciseId !== null;
  const [source, setSource] = useState(exerciseSource);

  const analysis = useMemo<DnfBuilderAnalysis>(() => {
    const parseResult = parseBooleanExpression(source);

    if (!parseResult.ok) {
      return {
        status: "invalid",
        issue: parseResult.issue,
      };
    }

    const truthTable = generateTruthTable(parseResult.expression);
    const derivation = deriveDnfFromTruthTable(truthTable);

    return {
      status: "valid",
      truthTable,
      derivation,
      formattedDnf: formatDnfExpression(derivation.dnf),
    };
  }, [source]);

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

  return {
    source,
    setSource,
    analysis,
    examples: dnfExamples,
    isExerciseMode,
    ...exerciseState,
    reset,
    loadExample,
  };
}
