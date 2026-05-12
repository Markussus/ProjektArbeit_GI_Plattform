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

  useEffect(() => {
    if (isExerciseMode && initialValue) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputValue(initialValue);
    }
  }, [isExerciseMode, initialValue]);

  const handleInputChange = (v: string) => {
    if (isExerciseMode && !showSolution) return;

    // Allow digits, one dot, and one optional minus at the start
    let cleanV = v.replace(/[^0-9.-]/g, "");
    
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
    if (cleanV.length > 15) {
      cleanV = cleanV.slice(0, 15);
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
    
    const binIntPart = intSteps.length > 0 
      ? [...intSteps].reverse().map(s => s.remainder).join("") 
      : "0";

    // Process fractional part
    let currentFrac = parseFloat("0." + fracPartStr);
    const fracSteps: { value: number; multResult: number; bit: number }[] = [];
    const MAX_FRAC_STEPS = 10;
    
    // Limit to 10 steps to prevent infinite loops for numbers like 0.1
    while (currentFrac > 0 && fracSteps.length < MAX_FRAC_STEPS) {
      const multResult = currentFrac * 2;
      const bit = Math.floor(multResult);
      fracSteps.push({
        value: currentFrac,
        multResult,
        bit
      });
      currentFrac = multResult - bit;
    }
    
    const binFracPart = fracSteps.length > 0
      ? fracSteps.map(s => s.bit).join("")
      : "0";
      
    // Handle special cases
    let binFracDisplay = binFracPart;
    if (fracSteps.length === MAX_FRAC_STEPS && currentFrac > 0) {
      binFracDisplay += "..."; // Indicates it continues
    }

    const finalBinary = `${isNegative ? "-" : ""}${binIntPart}.${binFracPart}`;
    const expectedBinary = finalBinary;

    return {
      isNegative,
      intVal,
      fracVal: parseFloat("0." + fracPartStr),
      intSteps,
      binIntPart,
      fracSteps,
      binFracPart,
      binFracDisplay,
      finalBinary,
      expectedBinary
    };
  }, [inputValue]);

  const isValidInput = conversionData !== null;

  return (
    <div className="animate-in fade-in zoom-in-95 space-y-8 duration-300">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Left Column: Controls & Result */}
        <div className="flex flex-col gap-6">
          <div className="bg-card border-border/50 flex flex-col gap-4 rounded-xl border p-6 shadow-sm">
        <div>
          <h3 className="text-foreground font-semibold">
            {t("simulator.numbers.fracTitle")}
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("simulator.numbers.fracDesc")}
          </p>
        </div>

        <div>
          <label className="text-muted-foreground mb-2 block text-sm font-medium">
            {t("simulator.numbers.valueLabel")}
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={isExerciseMode && !showSolution}
            className="bg-background text-foreground placeholder:text-muted-foreground/50 w-full max-w-xs rounded-md border border-input px-3 py-2 font-mono text-sm focus:border-primary focus:ring-primary/20 focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="e.g. 10.5"
          />
          </div>
        </div>


          {/* Combined Result Display (Left Side) */}
          {(!isExerciseMode || showSolution) && isValidInput && conversionData && (
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
                  <div className="bg-brand text-brand-foreground rounded-lg px-6 py-2 font-mono font-bold tracking-wider shadow-sm">
                    {conversionData.finalBinary}
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
                ) : (
                  <div className="divide-border/50 flex flex-col divide-y">
                    {/* Integer Part Conversion */}
                    <div className="p-6">
                      <h4 className="text-foreground mb-4 font-semibold">
                        1. {t("simulator.numbers.fracIntPart")} {conversionData.intVal}
                      </h4>
                      <p className="text-muted-foreground mb-4 text-sm">
                        {t("simulator.numbers.decToBinDesc")}
                      </p>
                      
                      <div className="overflow-x-auto">
                        {conversionData.intSteps.length > 0 ? (
                          <div className="inline-flex flex-col gap-2 font-mono text-sm">
                            {conversionData.intSteps.map((step, idx) => (
                              <div key={idx} className="flex items-center gap-4">
                                <div className="flex w-32 justify-end">
                                  {step.dividend} ÷ 2 = {Math.floor(step.dividend / 2)}
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
                        2. {t("simulator.numbers.fracFractPart")} {conversionData.fracVal}
                      </h4>
                      
                      <div className="overflow-x-auto">
                        {conversionData.fracSteps.length > 0 ? (
                          <div className="inline-flex flex-col gap-2 font-mono text-sm">
                            {conversionData.fracSteps.map((step, idx) => (
                              <div key={idx} className="flex items-center gap-4">
                                <div className="flex w-40 justify-end">
                                  {step.value} × 2 = {step.multResult.toFixed(3).replace(/\.?0+$/, '')}
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
                )}
              </>
            )}
            </div>
          </div>
        </div>
      </div>
  );
}
