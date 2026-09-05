import { useEffect, useState } from "react";
import type { IEEE754ConverterState } from "./nsTransferCodec";

export interface UseIEEE754ConverterOptions {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  initialValue?: string;
  initialConverterMode?: "decToIeee" | "ieeeToDec";
  initialState?: IEEE754ConverterState;
  onChangeState?: (state: IEEE754ConverterState) => void;
}

export interface IEEE754Analysis {
  isValid: boolean;
  isNaNVal: boolean;
  isSpecial: boolean;
  isZero: boolean;
  isInf: boolean;
  floatVal: number;
  sign: string;
  exponent: string;
  mantissa: string;
  expVal: number;
  sumOfFractions: number;
  fractionSteps: number[];
}

export interface UseIEEE754ConverterResult extends IEEE754Analysis {
  inputValue: string;
  setInputValue: (value: string) => void;
  converterMode: "decToIeee" | "ieeeToDec";
  setConverterMode: (mode: "decToIeee" | "ieeeToDec") => void;
  locked: boolean;
}

const DEFAULT_VALUE = "12.5";
const DEFAULT_MODE: "decToIeee" | "ieeeToDec" = "decToIeee";
const IEEE754_MANTISSA_LENGTH = 23;
const IEEE754_EXPONENT_LENGTH = 8;
const IEEE754_TOTAL_LENGTH = 32;

function floatToBits(value: number): string {
  const buffer = new ArrayBuffer(4);
  const floatView = new Float32Array(buffer);
  const intView = new Uint32Array(buffer);
  floatView[0] = value;
  return intView[0].toString(2).padStart(IEEE754_TOTAL_LENGTH, "0");
}

function bitsToFloat(bits: string): number {
  const buffer = new ArrayBuffer(4);
  const floatView = new Float32Array(buffer);
  const intView = new Uint32Array(buffer);
  intView[0] = parseInt(bits, 2);
  return floatView[0];
}

function parseDecToIeee(inputValue: string): IEEE754Analysis {
  const floatVal = parseFloat(inputValue.replace(",", "."));
  const isNaNLiteral = inputValue.toLowerCase() === "nan";
  const isValidNumber =
    inputValue.trim() !== "" && !Number.isNaN(floatVal) && !isNaNLiteral;
  const isNaNVal =
    isNaNLiteral ||
    (inputValue.trim() !== "" && Number.isNaN(floatVal) && !isValidNumber);
  const isSpecial =
    isValidNumber && (!Number.isFinite(floatVal) || floatVal === 0);

  if (!isValidNumber) {
    return {
      isValid: isValidNumber,
      isNaNVal,
      isSpecial,
      isZero: false,
      isInf: false,
      floatVal: Number.NaN,
      sign: "0",
      exponent: "0".repeat(IEEE754_EXPONENT_LENGTH),
      mantissa: "0".repeat(IEEE754_MANTISSA_LENGTH),
      expVal: 0,
      sumOfFractions: 0,
      fractionSteps: [],
    };
  }

  const bits = floatToBits(floatVal);
  const sign = bits[0];
  const exponent = bits.slice(1, 1 + IEEE754_EXPONENT_LENGTH);
  const mantissa = bits.slice(1 + IEEE754_EXPONENT_LENGTH);
  const expVal = parseInt(exponent, 2);

  return {
    isValid: true,
    isNaNVal,
    isSpecial,
    isZero: floatVal === 0,
    isInf: !Number.isFinite(floatVal) && !isNaNVal,
    floatVal,
    sign,
    exponent,
    mantissa,
    expVal,
    sumOfFractions: 0,
    fractionSteps: [],
  };
}

function parseIeeeToDec(inputValue: string): IEEE754Analysis {
  const cleanBinary = inputValue.replace(/[^01]/g, "");
  const isValid = cleanBinary.length === IEEE754_TOTAL_LENGTH;

  if (!isValid) {
    return {
      isValid: false,
      isNaNVal: false,
      isSpecial: false,
      isZero: false,
      isInf: false,
      floatVal: 0,
      sign: "0",
      exponent: "0".repeat(IEEE754_EXPONENT_LENGTH),
      mantissa: "0".repeat(IEEE754_MANTISSA_LENGTH),
      expVal: 0,
      sumOfFractions: 0,
      fractionSteps: [],
    };
  }

  const sign = cleanBinary[0];
  const exponent = cleanBinary.slice(1, 1 + IEEE754_EXPONENT_LENGTH);
  const mantissa = cleanBinary.slice(1 + IEEE754_EXPONENT_LENGTH);
  const expVal = parseInt(exponent, 2);
  const floatVal = bitsToFloat(cleanBinary);
  const isNaNVal = Number.isNaN(floatVal);
  const isSpecial = !Number.isFinite(floatVal) || floatVal === 0;

  let sumOfFractions = 0;
  const fractionSteps: number[] = [];
  if (!isSpecial && !isNaNVal) {
    for (let i = 0; i < mantissa.length; i++) {
      if (mantissa[i] === "1") {
        const pow = 2 ** -(i + 1);
        sumOfFractions += pow;
        fractionSteps.push(i + 1);
      }
    }
  }

  return {
    isValid: true,
    isNaNVal,
    isSpecial,
    isZero: floatVal === 0,
    isInf: !Number.isFinite(floatVal) && !isNaNVal,
    floatVal,
    sign,
    exponent,
    mantissa,
    expVal,
    sumOfFractions,
    fractionSteps,
  };
}

export function useIEEE754Converter({
  isExerciseMode,
  showSolution = true,
  initialValue = "",
  initialConverterMode = DEFAULT_MODE,
  initialState,
  onChangeState,
}: UseIEEE754ConverterOptions): UseIEEE754ConverterResult {
  const locked = !!isExerciseMode && !showSolution;

  const [inputValue, setInputValue] = useState<string>(
    locked
      ? initialValue || DEFAULT_VALUE
      : (initialState?.inputValue ?? (initialValue || DEFAULT_VALUE)),
  );

  const [converterMode, setConverterMode] = useState<"decToIeee" | "ieeeToDec">(
    locked
      ? initialConverterMode
      : (initialState?.converterMode ?? initialConverterMode),
  );

  useEffect(() => {
    onChangeState?.({ inputValue, converterMode });
  }, [inputValue, converterMode, onChangeState]);

  const analysis =
    converterMode === "decToIeee"
      ? parseDecToIeee(inputValue)
      : parseIeeeToDec(inputValue);

  return {
    ...analysis,
    inputValue,
    setInputValue,
    converterMode,
    setConverterMode,
    locked,
  };
}
