export interface ParsedFractionalInput {
  isNegative: boolean;
  intPartStr: string;
  fracPartStr: string;
}

export interface DecToBinIntStep {
  dividend: number;
  remainder: number;
}

export interface DecToBinFracStep {
  value: number;
  multResult: number;
  bit: number;
}

export interface BinToDecIntStep {
  bit: number;
  pos: number;
  powVal: number;
}

export interface BinToDecFracStep {
  bit: number;
  pos: number;
  powVal: number;
}

export interface DecToBinResult {
  mode: "decToBin";
  isNegative: boolean;
  intVal: number;
  fracVal: number;
  intSteps: DecToBinIntStep[];
  binIntPart: string;
  fracSteps: DecToBinFracStep[];
  binFracPart: string;
  binFracDisplay: string;
  finalResult: string;
  expectedBinary: string;
}

export interface BinToDecResult {
  mode: "binToDec";
  isNegative: boolean;
  binIntPart: string;
  binFracPart: string;
  binIntSteps: BinToDecIntStep[];
  intDecVal: number;
  binFracSteps: BinToDecFracStep[];
  fracDecVal: number;
  totalDec: number;
  finalResult: string;
  expectedBinary: string;
}

export type ConversionData = DecToBinResult | BinToDecResult;

const MAX_FRAC_STEPS = 10;

export function parseFractionalInput(
  inputValue: string,
): ParsedFractionalInput | null {
  if (!inputValue || inputValue === "-" || inputValue === ".") return null;

  const isNegative = inputValue.startsWith("-");
  const absValueStr = inputValue.substring(isNegative ? 1 : 0);

  const parts = absValueStr.split(".");
  const intPartStr = parts[0] || "0";
  const fracPartStr = parts[1] || "0";

  return { isNegative, intPartStr, fracPartStr };
}

export function convertDecToBin(parsed: ParsedFractionalInput): DecToBinResult {
  const { isNegative, intPartStr, fracPartStr } = parsed;

  let intVal = parseInt(intPartStr, 10);
  if (isNaN(intVal)) intVal = 0;

  const intSteps: DecToBinIntStep[] = [];
  let currentInt = intVal;

  if (currentInt === 0) {
    intSteps.push({ dividend: 0, remainder: 0 });
  } else {
    while (currentInt > 0) {
      intSteps.push({
        dividend: currentInt,
        remainder: currentInt % 2,
      });
      currentInt = Math.floor(currentInt / 2);
    }
  }

  const binIntPart = [...intSteps]
    .reverse()
    .map((s) => s.remainder)
    .join("");

  let currentFrac = parseFloat("0." + fracPartStr);
  const fracSteps: DecToBinFracStep[] = [];

  while (currentFrac > 0 && fracSteps.length < MAX_FRAC_STEPS) {
    const multResult = currentFrac * 2;
    const bit = Math.floor(multResult);
    fracSteps.push({
      value: currentFrac,
      multResult,
      bit,
    });
    currentFrac = multResult - bit;
  }

  const binFracPart =
    fracSteps.length > 0 ? fracSteps.map((s) => s.bit).join("") : "0";

  let binFracDisplay = binFracPart;
  if (fracSteps.length === MAX_FRAC_STEPS && currentFrac > 0) {
    binFracDisplay += "...";
  }

  const finalBinary = `${isNegative ? "-" : ""}${binIntPart}.${binFracPart}`;

  return {
    mode: "decToBin",
    isNegative,
    intVal,
    fracVal: parseFloat("0." + fracPartStr),
    intSteps,
    binIntPart,
    fracSteps,
    binFracPart,
    binFracDisplay,
    finalResult: finalBinary,
    expectedBinary: finalBinary,
  };
}

export function convertBinToDec(parsed: ParsedFractionalInput): BinToDecResult {
  const { isNegative, intPartStr, fracPartStr } = parsed;

  const binIntSteps: BinToDecIntStep[] = [];
  let intDecVal = 0;
  const intLen = intPartStr.length;

  for (let i = 0; i < intLen; i++) {
    const bit = parseInt(intPartStr[i], 10);
    const pos = intLen - 1 - i;
    const powVal = bit * Math.pow(2, pos);
    if (bit === 1) {
      binIntSteps.push({ bit, pos, powVal });
    }
    intDecVal += powVal;
  }

  const binFracSteps: BinToDecFracStep[] = [];
  let fracDecVal = 0;
  const fracLen = fracPartStr.length;

  for (let i = 0; i < fracLen; i++) {
    const bit = parseInt(fracPartStr[i], 10);
    const pos = -(i + 1);
    const powVal = bit * Math.pow(2, pos);
    if (bit === 1) {
      binFracSteps.push({ bit, pos, powVal });
    }
    fracDecVal += powVal;
  }

  const totalDec = intDecVal + fracDecVal;
  const finalDecimal = `${isNegative && totalDec > 0 ? "-" : ""}${totalDec}`;

  return {
    mode: "binToDec",
    isNegative,
    binIntPart: intPartStr,
    binFracPart: fracPartStr,
    binIntSteps,
    intDecVal,
    binFracSteps,
    fracDecVal,
    totalDec,
    finalResult: finalDecimal,
    expectedBinary: finalDecimal,
  };
}

export function computeFractionalConversion(
  inputValue: string,
  converterMode: "decToBin" | "binToDec",
): ConversionData | null {
  const parsed = parseFractionalInput(inputValue);
  if (!parsed) return null;

  if (converterMode === "decToBin") {
    return convertDecToBin(parsed);
  }
  return convertBinToDec(parsed);
}
