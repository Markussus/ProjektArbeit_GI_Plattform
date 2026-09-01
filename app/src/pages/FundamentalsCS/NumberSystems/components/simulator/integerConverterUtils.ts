import type { BaseType } from "./nsTransferCodec";

const BASE_LIMITS: Record<BaseType, number> = {
  bin: 16,
  oct: 6,
  dec: 5,
  hex: 4,
};

const BASE_PATTERNS: Record<BaseType, RegExp> = {
  bin: /[^01]/g,
  oct: /[^0-7]/g,
  dec: /[^0-9]/g,
  hex: /[^0-9A-Fa-f]/g,
};

const BASE_VALIDATORS: Record<BaseType, RegExp> = {
  bin: /^[01]+$/,
  oct: /^[0-7]+$/,
  dec: /^[0-9]+$/,
  hex: /^[0-9A-Fa-f]+$/,
};

function cleanInputForBase(value: string, base: BaseType): string {
  return value.replace(BASE_PATTERNS[base], "");
}

function clampInputLength(value: string, base: BaseType): string {
  const limit = BASE_LIMITS[base];
  return value.length > limit ? value.slice(0, limit) : value;
}

export function sanitizeInput(value: string, base: BaseType): string {
  return clampInputLength(cleanInputForBase(value, base), base);
}

export function baseToNumber(base: BaseType): number {
  return base === "dec" ? 10 : base === "bin" ? 2 : base === "oct" ? 8 : 16;
}

export function formatDecValue(value: string, base: BaseType): string {
  if (!value) return "";
  if (!BASE_VALIDATORS[base].test(value)) return "";

  try {
    const prefix =
      base === "bin"
        ? "0b"
        : base === "oct"
          ? "0o"
          : base === "hex"
            ? "0x"
            : "";
    return BigInt(prefix + value).toString(10);
  } catch {
    return "";
  }
}

export function formatTargetValue(
  decValue: string,
  targetBase: BaseType,
): string {
  if (!decValue) return "";
  try {
    const bigIntVal = BigInt(decValue);
    if (targetBase === "dec") return decValue;
    if (targetBase === "bin") return bigIntVal.toString(2);
    if (targetBase === "oct") return bigIntVal.toString(8);
    return bigIntVal.toString(16).toUpperCase();
  } catch {
    return "";
  }
}

interface DivisionStep {
  value: bigint;
  remainder: bigint;
  base: number;
}

export function generateDivisionSteps(
  decValue: string,
  targetVal: number,
): DivisionStep[] {
  if (!decValue) return [];
  try {
    let currentVal = BigInt(decValue);
    const baseVal = BigInt(targetVal);
    const steps: DivisionStep[] = [];

    if (currentVal === 0n) {
      return [{ value: 0n, remainder: 0n, base: targetVal }];
    }

    while (currentVal > 0n) {
      const remainder = currentVal % baseVal;
      const nextVal = currentVal / baseVal;
      steps.push({ value: currentVal, remainder, base: targetVal });
      currentVal = nextVal;
    }
    return steps;
  } catch {
    return [];
  }
}

interface PowerStep {
  digit: string;
  digitVal: bigint;
  power: number;
  base: number;
  termVal: bigint;
}

export function generatePowerSteps(
  sourceVal: number,
  rawInput: string,
): PowerStep[] {
  if (!rawInput) return [];
  const cleanInput = sourceVal === 16 ? rawInput.toUpperCase() : rawInput;
  const steps: PowerStep[] = [];
  const len = cleanInput.length;

  for (let i = 0; i < len; i++) {
    const digitChar = cleanInput[i];
    const power = len - 1 - i;
    const digitVal = BigInt(parseInt(digitChar, sourceVal));
    const termVal = digitVal * BigInt(sourceVal) ** BigInt(power);
    steps.push({ digit: digitChar, digitVal, power, base: sourceVal, termVal });
  }
  return steps;
}

export function formatRemainder(
  remainder: bigint,
  targetBase: BaseType,
): string {
  if (targetBase === "hex" && remainder > 9n) {
    return remainder.toString(16).toUpperCase();
  }
  return remainder.toString();
}
