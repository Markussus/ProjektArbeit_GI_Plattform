import { useState } from "react";
import { normalizeBooleanOperatorAliases } from "../domain/booleanSyntax";
import {
  checkDnfSimplification,
  type DnfSimplificationCheckResult,
} from "../domain/dnfSimplificationCheck";
import type { TruthTable } from "../domain/truthTable";

export interface UseDnfSimplificationResult {
  isOpen: boolean;
  answer: string;
  feedback: DnfSimplificationCheckResult | null;
  showSolution: boolean;
  setAnswer: (value: string) => void;
  toggleOpen: () => void;
  check: (truthTable: TruthTable) => void;
  toggleSolution: () => void;
  reset: () => void;
}

export function useDnfSimplification(): UseDnfSimplificationResult {
  const [isOpen, setIsOpen] = useState(false);
  const [answer, setAnswerInternal] = useState("");
  const [feedback, setFeedback] =
    useState<DnfSimplificationCheckResult | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const reset = () => {
    setIsOpen(false);
    setAnswerInternal("");
    setFeedback(null);
    setShowSolution(false);
  };

  const setAnswer = (value: string) => {
    setAnswerInternal(normalizeBooleanOperatorAliases(value));
    setFeedback(null);
    setShowSolution(false);
  };

  const toggleOpen = () => {
    setIsOpen((current) => !current);
  };

  const check = (truthTable: TruthTable) => {
    setFeedback(checkDnfSimplification(truthTable, answer));
  };

  const toggleSolution = () => {
    setShowSolution((current) => !current);
  };

  return {
    isOpen,
    answer,
    feedback,
    showSolution,
    setAnswer,
    toggleOpen,
    check,
    toggleSolution,
    reset,
  };
}
