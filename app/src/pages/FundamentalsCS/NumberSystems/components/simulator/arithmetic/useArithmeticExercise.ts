import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { BaseArithmeticProps } from "./types";
import { useArithmeticOperands } from "./useArithmeticOperands";

export interface ArithmeticExerciseConfig {
  defaultA: string;
  defaultB: string;
  maxLengthA: number;
  maxLengthB: number;
}

export interface ArithmeticExerciseState {
  valA: string;
  valB: string;
  locked: boolean;
  handleInputA: (value: string) => void;
  handleInputB: (value: string) => void;
  showStepByStep: boolean;
  setShowStepByStep: (value: boolean) => void;
  expanded: Set<string>;
  toggle: (id: string) => void;
  t: TFunction<"translation", undefined>;
  isExerciseMode?: boolean;
  showSolution: boolean;
  onShowSolution?: () => void;
  onExitExercise?: () => void;
  initialA?: string;
  initialB?: string;
  onChangeValues?: (a: string, b: string) => void;
  renderModeSelector?: React.ReactNode;
}

export function useArithmeticExercise(
  props: BaseArithmeticProps,
  config: ArithmeticExerciseConfig,
): ArithmeticExerciseState {
  const { t } = useTranslation("translation");
  const {
    valA,
    valB,
    locked,
    handleInputA,
    handleInputB,
    showStepByStep,
    setShowStepByStep,
    expanded,
    toggle,
  } = useArithmeticOperands(config, {
    initialA: props.initialA,
    initialB: props.initialB,
    isExerciseMode: props.isExerciseMode,
    showSolution: props.showSolution ?? true,
    onChangeValues: props.onChangeValues,
  });

  return {
    ...props,
    valA,
    valB,
    locked,
    handleInputA,
    handleInputB,
    showStepByStep,
    setShowStepByStep,
    expanded,
    toggle,
    t,
    showSolution: props.showSolution ?? true,
  };
}
