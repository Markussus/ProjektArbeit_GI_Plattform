import { useEffect, useMemo, useState } from "react";
import type { FractionalConverterState } from "./nsTransferCodec";
import { computeFractionalConversion } from "./fractionalConversion";

export interface UseFractionalConverterOptions {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  initialValue?: string;
  initialState?: FractionalConverterState;
  onChangeState?: (state: FractionalConverterState) => void;
}

export interface UseFractionalConverterResult {
  inputValue: string;
  converterMode: "decToBin" | "binToDec";
  locked: boolean;
  conversionData: ReturnType<typeof computeFractionalConversion>;
  isValidInput: boolean;
  handleInputChange: (v: string) => void;
  handleSetDecToBin: () => void;
  handleSetBinToDec: () => void;
}

const DEFAULT_VALUE = "10.5";
const DEFAULT_BIN_VALUE = "1010.1";
const MAX_INPUT_LENGTH = 20;

function resolveInitialInputValue(
  locked: boolean,
  initialValue: string,
  initialState?: FractionalConverterState,
): string {
  if (locked) {
    return initialValue || DEFAULT_VALUE;
  }
  return initialState?.inputValue ?? (initialValue || DEFAULT_VALUE);
}

function resolveInitialConverterMode(
  locked: boolean,
  initialState?: FractionalConverterState,
): "decToBin" | "binToDec" {
  if (locked) {
    return "decToBin";
  }
  return initialState?.converterMode ?? "decToBin";
}

export function sanitizeFractionalInput(
  v: string,
  converterMode: "decToBin" | "binToDec",
): string {
  let cleanV = v;
  if (converterMode === "decToBin") {
    cleanV = cleanV.replace(/[^0-9.-]/g, "");
  } else {
    cleanV = cleanV.replace(/[^01.-]/g, "");
  }

  // Ensure only one minus at the start
  const firstMinus = cleanV.indexOf("-");
  if (firstMinus > 0) {
    cleanV = cleanV.replace(/-/g, "");
  }
  const minusCount = (cleanV.match(/-/g) || []).length;
  if (minusCount > 1) {
    cleanV = "-" + cleanV.replace(/-/g, "");
  }

  // Ensure only one dot
  const parts = cleanV.split(".");
  if (parts.length > 2) {
    cleanV = parts[0] + "." + parts.slice(1).join("");
  }

  // Limit length to avoid huge computations
  if (cleanV.length > MAX_INPUT_LENGTH) {
    cleanV = cleanV.slice(0, MAX_INPUT_LENGTH);
  }

  return cleanV;
}

export function useFractionalConverter({
  isExerciseMode,
  showSolution = true,
  initialValue = "",
  initialState,
  onChangeState,
}: UseFractionalConverterOptions): UseFractionalConverterResult {
  const locked = !!isExerciseMode && !showSolution;

  const [inputValue, setInputValue] = useState<string>(() =>
    resolveInitialInputValue(locked, initialValue, initialState),
  );
  const [converterMode, setConverterMode] = useState<"decToBin" | "binToDec">(
    () => resolveInitialConverterMode(locked, initialState),
  );

  useEffect(() => {
    onChangeState?.({ inputValue, converterMode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, converterMode]);

  const handleInputChange = (v: string) => {
    if (isExerciseMode && !showSolution) return;

    setInputValue(sanitizeFractionalInput(v, converterMode));
  };

  const handleSetDecToBin = () => {
    if (isExerciseMode) return;
    setConverterMode("decToBin");
    setInputValue(DEFAULT_VALUE);
  };

  const handleSetBinToDec = () => {
    if (isExerciseMode) return;
    setConverterMode("binToDec");
    setInputValue(DEFAULT_BIN_VALUE);
  };

  const conversionData = useMemo(
    () => computeFractionalConversion(inputValue, converterMode),
    [inputValue, converterMode],
  );

  const isValidInput = conversionData !== null;

  return {
    inputValue,
    converterMode,
    locked,
    conversionData,
    isValidInput,
    handleInputChange,
    handleSetDecToBin,
    handleSetBinToDec,
  };
}
