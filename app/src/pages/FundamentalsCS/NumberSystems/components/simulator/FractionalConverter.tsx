import { Info, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExerciseValidationPanel } from "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel";
import {
  DecToBinExplanation,
  BinToDecExplanation,
} from "./FractionalConverterExplanation";
import { useFractionalConverter } from "./useFractionalConverter";

interface FractionalConverterProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  onExitExercise?: () => void;
  initialValue?: string;
  initialState?: import("./nsTransferCodec").FractionalConverterState;
  onChangeState?: (
    state: import("./nsTransferCodec").FractionalConverterState,
  ) => void;
}

export function FractionalConverter({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
  onExitExercise,
  initialValue = "",
  initialState,
  onChangeState,
}: FractionalConverterProps) {
  const { t } = useTranslation("translation");
  const {
    inputValue,
    converterMode,
    locked,
    conversionData,
    isValidInput,
    handleInputChange,
    handleSetDecToBin,
    handleSetBinToDec,
  } = useFractionalConverter({
    isExerciseMode,
    showSolution,
    initialValue,
    initialState,
    onChangeState,
  });

  return (
    <div className="animate-in fade-in zoom-in-95 space-y-8 duration-300">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Left Column: Controls & Result */}
        <div className="flex flex-col gap-6">
          <div className="bg-card border-border/50 flex flex-col gap-4 rounded-xl border p-6 shadow-sm">
            <div className="mb-2 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-foreground font-semibold">
                  {converterMode === "decToBin"
                    ? t("number-systems.simulator.numbers.fracTitle")
                    : t("number-systems.simulator.numbers.fracBinToDecTitle")}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {converterMode === "decToBin"
                    ? t("number-systems.simulator.numbers.fracDesc")
                    : t("number-systems.simulator.numbers.fracBinToDecDesc")}
                </p>
              </div>

              <div className="bg-muted mb-2 flex shrink-0 rounded-md p-1 sm:mb-0">
                <button
                  data-testid="ns-frac-dec-to-bin-button"
                  onClick={handleSetDecToBin}
                  disabled={isExerciseMode}
                  className={`rounded-sm px-3 py-1.5 text-xs font-medium ${converterMode === "decToBin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"} ${isExerciseMode && "cursor-not-allowed opacity-50"}`}
                >
                  {t("number-systems.simulator.numbers.fracModeDecToBin")}
                </button>
                <button
                  data-testid="ns-frac-bin-to-dec-button"
                  onClick={handleSetBinToDec}
                  disabled={isExerciseMode}
                  className={`rounded-sm px-3 py-1.5 text-xs font-medium ${converterMode === "binToDec" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"} ${isExerciseMode && "cursor-not-allowed opacity-50"}`}
                >
                  {t("number-systems.simulator.numbers.fracModeBinToDec")}
                </button>
              </div>
            </div>

            <div>
              <label className="text-muted-foreground mb-2 block text-sm font-medium">
                {t("number-systems.simulator.numbers.valueLabel")}
              </label>
              <input
                type="text"
                data-testid="ns-fractional-input"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={locked}
                className={`bg-background text-foreground w-full max-w-xs rounded-md border px-3 py-2 font-mono text-sm disabled:cursor-not-allowed disabled:opacity-50 ${locked ? "border-input bg-muted" : "border-input focus:ring-primary/20 focus:ring-1 focus:outline-none"}`}
                placeholder="e.g. 10.5"
              />
            </div>
          </div>

          {/* Combined Result Display (Left Side) */}
          {(!isExerciseMode || showSolution) &&
            isValidInput &&
            conversionData && (
              <div className="bg-card border-border/50 overflow-hidden rounded-xl border shadow-sm">
                <div className="bg-muted/30 border-border/50 border-b p-4">
                  <h4 className="text-foreground font-semibold">
                    {t("number-systems.simulator.numbers.fracResult")}
                  </h4>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-4 text-lg">
                    <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2 font-mono">
                      {inputValue}
                    </div>
                    <ArrowRight className="text-muted-foreground h-5 w-5" />
                    <div
                      data-testid="ns-fractional-result"
                      className="bg-brand text-brand-foreground rounded-lg px-6 py-2 font-mono font-bold tracking-wider shadow-sm"
                    >
                      {conversionData!.finalResult}
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Right Column: Explanation Panel */}
        <div className="flex flex-col gap-6">
          <div className="bg-muted/30 border-border/50 max-h-200 overflow-auto rounded-xl border p-6 shadow-sm xl:max-h-150">
            {isExerciseMode && !showSolution ? (
              conversionData && (
                <ExerciseValidationPanel
                  expectedResult={conversionData.expectedBinary}
                  onShowSolution={onShowSolution!}
                  onExitExercise={onExitExercise}
                  inputMode="float"
                  placeholder="e.g. 1010.1 or -1010.1"
                />
              )
            ) : (
              <>
                <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Info className="text-primary h-5 w-5" />
                  {t("number-systems.simulator.numbers.conceptPath")}
                </h3>

                {!isValidInput ? (
                  <div className="text-muted-foreground flex items-center justify-center p-8 text-sm">
                    {t("number-systems.simulator.numbers.enterValue")}
                  </div>
                ) : conversionData!.mode === "decToBin" ? (
                  <DecToBinExplanation data={conversionData!} />
                ) : (
                  <BinToDecExplanation data={conversionData!} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
