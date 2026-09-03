import { useEffect, useState } from "react";
import { useToggleSet } from "@/components/shared/SimulatorShared";

export interface UseBinaryOperandsOptions {
  defaultA: string;
  defaultB: string;
  maxLengthA?: number;
  maxLengthB?: number;
  initialA?: string;
  initialB?: string;
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onChangeValues?: (valA: string, valB: string) => void;
}

export interface UseBinaryOperandsResult {
  valA: string;
  valB: string;
  setValA: (value: string) => void;
  setValB: (value: string) => void;
  locked: boolean;
  handleInputA: (value: string) => void;
  handleInputB: (value: string) => void;
  showStepByStep: boolean;
  setShowStepByStep: (value: boolean) => void;
  expanded: Set<string>;
  toggle: (key: string) => void;
}

function sanitizeBinary(value: string, maxLength: number | undefined): string {
  return value.replace(/[^01]/g, "").slice(0, maxLength ?? value.length);
}

export function useBinaryOperands({
  defaultA,
  defaultB,
  maxLengthA,
  maxLengthB,
  initialA,
  initialB,
  isExerciseMode,
  showSolution,
  onChangeValues,
}: UseBinaryOperandsOptions): UseBinaryOperandsResult {
  const [valA, setValA] = useState(initialA || defaultA);
  const [valB, setValB] = useState(initialB || defaultB);
  const [showStepByStep, setShowStepByStep] = useState(false);
  const { expanded, toggle } = useToggleSet(["0", "1", "2"]);

  useEffect(() => {
    if (initialA) setValA(initialA);

    if (initialB) setValB(initialB);
  }, [initialA, initialB]);

  useEffect(() => {
    onChangeValues?.(valA, valB);
  }, [valA, valB, onChangeValues]);

  const locked = !!isExerciseMode && !showSolution;

  const handleInputA = (value: string) => {
    if (locked) return;
    setValA(sanitizeBinary(value, maxLengthA));
  };

  const handleInputB = (value: string) => {
    if (locked) return;
    setValB(sanitizeBinary(value, maxLengthB));
  };

  return {
    valA,
    valB,
    setValA,
    setValB,
    locked,
    handleInputA,
    handleInputB,
    showStepByStep,
    setShowStepByStep,
    expanded,
    toggle,
  };
}
