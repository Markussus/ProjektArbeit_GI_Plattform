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
  showWalkthrough: boolean;
  setAnswer: (value: string) => void;
  check: (truthTable: TruthTable) => void;
  toggleSolution: () => void;
  toggleWalkthrough: () => void;
  reset: () => void;
}

export function useDnfSimplification(): UseDnfSimplificationResult {
  const [answer, setAnswerInternal] = useState("");
  const [feedback, setFeedback] = useState<DnfSimplificationCheckResult | null>(
    null,
  );
  const [showSolution, setShowSolution] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  const reset = () => {
    setAnswerInternal("");
    setFeedback(null);
    setShowSolution(false);
    setShowWalkthrough(false);
  };

  const setAnswer = (value: string) => {
    setAnswerInternal(normalizeBooleanOperatorAliases(value));
    setFeedback(null);
    setShowSolution(false);
    setShowWalkthrough(false);
  };

  const check = (truthTable: TruthTable) => {
    setFeedback(checkDnfSimplification(truthTable, answer));
  };

  const toggleSolution = () => {
    setShowSolution((current) => !current);
  };

  const toggleWalkthrough = () => {
    setShowWalkthrough((current) => !current);
  };

  return {
    answer,
    feedback,
    showSolution,
    showWalkthrough,
    setAnswer,
    check,
    toggleSolution,
    toggleWalkthrough,
    reset,
  };
}
