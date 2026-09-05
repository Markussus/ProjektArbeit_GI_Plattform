import { useEffect, useState } from "react";
import { useToggleSet } from "@/components/shared/SimulatorShared";

export interface UseBinaryOperandOptions {
  defaultA: string;
  maxLengthA?: number;
  initialA?: string;
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onChangeValues?: (valA: string, valB: string) => void;
}

export interface UseBinaryOperandResult {
  valA: string;
  locked: boolean;
  handleInputA: (value: string) => void;
  showStepByStep: boolean;
  setShowStepByStep: (value: boolean) => void;
  expanded: Set<string>;
  toggle: (key: string) => void;
}

function sanitizeBinary(value: string, maxLength: number | undefined): string {
  return value.replace(/[^01]/g, "").slice(0, maxLength ?? value.length);
}

export function useBinaryOperand({
  defaultA,
  maxLengthA,
  initialA,
  isExerciseMode,
  showSolution,
  onChangeValues,
}: UseBinaryOperandOptions): UseBinaryOperandResult {
  const initialValue = initialA ?? defaultA;
  const [valA, setValA] = useState(initialValue);
  const [showStepByStep, setShowStepByStep] = useState(false);
  const { expanded, toggle } = useToggleSet(["0", "1", "2"]);

  useEffect(() => {
    onChangeValues?.(valA, "");
  }, [valA, onChangeValues]);

  const locked = !!isExerciseMode && !showSolution;

  const handleInputA = (value: string) => {
    if (locked) return;
    setValA(sanitizeBinary(value, maxLengthA));
  };

  return {
    valA,
    locked,
    handleInputA,
    showStepByStep,
    setShowStepByStep,
    expanded,
    toggle,
  };
}
