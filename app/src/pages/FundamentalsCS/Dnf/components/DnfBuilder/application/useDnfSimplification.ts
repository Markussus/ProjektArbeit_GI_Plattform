import { useState } from "react";
import { normalizeBooleanOperatorAliases } from "../domain/booleanSyntax";
import {
  checkDnfSimplification,
  type DnfSimplificationCheckResult,
} from "../domain/dnfSimplificationCheck";
import type { TruthTable } from "../domain/truthTable";

export interface UseDnfSimplificationResult {
  answer: string;
  feedback: DnfSimplificationCheckResult | null;
  showSolution: boolean;
  setAnswer: (value: string) => void;
  check: (truthTable: TruthTable) => void;
  loadSolution: (value: string, truthTable: TruthTable) => void;
  toggleSolution: () => void;
  reset: () => void;
}

interface UseDnfSimplificationOptions {
  initialFeedback?: DnfSimplificationCheckResult | null;
}

export function useDnfSimplification(
  initialAnswer = "",
  options: UseDnfSimplificationOptions = {},
): UseDnfSimplificationResult {
  const [answer, setAnswerInternal] = useState(initialAnswer);
  const [feedback, setFeedback] = useState<DnfSimplificationCheckResult | null>(
    options.initialFeedback ?? null,
  );
  const [showSolution, setShowSolution] = useState(false);

  const reset = () => {
    setAnswerInternal("");
    setFeedback(null);
    setShowSolution(false);
  };

  const setAnswer = (value: string) => {
    setAnswerInternal(normalizeBooleanOperatorAliases(value));
    setFeedback(null);
    setShowSolution(false);
  };

  const check = (truthTable: TruthTable) => {
    setFeedback(checkDnfSimplification(truthTable, answer));
  };

  // Set the answer and its feedback together from the given value (not from the
  // possibly-stale answer state), so a loaded solution shows as already checked.
  const loadSolution = (value: string, truthTable: TruthTable) => {
    const normalized = normalizeBooleanOperatorAliases(value);
    setAnswerInternal(normalized);
    setFeedback(checkDnfSimplification(truthTable, normalized));
    setShowSolution(false);
  };

  const toggleSolution = () => {
    setShowSolution((current) => !current);
  };

  return {
    answer,
    feedback,
    showSolution,
    setAnswer,
    check,
    loadSolution,
    toggleSolution,
    reset,
  };
}
