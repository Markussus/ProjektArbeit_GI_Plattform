import { useTranslation } from "react-i18next";
import { useIEEE754Converter } from "./useIEEE754Converter";
import {
  ConverterCard,
  ExplanationPanel,
  IeeeInputField,
  ModeToggle,
  ResultSection,
  SpecialCaseBanner,
} from "./IEEE754ConverterParts";
import { getExpectedResult } from "./ieee754ConverterUtils";
import type { IEEE754ConverterState } from "./nsTransferCodec";

interface IEEE754ConverterProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  onExitExercise?: () => void;
  initialValue?: string;
  initialConverterMode?: "decToIeee" | "ieeeToDec";
  initialState?: IEEE754ConverterState;
  onChangeState?: (state: IEEE754ConverterState) => void;
}

export function IEEE754Converter({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
  onExitExercise,
  initialValue = "",
  initialConverterMode = "decToIeee",
  initialState,
  onChangeState,
}: IEEE754ConverterProps) {
  const { t } = useTranslation("translation");
  const {
    inputValue,
    setInputValue,
    converterMode,
    setConverterMode,
    locked,
    ...analysis
  } = useIEEE754Converter({
    isExerciseMode,
    showSolution,
    initialValue,
    initialConverterMode,
    initialState,
    onChangeState,
  });

  const handleModeChange = (mode: "decToIeee" | "ieeeToDec") => {
    setConverterMode(mode);
    setInputValue(
      mode === "decToIeee" ? "12.5" : "0 10000010 10010000000000000000000",
    );
  };

  return (
    <div className="animate-in fade-in zoom-in-95 space-y-8 duration-300">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Converter Inputs */}
        <div className="flex flex-col gap-6">
          <ConverterCard
            title={t("number-systems.simulator.numbers.ieeeTitle")}
          >
            <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div />
              <ModeToggle mode={converterMode} onChange={handleModeChange} />
            </div>

            <div className="space-y-6">
              <IeeeInputField
                mode={converterMode}
                value={inputValue}
                onChange={setInputValue}
                locked={locked}
              />
              <ResultSection
                mode={converterMode}
                analysis={analysis}
                locked={locked}
              />
            </div>
          </ConverterCard>

          {!locked && (
            <SpecialCaseBanner mode={converterMode} analysis={analysis} />
          )}
        </div>

        <ExplanationPanel
          mode={converterMode}
          analysis={analysis}
          locked={locked}
          expectedResult={getExpectedResult(analysis, converterMode)}
          onShowSolution={onShowSolution}
          onExitExercise={onExitExercise}
        />
      </div>
    </div>
  );
}
