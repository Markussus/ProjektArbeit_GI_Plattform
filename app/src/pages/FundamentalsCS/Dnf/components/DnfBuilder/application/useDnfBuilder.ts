import { useEffect, useMemo, useState } from "react";
import type { Exercise } from "@/types/exercise";
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

const DEFAULT_DNF_SOURCE = "a ∨ (b ∧ c)";

const exerciseSourceById: Record<string, string> = {
  "dnf.exercise1": "a ∨ (b ∧ c)",
  "dnf.exercise2": "(a ∨ b) ∧ c",
  "dnf.exercise3": "(¬x ∧ y) ∨ (x ∧ ¬y)",
  "dnf.exercise4": "a ∨ (b ∧ c) ∨ ¬d",
};

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
    ? (exerciseSourceById[selectedExerciseId] ?? DEFAULT_DNF_SOURCE)
    : DEFAULT_DNF_SOURCE;
  const isExerciseMode = selectedExerciseId !== null;
  const [source, setSource] = useState(DEFAULT_DNF_SOURCE);
  const [showSolution, setShowSolution] = useState(!isExerciseMode);

  useEffect(() => {
    if (!selectedExerciseId) {
      setShowSolution(true);
      return;
    }

    setSource(exerciseSource);
    setShowSolution(false);
  }, [selectedExerciseId, exerciseSource]);

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

  const reset = () => {
    setSource(isExerciseMode ? exerciseSource : DEFAULT_DNF_SOURCE);
    setShowSolution(!isExerciseMode);
  };

  const loadExample = (expression: string) => setSource(expression);

  return {
    source,
    setSource,
    analysis,
    examples: dnfExamples,
    isExerciseMode,
    showSolution,
    revealSolution: () => setShowSolution(true),
    reset,
    loadExample,
  };
}
