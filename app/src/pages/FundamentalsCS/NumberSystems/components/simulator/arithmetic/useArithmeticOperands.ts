import { useBinaryOperands } from "./useBinaryOperands";
import type { BaseArithmeticProps } from "./types";

export interface UseArithmeticOperandsOptions {
  defaultA: string;
  defaultB: string;
  maxLengthA?: number;
  maxLengthB?: number;
}

export function useArithmeticOperands(
  { defaultA, defaultB, maxLengthA, maxLengthB }: UseArithmeticOperandsOptions,
  {
    initialA,
    initialB,
    isExerciseMode,
    showSolution,
    onChangeValues,
  }: Pick<
    BaseArithmeticProps,
    | "initialA"
    | "initialB"
    | "isExerciseMode"
    | "showSolution"
    | "onChangeValues"
  >,
) {
  return useBinaryOperands({
    defaultA,
    defaultB,
    maxLengthA,
    maxLengthB,
    initialA,
    initialB,
    isExerciseMode,
    showSolution,
    onChangeValues,
  });
}
