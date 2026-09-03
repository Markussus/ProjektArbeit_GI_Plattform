import { useMemo } from "react";
import type { TFunction } from "i18next";

export interface ShiftStep {
  step: number;
  binary: string;
  description: string;
  highlightedBit: number | null;
  newBit: string | null;
}

export interface ShiftCalculation {
  resultStr: string;
  decimalBefore: number;
  decimalAfter: number;
  explanation: string;
  shiftSteps: ShiftStep[];
}

function createOriginalStep(
  valA: string,
  t: TFunction<"translation", undefined>,
): ShiftStep {
  return {
    step: 0,
    binary: valA,
    description: t(
      "number-systems.simulator.arithmetic.shifting.stepOriginal",
      { val: valA },
    ),
    highlightedBit: null,
    newBit: null,
  };
}

export function useLeftShiftCalculation(
  valA: string,
  shiftAmount: number,
  t: TFunction<"translation", undefined>,
): ShiftCalculation {
  return useMemo(() => {
    if (!valA)
      return {
        resultStr: "",
        decimalBefore: 0,
        decimalAfter: 0,
        explanation: "",
        shiftSteps: [],
      };

    const beforeDec = parseInt(valA, 2);
    const afterDec = beforeDec * Math.pow(2, shiftAmount);
    const resultStr = valA + "0".repeat(shiftAmount);
    const explanation = t(
      "number-systems.simulator.arithmetic.shifting.shiftLeftExpl",
    );

    const steps: ShiftStep[] = [createOriginalStep(valA, t)];

    for (let i = 0; i < Math.min(shiftAmount, 4); i++) {
      const currentResult = valA + "0".repeat(i + 1);
      steps.push({
        step: i + 1,
        binary: currentResult,
        description: t(
          "number-systems.simulator.arithmetic.shifting.stepLeftShift",
          { count: i + 1 },
        ),
        highlightedBit: valA.length + i,
        newBit: "0",
      });
    }

    if (shiftAmount > 4) {
      steps.push({
        step: 5,
        binary: valA + "0".repeat(shiftAmount),
        description: t(
          "number-systems.simulator.arithmetic.shifting.stepLeftComplete",
          { count: shiftAmount },
        ),
        highlightedBit: null,
        newBit: null,
      });
    }

    return {
      resultStr,
      decimalBefore: beforeDec,
      decimalAfter: afterDec,
      explanation,
      shiftSteps: steps,
    };
  }, [valA, shiftAmount, t]);
}

export function useRightShiftCalculation(
  valA: string,
  shiftAmount: number,
  t: TFunction<"translation", undefined>,
): ShiftCalculation {
  return useMemo(() => {
    if (!valA)
      return {
        resultStr: "",
        decimalBefore: 0,
        decimalAfter: 0,
        explanation: "",
        shiftSteps: [],
      };

    const beforeDec = parseInt(valA, 2);

    if (shiftAmount >= valA.length) {
      return {
        resultStr: "0",
        decimalBefore: beforeDec,
        decimalAfter: 0,
        explanation: "",
        shiftSteps: [
          createOriginalStep(valA, t),
          {
            step: 1,
            binary: "0",
            description: t(
              "number-systems.simulator.arithmetic.shifting.stepRightZero",
              { count: shiftAmount },
            ),
            highlightedBit: null,
            newBit: null,
          },
        ],
      };
    }

    const resultStr = valA.slice(0, valA.length - shiftAmount);
    const afterDec = Math.floor(beforeDec / Math.pow(2, shiftAmount));
    const explanation = t(
      "number-systems.simulator.arithmetic.shifting.shiftRightExpl",
    );

    const steps: ShiftStep[] = [createOriginalStep(valA, t)];

    for (let i = 0; i < Math.min(shiftAmount, 4); i++) {
      const bit = valA[valA.length - 1 - i];
      const remaining = valA.slice(0, valA.length - i - 1);
      steps.push({
        step: i + 1,
        binary: remaining + "X".repeat(i + 1),
        description: t(
          "number-systems.simulator.arithmetic.shifting.stepRightShift",
          { bit },
        ),
        highlightedBit: valA.length - 1 - i,
        newBit: null,
      });
    }

    if (shiftAmount > 4) {
      steps.push({
        step: 5,
        binary: valA.slice(0, valA.length - shiftAmount),
        description: t(
          "number-systems.simulator.arithmetic.shifting.stepRightComplete",
          { count: shiftAmount },
        ),
        highlightedBit: null,
        newBit: null,
      });
    }

    return {
      resultStr,
      decimalBefore: beforeDec,
      decimalAfter: afterDec,
      explanation,
      shiftSteps: steps,
    };
  }, [valA, shiftAmount, t]);
}
