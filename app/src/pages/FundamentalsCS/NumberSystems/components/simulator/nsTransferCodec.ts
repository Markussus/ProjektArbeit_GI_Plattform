import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";

export type BaseType = "dec" | "bin" | "oct" | "hex";
export type SimulatorMode =
  | "integers"
  | "negative"
  | "fractional"
  | "ieee754"
  | "arithmetic";
export type ArithmeticModeType =
  | "addition"
  | "subtraction"
  | "multiplication"
  | "division"
  | "shifting"
  | "compare";
export type NegativeStepMode = "twos" | "ones" | "sign";

export interface IntegerConverterState {
  inputValue: string;
  sourceBase: BaseType;
  targetBase: BaseType;
}

export interface NegativeNumbersState {
  inputValue: string;
  activeMode: NegativeStepMode;
}

export interface FractionalConverterState {
  inputValue: string;
  converterMode: "decToBin" | "binToDec";
}

export interface IEEE754ConverterState {
  inputValue: string;
  converterMode: "decToIeee" | "ieeeToDec";
}

export interface ArithmeticModeState {
  activeSubMode: ArithmeticModeType;
  valA: string;
  valB: string;
}

export interface NumberSystemState {
  activeMode: SimulatorMode;
  integers?: IntegerConverterState;
  negative?: NegativeNumbersState;
  fractional?: FractionalConverterState;
  ieee754?: IEEE754ConverterState;
  arithmetic?: ArithmeticModeState;
}

function parseNumberSystemState(serializedValue: string): NumberSystemState {
  let cleaned = serializedValue.replace(/[^A-Za-z0-9+/=_-]/g, "");
  const prefixIndex = cleaned.indexOf("djF8");
  if (prefixIndex > 0) {
    cleaned = cleaned.substring(prefixIndex);
  }
  let base64 = cleaned.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const decodedStr = decodeURIComponent(escape(atob(base64)));

  if (decodedStr.startsWith("{")) {
    const parsed = JSON.parse(decodedStr) as Partial<NumberSystemState>;
    if (!parsed || !parsed.activeMode) {
      throw new Error("Invalid state");
    }
    return parsed as NumberSystemState;
  }

  const parts = decodedStr.split("|");
  if (parts[0] !== "v1") {
    throw new Error("Unsupported format version");
  }

  const modeChar = parts[1];
  const state: NumberSystemState = { activeMode: "integers" };

  // Map back
  const bFromC: Record<string, BaseType> = {
    d: "dec",
    b: "bin",
    o: "oct",
    h: "hex",
  };
  const nFromC: Record<string, NegativeStepMode> = {
    t: "twos",
    o: "ones",
    s: "sign",
  };
  const aFromC: Record<string, ArithmeticModeType> = {
    a: "addition",
    s: "subtraction",
    m: "multiplication",
    d: "division",
    h: "shifting",
    e: "addition", // Fallback for old states
    c: "compare",
  };

  if (modeChar === "i") {
    state.activeMode = "integers";
    if (parts.length >= 5) {
      state.integers = {
        sourceBase: bFromC[parts[2]] || "dec",
        targetBase: bFromC[parts[3]] || "bin",
        inputValue: parts.slice(4).join("|"),
      };
    }
  } else if (modeChar === "n") {
    state.activeMode = "negative";
    if (parts.length >= 4) {
      state.negative = {
        activeMode: nFromC[parts[2]] || "twos",
        inputValue: parts.slice(3).join("|"),
      };
    }
  } else if (modeChar === "f") {
    state.activeMode = "fractional";
    if (parts.length >= 4) {
      state.fractional = {
        converterMode: parts[2] === "d" ? "decToBin" : "binToDec",
        inputValue: parts.slice(3).join("|"),
      };
    }
  } else if (modeChar === "e") {
    state.activeMode = "ieee754";
    if (parts.length >= 4) {
      state.ieee754 = {
        converterMode: parts[2] === "d" ? "decToIeee" : "ieeeToDec",
        inputValue: parts.slice(3).join("|"),
      };
    }
  } else if (modeChar === "a") {
    state.activeMode = "arithmetic";
    if (parts.length >= 5) {
      state.arithmetic = {
        activeSubMode: aFromC[parts[2]] || "addition",
        valA: parts[3],
        valB: parts.slice(4).join("|"),
      };
    }
  } else {
    throw new Error("Invalid mode");
  }

  return state;
}

export const nsTransferCodec: ISimulatorTransferCodec<NumberSystemState> = {
  async exportValue(value: NumberSystemState): Promise<string> {
    try {
      const parts: string[] = ["v1"];

      // Map bases
      const bToC: Record<BaseType, string> = {
        dec: "d",
        bin: "b",
        oct: "o",
        hex: "h",
      };
      // Map modes
      const nToC: Record<NegativeStepMode, string> = {
        twos: "t",
        ones: "o",
        sign: "s",
      };
      const aToC: Record<ArithmeticModeType, string> = {
        addition: "a",
        subtraction: "s",
        multiplication: "m",
        division: "d",
        shifting: "h",
        compare: "c",
      };

      switch (value.activeMode) {
        case "integers": {
          parts.push("i");
          if (value.integers) {
            parts.push(bToC[value.integers.sourceBase]);
            parts.push(bToC[value.integers.targetBase]);
            parts.push(value.integers.inputValue);
          }
          break;
        }
        case "negative": {
          parts.push("n");
          if (value.negative) {
            parts.push(nToC[value.negative.activeMode]);
            parts.push(value.negative.inputValue);
          }
          break;
        }
        case "fractional": {
          parts.push("f");
          if (value.fractional) {
            parts.push(
              value.fractional.converterMode === "decToBin" ? "d" : "b",
            );
            parts.push(value.fractional.inputValue);
          }
          break;
        }
        case "ieee754": {
          parts.push("e");
          if (value.ieee754) {
            parts.push(value.ieee754.converterMode === "decToIeee" ? "d" : "i");
            parts.push(value.ieee754.inputValue);
          }
          break;
        }
        case "arithmetic": {
          parts.push("a");
          if (value.arithmetic) {
            parts.push(aToC[value.arithmetic.activeSubMode]);
            parts.push(value.arithmetic.valA);
            parts.push(value.arithmetic.valB);
          }
          break;
        }
      }

      const rawStr = parts.join("|");
      return btoa(unescape(encodeURIComponent(rawStr)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    } catch {
      throw new Error("Failed to export number systems state");
    }
  },

  async importValue(serializedValue: string): Promise<NumberSystemState> {
    try {
      return parseNumberSystemState(serializedValue);
    } catch {
      throw new Error("Failed to import number systems state");
    }
  },
};
