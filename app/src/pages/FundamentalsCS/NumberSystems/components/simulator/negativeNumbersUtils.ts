const BITS = 8;
const MIN_VALUE = -128;
const MAX_VALUE = 127;

export function isValid8Bit(value: string): boolean {
  const parsed = Number(value);
  return (
    value !== "" &&
    Number.isInteger(parsed) &&
    parsed >= MIN_VALUE &&
    parsed <= MAX_VALUE
  );
}

export function parse8Bit(value: string): number | null {
  if (!isValid8Bit(value)) return null;
  return Number(value);
}

function to8BitBinary(absValue: number): string {
  return absValue.toString(2).padStart(BITS, "0");
}

function getPositiveBinary(value: number): string {
  return to8BitBinary(Math.abs(value));
}

export function getSignMagnitude(value: number): string {
  if (value >= 0) return getPositiveBinary(value);
  const positiveBin = getPositiveBinary(value);
  return "1" + positiveBin.substring(1);
}

export function getOnesComplement(value: number): string {
  if (value >= 0) return getPositiveBinary(value);
  const positiveBin = getPositiveBinary(value);
  return positiveBin
    .split("")
    .map((bit) => (bit === "0" ? "1" : "0"))
    .join("");
}

export function getTwosComplement(value: number): string {
  if (value >= 0) return getPositiveBinary(value);
  const ones = getOnesComplement(value);
  return addOneToBinary(ones);
}

export function addOneToBinary(bits: string): string {
  let result = "";
  let carry = 1;
  for (let i = BITS - 1; i >= 0; i--) {
    const bit = bits[i];
    if (bit === "1" && carry === 1) {
      result = "0" + result;
    } else if (bit === "0" && carry === 1) {
      result = "1" + result;
      carry = 0;
    } else {
      result = bit + result;
    }
  }
  return result;
}

export interface NegativeNumberConversions {
  signMagnitude: string;
  onesComplement: string;
  twosComplement: string;
  positiveBin: string;
}

export function getNegativeNumberConversions(
  parsed: number | null,
): NegativeNumberConversions {
  const defaultResult: NegativeNumberConversions = {
    signMagnitude: "00000000",
    onesComplement: "00000000",
    twosComplement: "00000000",
    positiveBin: "00000000",
  };

  if (parsed === null) {
    return defaultResult;
  }

  const positiveBin = getPositiveBinary(parsed);

  if (parsed >= 0) {
    return {
      signMagnitude: positiveBin,
      onesComplement: positiveBin,
      twosComplement: positiveBin,
      positiveBin,
    };
  }

  return {
    signMagnitude: getSignMagnitude(parsed),
    onesComplement: getOnesComplement(parsed),
    twosComplement: getTwosComplement(parsed),
    positiveBin,
  };
}
