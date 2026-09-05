import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { NegativeNumbersState, NegativeStepMode } from "./nsTransferCodec";
import {
  getNegativeNumberConversions,
  isValid8Bit,
  parse8Bit,
} from "./negativeNumbersUtils";
import { ExplanationPanel, InputPanel } from "./NegativeNumbersParts";

interface NegativeNumbersProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  onExitExercise?: () => void;
  initialValue?: string;
  initialState?: NegativeNumbersState;
  onChangeState?: (state: NegativeNumbersState) => void;
}

export function NegativeNumbers({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
  onExitExercise,
  initialValue = "",
  initialState,
  onChangeState,
}: NegativeNumbersProps) {
  useTranslation("translation");
  const [inputValue, setInputValue] = useState<string>(
    initialState?.inputValue ?? (initialValue || "-5"),
  );
  const [activeMode, setActiveMode] = useState<NegativeStepMode>(
    initialState?.activeMode ?? "twos",
  );

  const locked = !!isExerciseMode && !showSolution;

  useEffect(() => {
    onChangeState?.({ inputValue, activeMode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, activeMode]);

  const parsed = parse8Bit(inputValue);
  const isValid = isValid8Bit(inputValue);
  const conversions = getNegativeNumberConversions(parsed);

  return (
    <div className="animate-in fade-in zoom-in-95 space-y-8 duration-300">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <InputPanel
          inputValue={inputValue}
          locked={locked}
          isValid={isValid}
          onChange={setInputValue}
          conversions={conversions}
          activeMode={activeMode}
          onModeChange={setActiveMode}
        />

        <ExplanationPanel
          conversions={conversions}
          activeMode={activeMode}
          parsed={parsed}
          isValid={isValid}
          locked={locked}
          onShowSolution={onShowSolution}
          onExitExercise={onExitExercise}
        />
      </div>
    </div>
  );
}
