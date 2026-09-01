import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";

export type BaseType = "dec" | "bin" | "oct" | "hex";
export type SimulatorMode =
  "integers" | "negative" | "fractional" | "ieee754" | "arithmetic";
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

import {
  buildTransferString,
  encodeBase64UrlSafe,
  parseNumberSystemState,
} from "./nsTransferCodecUtils";

export const nsTransferCodec: ISimulatorTransferCodec<NumberSystemState> = {
  async exportValue(value: NumberSystemState): Promise<string> {
    try {
      return encodeBase64UrlSafe(buildTransferString(value));
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
