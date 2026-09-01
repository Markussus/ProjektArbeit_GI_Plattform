import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { BaseType, IntegerConverterState } from "./nsTransferCodec";
import { ConverterInputPanel, ExplanationPanel } from "./IntegerConverterParts";
import {
  formatDecValue,
  formatTargetValue,
  sanitizeInput,
} from "./integerConverterUtils";

interface IntegerConverterProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  onExitExercise?: () => void;
  initialValue?: string;
  initialBase?: BaseType;
  initialTargetBase?: BaseType;
  initialState?: IntegerConverterState;
  onChangeState?: (state: IntegerConverterState) => void;
}

export function IntegerConverter({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
  onExitExercise,
  initialValue = "",
  initialBase = "dec",
  initialTargetBase = "bin",
  initialState,
  onChangeState,
}: IntegerConverterProps) {
  useTranslation("translation");
  const locked = !!isExerciseMode && !showSolution;
  const [sourceBase, setSourceBase] = useState<BaseType>(
    locked ? initialBase : (initialState?.sourceBase ?? initialBase),
  );
  const [targetBase, setTargetBase] = useState<BaseType>(
    locked
      ? initialTargetBase
      : (initialState?.targetBase ?? initialTargetBase),
  );
  const [inputValue, setInputValue] = useState<string>(
    locked ? initialValue : (initialState?.inputValue ?? initialValue),
  );

  useEffect(() => {
    onChangeState?.({ inputValue, sourceBase, targetBase });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, sourceBase, targetBase]);

  const handleSourceBaseChange = (newBase: BaseType) => {
    setSourceBase(newBase);
    setInputValue(sanitizeInput(inputValue, newBase));
  };

  const handleInputChange = (v: string) => {
    if (isExerciseMode && !showSolution) return;
    setInputValue(sanitizeInput(v, sourceBase));
  };

  const decValue = useMemo(
    () => formatDecValue(inputValue, sourceBase),
    [inputValue, sourceBase],
  );
  const targetValue = useMemo(
    () => formatTargetValue(decValue, targetBase),
    [decValue, targetBase],
  );

  return (
    <div className="animate-in fade-in zoom-in-95 space-y-8 duration-300">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ConverterInputPanel
          sourceBase={sourceBase}
          targetBase={targetBase}
          inputValue={inputValue}
          locked={locked}
          isExerciseMode={isExerciseMode}
          showSolution={showSolution}
          initialBase={initialBase}
          onSourceBaseChange={handleSourceBaseChange}
          onTargetBaseChange={setTargetBase}
          onInputChange={handleInputChange}
          decValue={decValue}
          targetValue={targetValue}
        />

        <ExplanationPanel
          locked={locked}
          sourceBase={sourceBase}
          targetBase={targetBase}
          decValue={decValue}
          targetValue={targetValue}
          inputValue={inputValue}
          onShowSolution={onShowSolution}
          onExitExercise={onExitExercise}
        />
      </div>
    </div>
  );
}
