import type { TFunction } from "i18next";

export interface BitStep {
  position: number;
  bitA: number;
  bitB: number;
  carryIn: number;
  sum: number;
  carryOut: number;
  explanation?: string;
}

const STEP_EXPLANATION_KEYS = {
  "000": "number-systems.simulator.arithmetic.addition.step0",
  "100": "number-systems.simulator.arithmetic.addition.step1",
  "010": "number-systems.simulator.arithmetic.addition.step2",
  "001": "number-systems.simulator.arithmetic.addition.step3",
  "110": "number-systems.simulator.arithmetic.addition.step4",
  "101": "number-systems.simulator.arithmetic.addition.step5",
  "011": "number-systems.simulator.arithmetic.addition.step6",
  "111": "number-systems.simulator.arithmetic.addition.step7",
} as const;

export function getStepExplanation(
  step: BitStep,
  t: TFunction<"translation", undefined>,
): string {
  const lookupKey =
    `${step.bitA}${step.bitB}${step.carryIn}` as keyof typeof STEP_EXPLANATION_KEYS;
  return t(STEP_EXPLANATION_KEYS[lookupKey]);
}

export interface AddBinary8BitResult {
  padA: string;
  padB: string;
  sum: string;
  carries: number[];
  overflow: boolean;
  carryOut: boolean;
  bitSteps: BitStep[];
}

export function addBinary8Bit(
  a: string,
  b: string,
  getStepExplanation?: (step: BitStep) => string,
): AddBinary8BitResult {
  const padA = a.padStart(8, "0");
  const padB = b.padStart(8, "0");

  const carriesArr = Array(9).fill(0);
  const sumArr = Array(8).fill(0);
  const steps: BitStep[] = [];

  for (let i = 7; i >= 0; i--) {
    const bitA = parseInt(padA[i]);
    const bitB = parseInt(padB[i]);
    const carryIn = carriesArr[7 - i];
    const s = bitA + bitB + carryIn;
    sumArr[i] = s % 2;
    const carryOut = Math.floor(s / 2);
    carriesArr[7 - i + 1] = carryOut;

    const step: BitStep = {
      position: 7 - i,
      bitA,
      bitB,
      carryIn,
      sum: sumArr[i],
      carryOut,
    };

    if (getStepExplanation) {
      step.explanation = getStepExplanation(step);
    }

    steps.unshift(step);
  }

  const overflow = carriesArr[7] !== carriesArr[8];
  const carryOut = carriesArr[8] === 1;
  const visCarries = [...carriesArr].reverse();

  return {
    padA,
    padB,
    sum: sumArr.join(""),
    carries: visCarries,
    overflow,
    carryOut,
    bitSteps: steps,
  };
}
