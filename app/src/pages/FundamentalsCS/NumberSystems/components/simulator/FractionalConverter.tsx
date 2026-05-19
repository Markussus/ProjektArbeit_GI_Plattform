import { useState, useEffect, useMemo } from "react";
import { Info, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExerciseValidationPanel } from "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel";

interface FractionalConverterProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  onExitExercise?: () => void;
  initialValue?: string;
}

export function FractionalConverter({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
  onExitExercise,
  initialValue = "",
}: FractionalConverterProps) {
  const { t } = useTranslation("translation");
  const [inputValue, setInputValue] = useState<string>("10.5");
  const [converterMode, setConverterMode] = useState<"decToBin" | "binToDec">(
    "decToBin",
  );

  useEffect(() => {
    if (initialValue) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputValue(initialValue);
    }
  }, [initialValue]);

  const handleInputChange = (v: string) => {
    if (isExerciseMode && !showSolution) return;

    let cleanV = v;
    if (converterMode === "decToBin") {
      cleanV = cleanV.replace(/[^0-9.-]/g, "");
    } else {
      cleanV = cleanV.replace(/[^01.-]/g, "");
    }

    // Ensure only one minus at the start
    if (cleanV.indexOf("-") > 0) {
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
    if (cleanV.length > 20) {
      cleanV = cleanV.slice(0, 20);
    }

    setInputValue(cleanV);
  };

  // Compute conversion steps
  const conversionData = useMemo(() => {
    if (!inputValue || inputValue === "-" || inputValue === ".") return null;

    const isNegative = inputValue.startsWith("-");
    const absValueStr = isNegative ? inputValue.substring(1) : inputValue;

    const parts = absValueStr.split(".");
    const intPartStr = parts[0] || "0";
    const fracPartStr = parts[1] || "0";

    if (converterMode === "decToBin") {
      // Process integer part
      let intVal = parseInt(intPartStr, 10);
      if (isNaN(intVal)) intVal = 0;

      const intSteps: { dividend: number; remainder: number }[] = [];
      let currentInt = intVal;

      if (currentInt === 0) {
        intSteps.push({ dividend: 0, remainder: 0 });
      } else {
        while (currentInt > 0) {
          intSteps.push({
            dividend: currentInt,
            remainder: currentInt % 2,
          });
          currentInt = Math.floor(currentInt / 2);
        }
      }

      const binIntPart =
        intSteps.length > 0
          ? [...intSteps]
              .reverse()
              .map((s) => s.remainder)
              .join("")
          : "0";

      // Process fractional part
      let currentFrac = parseFloat("0." + fracPartStr);
      const fracSteps: { value: number; multResult: number; bit: number }[] =
        [];
      const MAX_FRAC_STEPS = 10;

      while (currentFrac > 0 && fracSteps.length < MAX_FRAC_STEPS) {
        const multResult = currentFrac * 2;
        const bit = Math.floor(multResult);
        fracSteps.push({
          value: currentFrac,
          multResult,
          bit,
        });
        currentFrac = multResult - bit;
      }

      const binFracPart =
        fracSteps.length > 0 ? fracSteps.map((s) => s.bit).join("") : "0";

      let binFracDisplay = binFracPart;
      if (fracSteps.length === MAX_FRAC_STEPS && currentFrac > 0) {
        binFracDisplay += "...";
      }

      const finalBinary = `${isNegative ? "-" : ""}${binIntPart}.${binFracPart}`;

      return {
        mode: "decToBin" as const,
        isNegative,
        intVal,
        fracVal: parseFloat("0." + fracPartStr),
        intSteps,
        binIntPart,
        fracSteps,
        binFracPart,
        binFracDisplay,
        finalResult: finalBinary,
        expectedBinary: finalBinary,
      };
    } else {
      // Process integer part (binary -> decimal)
      const binIntSteps: { bit: number; pos: number; powVal: number }[] = [];
      let intDecVal = 0;
      const intLen = intPartStr.length;

      for (let i = 0; i < intLen; i++) {
        const bit = parseInt(intPartStr[i], 10);
        const pos = intLen - 1 - i;
        const powVal = bit * Math.pow(2, pos);
        if (bit === 1) {
          binIntSteps.push({ bit, pos, powVal });
        }
        intDecVal += powVal;
      }

      // Process fractional part (binary -> decimal)
      const binFracSteps: { bit: number; pos: number; powVal: number }[] = [];
      let fracDecVal = 0;
      const fracLen = fracPartStr.length;

      for (let i = 0; i < fracLen; i++) {
        const bit = parseInt(fracPartStr[i], 10);
        const pos = -(i + 1);
        const powVal = bit * Math.pow(2, pos);
        if (bit === 1) {
          binFracSteps.push({ bit, pos, powVal });
        }
        fracDecVal += powVal;
      }

      const totalDec = intDecVal + fracDecVal;
      const finalDecimal = `${isNegative && totalDec > 0 ? "-" : ""}${totalDec}`;

      return {
        mode: "binToDec" as const,
        isNegative,
        binIntPart: intPartStr,
        binFracPart: fracPartStr,
        binIntSteps,
        intDecVal,
        binFracSteps,
        fracDecVal,
        totalDec,
        finalResult: finalDecimal,
        expectedBinary: finalDecimal,
      };
    }
  }, [inputValue, converterMode]);

  const isValidInput = conversionData !== null;

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
                    ? t("simulator.numbers.fracTitle")
                    : t("simulator.numbers.fracBinToDecTitle")}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {converterMode === "decToBin"
                    ? t("simulator.numbers.fracDesc")
                    : t("simulator.numbers.fracBinToDecDesc")}
                </p>
              </div>

              <div className="bg-muted mb-2 flex shrink-0 rounded-md p-1 sm:mb-0">
                <button
                  data-testid="ns-frac-dec-to-bin-button"
                  onClick={() => {
                    if (!isExerciseMode) {
                      setConverterMode("decToBin");
                      setInputValue("10.5");
                    }
                  }}
                  disabled={isExerciseMode}
                  className={`rounded-sm px-3 py-1.5 text-xs font-medium ${converterMode === "decToBin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"} ${isExerciseMode && "cursor-not-allowed opacity-50"}`}
                >
                  {t("simulator.numbers.fracModeDecToBin")}
                </button>
                <button
                  data-testid="ns-frac-bin-to-dec-button"
                  onClick={() => {
                    if (!isExerciseMode) {
                      setConverterMode("binToDec");
                      setInputValue("1010.1");
                    }
                  }}
                  disabled={isExerciseMode}
                  className={`rounded-sm px-3 py-1.5 text-xs font-medium ${converterMode === "binToDec" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"} ${isExerciseMode && "cursor-not-allowed opacity-50"}`}
                >
                  {t("simulator.numbers.fracModeBinToDec")}
                </button>
              </div>
            </div>

            <div>
              <label className="text-muted-foreground mb-2 block text-sm font-medium">
                {t("simulator.numbers.valueLabel")}
              </label>
              <input
                type="text"
                data-testid="ns-fractional-input"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={isExerciseMode && !showSolution}
                className="bg-background text-foreground placeholder:text-muted-foreground/50 border-input focus:border-primary focus:ring-primary/20 w-full max-w-xs rounded-md border px-3 py-2 font-mono text-sm focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
                    {t("simulator.numbers.fracResult")}
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
                      {conversionData.finalResult}
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
                  {t("simulator.numbers.conceptPath")}
                </h3>

                {!isValidInput ? (
                  <div className="text-muted-foreground flex items-center justify-center p-8 text-sm">
                    {t("simulator.numbers.enterValue")}
                  </div>
                ) : conversionData.mode === "decToBin" ? (
                  <div className="divide-border/50 flex flex-col divide-y">
                    {/* Integer Part Conversion */}
                    <div className="p-6">
                      <h4 className="text-foreground mb-4 font-semibold">
                        1. {t("simulator.numbers.fracIntPart")}{" "}
                        {conversionData.intVal}
                      </h4>
                      <p className="text-muted-foreground mb-4 text-sm">
                        {t("simulator.numbers.decToBinDesc")}
                      </p>

                      <div className="overflow-x-auto">
                        {conversionData.intSteps.length > 0 ? (
                          <div className="inline-flex flex-col gap-2 font-mono text-sm">
                            {conversionData.intSteps.map((step, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-4"
                              >
                                <div className="flex w-32 justify-end">
                                  {step.dividend} ÷ 2 ={" "}
                                  {Math.floor(step.dividend / 2)}
                                </div>
                                <div className="text-muted-foreground">
                                  {t("simulator.numbers.remainder")}
                                </div>
                                <div className="bg-brand/10 text-brand flex h-6 w-6 items-center justify-center rounded font-bold">
                                  {step.remainder}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="font-mono text-sm">0 = 0</div>
                        )}

                        <div className="mt-6 flex items-center gap-3">
                          <span className="text-muted-foreground text-sm">
                            {t("simulator.numbers.resultLabel")}
                          </span>
                          <span className="bg-muted text-foreground rounded px-3 py-1.5 font-mono font-medium tracking-wider">
                            {conversionData.binIntPart}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fractional Part Conversion */}
                    <div className="p-6">
                      <h4 className="text-foreground mb-4 font-semibold">
                        2. {t("simulator.numbers.fracFractPart")}{" "}
                        {conversionData.fracVal}
                      </h4>

                      <div className="overflow-x-auto">
                        {conversionData.fracSteps.length > 0 ? (
                          <div className="inline-flex flex-col gap-2 font-mono text-sm">
                            {conversionData.fracSteps.map((step, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-4"
                              >
                                <div className="flex w-40 justify-end">
                                  {step.value} × 2 ={" "}
                                  {step.multResult
                                    .toFixed(3)
                                    .replace(/\.?0+$/, "")}
                                </div>
                                <ArrowRight className="text-muted-foreground h-4 w-4" />
                                <div className="text-muted-foreground">
                                  {t("simulator.numbers.fracIntPart")}
                                </div>
                                <div className="bg-brand/10 text-brand flex h-6 w-6 items-center justify-center rounded font-bold">
                                  {step.bit}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="font-mono text-sm">0 = 0</div>
                        )}

                        <div className="mt-6 flex items-center gap-3">
                          <span className="text-muted-foreground text-sm">
                            {t("simulator.numbers.resultLabel")}
                          </span>
                          <span className="bg-muted text-foreground rounded px-3 py-1.5 font-mono font-medium tracking-wider">
                            0.{conversionData.binFracDisplay}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="divide-border/50 flex flex-col divide-y">
                    {/* Integer Part Conversion (bin to dec) */}
                    <div className="p-6">
                      <h4 className="text-foreground mb-4 font-semibold">
                        {t("simulator.numbers.fracSumInt")}
                      </h4>
                      <p className="text-muted-foreground mb-4 text-sm">
                        {t("simulator.numbers.fracSumPowers")}
                      </p>

                      <div className="overflow-x-auto">
                        {conversionData.binIntSteps.length > 0 ? (
                          <div className="inline-flex flex-col gap-2 font-mono text-sm">
                            {conversionData.binIntSteps.map((step, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-4"
                              >
                                <div className="flex w-32 justify-end">
                                  {step.bit} × 2^{step.pos}
                                </div>
                                <div className="text-muted-foreground">=</div>
                                <div className="bg-brand/10 text-brand flex h-6 min-w-8 items-center justify-center rounded px-2 font-bold">
                                  {step.powVal}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="font-mono text-sm">0 = 0</div>
                        )}

                        <div className="mt-6 flex items-center gap-3">
                          <span className="text-muted-foreground text-sm">
                            {t("simulator.numbers.resultLabel")}
                          </span>
                          <span className="bg-muted text-foreground rounded px-3 py-1.5 font-mono font-medium tracking-wider">
                            {conversionData.intDecVal}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fractional Part Conversion (bin to dec) */}
                    <div className="p-6">
                      <h4 className="text-foreground mb-4 font-semibold">
                        {t("simulator.numbers.fracSumFrac")}
                      </h4>

                      <div className="overflow-x-auto">
                        {conversionData.binFracSteps.length > 0 ? (
                          <div className="inline-flex flex-col gap-2 font-mono text-sm">
                            {conversionData.binFracSteps.map((step, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-4"
                              >
                                <div className="flex w-32 justify-end">
                                  {step.bit} × 2^{step.pos}
                                </div>
                                <div className="text-muted-foreground">=</div>
                                <div className="bg-brand/10 text-brand flex h-6 min-w-8 items-center justify-center rounded px-2 font-bold">
                                  {step.powVal}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="font-mono text-sm">0 = 0</div>
                        )}

                        <div className="mt-6 flex items-center gap-3">
                          <span className="text-muted-foreground text-sm">
                            {t("simulator.numbers.resultLabel")}
                          </span>
                          <span className="bg-muted text-foreground rounded px-3 py-1.5 font-mono font-medium tracking-wider">
                            {conversionData.fracDecVal}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
