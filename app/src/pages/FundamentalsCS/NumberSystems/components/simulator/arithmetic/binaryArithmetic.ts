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

export function getStepExplanation(
  step: BitStep,
  t: TFunction<"translation">,
): string {
  if (step.bitA === 0 && step.bitB === 0 && step.carryIn === 0) {
    return t("number-systems.simulator.arithmetic.addition.step0");
  }
  if (step.bitA === 1 && step.bitB === 0 && step.carryIn === 0) {
    return t("number-systems.simulator.arithmetic.addition.step1");
  }
  if (step.bitA === 0 && step.bitB === 1 && step.carryIn === 0) {
    return t("number-systems.simulator.arithmetic.addition.step2");
  }
  if (step.bitA === 0 && step.bitB === 0 && step.carryIn === 1) {
    return t("number-systems.simulator.arithmetic.addition.step3");
  }
  if (step.bitA === 1 && step.bitB === 1 && step.carryIn === 0) {
    return t("number-systems.simulator.arithmetic.addition.step4");
  }
  if (step.bitA === 1 && step.bitB === 0 && step.carryIn === 1) {
    return t("number-systems.simulator.arithmetic.addition.step5");
  }
  if (step.bitA === 0 && step.bitB === 1 && step.carryIn === 1) {
    return t("number-systems.simulator.arithmetic.addition.step6");
  }
  return t("number-systems.simulator.arithmetic.addition.step7");
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
