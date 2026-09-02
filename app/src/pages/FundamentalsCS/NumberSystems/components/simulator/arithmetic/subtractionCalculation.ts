import type { TFunction } from "i18next";
import { addBinary8Bit } from "./binaryArithmetic";

export interface OnesComplementStep {
  position: number;
  originalBit: string;
  flippedBit: string;
  explanation: string;
}

export interface TwosComplementStep {
  position: number;
  carryIn: number;
  currentBit: number;
  resultBit: number;
  carryOut: number;
  explanation: string;
}

export interface AddStep {
  position: number;
  bitA: number;
  bitB: number;
  carryIn: number;
  sum: number;
  carryOut: number;
  explanation: string;
}

export interface SubtractionResultData {
  padA: string;
  padB: string;
  onesComp: string;
  twosComp: string;
  onesSteps: OnesComplementStep[];
  twosSteps: TwosComplementStep[];
  addSteps: AddStep[];
  sum: string;
  carries: number[];
  overflow: boolean;
  carryOut: boolean;
}

export function calculateSubtraction(
  valA: string,
  valB: string,
  t: TFunction<"translation", undefined>,
): SubtractionResultData {
  const padA = valA.padStart(8, "0");
  const padB = valB.padStart(8, "0");

  const onesComp = padB
    .split("")
    .map((b) => (b === "1" ? "0" : "1"))
    .join("");

  const onesSteps: OnesComplementStep[] = padB
    .split("")
    .map((bit, i) => ({
      position: 7 - i,
      originalBit: bit,
      flippedBit: bit === "1" ? "0" : "1",
      explanation: t(
        "number-systems.simulator.arithmetic.subtraction.flipBitDesc",
        {
          pos: 7 - i,
          orig: bit,
          flipped: bit === "1" ? "0" : "1",
        },
      ),
    }))
    .reverse();

  const twosCompArr = Array(8).fill(0);
  let c = 1;
  for (let i = 7; i >= 0; i--) {
    const bit = parseInt(onesComp[i]);
    const s = bit + c;
    twosCompArr[i] = s % 2;
    c = Math.floor(s / 2);
  }
  const twosComp = twosCompArr.join("");

  const twosSteps: TwosComplementStep[] = [];
  c = 1;
  for (let i = 7; i >= 0; i--) {
    const bit = parseInt(onesComp[i]);
    const s = bit + c;
    const resultBit = s % 2;
    c = Math.floor(s / 2);
    twosSteps.unshift({
      position: 7 - i,
      carryIn: c === 0 ? 1 : 0,
      currentBit: bit,
      resultBit,
      carryOut: c,
      explanation: t(
        "number-systems.simulator.arithmetic.subtraction.addOneDesc",
        {
          pos: 7 - i,
          bit: bit,
          carry: c === 0 ? 1 : 0,
          sum: s,
          result: resultBit,
          nextCarry: c,
        },
      ),
    });
  }

  const additionResult = addBinary8Bit(padA, twosComp, (step) => {
    if (step.bitA === 0 && step.bitB === 0 && step.carryIn === 0) {
      return t("number-systems.simulator.arithmetic.subtraction.add0", {
        pos: step.position,
      });
    }
    if (
      (step.bitA === 1 && step.bitB === 0 && step.carryIn === 1) ||
      (step.bitA === 0 && step.bitB === 1 && step.carryIn === 1)
    ) {
      return t("number-systems.simulator.arithmetic.subtraction.add1", {
        pos: step.position,
      });
    }
    if (step.bitA === 1 && step.bitB === 1 && step.carryIn === 0) {
      return t("number-systems.simulator.arithmetic.subtraction.add2", {
        pos: step.position,
      });
    }
    if (step.bitA === 1 && step.bitB === 1 && step.carryIn === 1) {
      return t("number-systems.simulator.arithmetic.subtraction.add3", {
        pos: step.position,
      });
    }
    return t("number-systems.simulator.arithmetic.subtraction.add4", {
      pos: step.position,
      a: step.bitA,
      b: step.bitB,
      c: step.carryIn,
      sum: step.sum,
      carry: step.carryOut,
    });
  });

  const addSteps = additionResult.bitSteps.map((step) => ({
    ...step,
    explanation: step.explanation ?? "",
  }));

  return {
    padA,
    padB,
    onesComp,
    twosComp,
    onesSteps,
    twosSteps,
    addSteps,
    sum: additionResult.sum,
    carries: additionResult.carries,
    overflow: additionResult.overflow,
    carryOut: additionResult.carryOut,
  };
}
