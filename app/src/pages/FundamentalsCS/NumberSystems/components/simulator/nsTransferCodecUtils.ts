import type {
  ArithmeticModeState,
  ArithmeticModeType,
  BaseType,
  FractionalConverterState,
  IEEE754ConverterState,
  IntegerConverterState,
  NegativeNumbersState,
  NegativeStepMode,
  NumberSystemState,
  SimulatorMode,
} from "./nsTransferCodec";

export const BASE_TO_CHAR: Record<BaseType, string> = {
  dec: "d",
  bin: "b",
  oct: "o",
  hex: "h",
};

export const BASE_FROM_CHAR: Record<string, BaseType> = {
  d: "dec",
  b: "bin",
  o: "oct",
  h: "hex",
};

export const NEGATIVE_MODE_TO_CHAR: Record<NegativeStepMode, string> = {
  twos: "t",
  ones: "o",
  sign: "s",
};

export const NEGATIVE_MODE_FROM_CHAR: Record<string, NegativeStepMode> = {
  t: "twos",
  o: "ones",
  s: "sign",
};

export const ARITHMETIC_TO_CHAR: Record<ArithmeticModeType, string> = {
  addition: "a",
  subtraction: "s",
  multiplication: "m",
  division: "d",
  shifting: "h",
  compare: "c",
};

export const ARITHMETIC_FROM_CHAR: Record<string, ArithmeticModeType> = {
  a: "addition",
  s: "subtraction",
  m: "multiplication",
  d: "division",
  h: "shifting",
  c: "compare",
};

export function decodeBase64UrlSafe(serializedValue: string): string {
  let base64 = serializedValue.trim().replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return decodeURIComponent(escape(atob(base64)));
}

export function encodeBase64UrlSafe(rawStr: string): string {
  return btoa(unescape(encodeURIComponent(rawStr)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function parseIntegerState(
  parts: string[],
): IntegerConverterState | undefined {
  if (parts.length < 5) {
    return undefined;
  }
  return {
    sourceBase: BASE_FROM_CHAR[parts[2]] || "dec",
    targetBase: BASE_FROM_CHAR[parts[3]] || "bin",
    inputValue: parts.slice(4).join("|"),
  };
}

export function parseNegativeState(
  parts: string[],
): NegativeNumbersState | undefined {
  if (parts.length < 4) {
    return undefined;
  }
  return {
    activeMode: NEGATIVE_MODE_FROM_CHAR[parts[2]] || "twos",
    inputValue: parts.slice(3).join("|"),
  };
}

export function parseFractionalState(
  parts: string[],
): FractionalConverterState | undefined {
  if (parts.length < 4) {
    return undefined;
  }
  return {
    converterMode: parts[2] === "d" ? "decToBin" : "binToDec",
    inputValue: parts.slice(3).join("|"),
  };
}

export function parseIEEE754State(
  parts: string[],
): IEEE754ConverterState | undefined {
  if (parts.length < 4) {
    return undefined;
  }
  return {
    converterMode: parts[2] === "d" ? "decToIeee" : "ieeeToDec",
    inputValue: parts.slice(3).join("|"),
  };
}

export function parseArithmeticState(
  parts: string[],
): ArithmeticModeState | undefined {
  if (parts.length < 5) {
    return undefined;
  }
  return {
    activeSubMode: ARITHMETIC_FROM_CHAR[parts[2]] || "addition",
    valA: parts[3],
    valB: parts.slice(4).join("|"),
  };
}

function getModeFromChar(modeChar: string): SimulatorMode {
  switch (modeChar) {
    case "i":
      return "integers";
    case "n":
      return "negative";
    case "f":
      return "fractional";
    case "e":
      return "ieee754";
    case "a":
      return "arithmetic";
    default:
      throw new Error("Invalid mode");
  }
}

export function parseNumberSystemState(
  serializedValue: string,
): NumberSystemState {
  const parts = decodeBase64UrlSafe(serializedValue).split("|");
  if (parts[0] !== "v1") {
    throw new Error("Unsupported format version");
  }

  const activeMode = getModeFromChar(parts[1]);

  return {
    activeMode,
    integers: activeMode === "integers" ? parseIntegerState(parts) : undefined,
    negative: activeMode === "negative" ? parseNegativeState(parts) : undefined,
    fractional:
      activeMode === "fractional" ? parseFractionalState(parts) : undefined,
    ieee754: activeMode === "ieee754" ? parseIEEE754State(parts) : undefined,
    arithmetic:
      activeMode === "arithmetic" ? parseArithmeticState(parts) : undefined,
  };
}

function pushIntegerParts(
  parts: string[],
  integers?: IntegerConverterState,
): void {
  if (!integers) {
    return;
  }
  parts.push(BASE_TO_CHAR[integers.sourceBase]);
  parts.push(BASE_TO_CHAR[integers.targetBase]);
  parts.push(integers.inputValue);
}

function pushNegativeParts(
  parts: string[],
  negative?: NegativeNumbersState,
): void {
  if (!negative) {
    return;
  }
  parts.push(NEGATIVE_MODE_TO_CHAR[negative.activeMode]);
  parts.push(negative.inputValue);
}

function pushFractionalParts(
  parts: string[],
  fractional?: FractionalConverterState,
): void {
  if (!fractional) {
    return;
  }
  parts.push(fractional.converterMode === "decToBin" ? "d" : "b");
  parts.push(fractional.inputValue);
}

function pushIEEE754Parts(
  parts: string[],
  ieee754?: IEEE754ConverterState,
): void {
  if (!ieee754) {
    return;
  }
  parts.push(ieee754.converterMode === "decToIeee" ? "d" : "i");
  parts.push(ieee754.inputValue);
}

function pushArithmeticParts(
  parts: string[],
  arithmetic?: ArithmeticModeState,
): void {
  if (!arithmetic) {
    return;
  }
  parts.push(ARITHMETIC_TO_CHAR[arithmetic.activeSubMode]);
  parts.push(arithmetic.valA);
  parts.push(arithmetic.valB);
}

export function buildTransferString(value: NumberSystemState): string {
  const parts: string[] = ["v1"];

  switch (value.activeMode) {
    case "integers":
      parts.push("i");
      pushIntegerParts(parts, value.integers);
      break;
    case "negative":
      parts.push("n");
      pushNegativeParts(parts, value.negative);
      break;
    case "fractional":
      parts.push("f");
      pushFractionalParts(parts, value.fractional);
      break;
    case "ieee754":
      parts.push("e");
      pushIEEE754Parts(parts, value.ieee754);
      break;
    case "arithmetic":
      parts.push("a");
      pushArithmeticParts(parts, value.arithmetic);
      break;
  }

  return parts.join("|");
}
