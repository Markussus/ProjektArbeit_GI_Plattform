import { useState, useEffect, useMemo } from "react";
import { Info, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DropdownSelect } from "@/components/shared/DropdownSelect/DropdownSelect";
import { ExerciseValidationPanel } from "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel";
import type { ValidationInputMode } from "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel";

import type { BaseType, IntegerConverterState } from "./nsTransferCodec";

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
  const { t } = useTranslation("translation");
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

    let cleanV = inputValue;
    if (newBase === "bin") cleanV = cleanV.replace(/[^01]/g, "");
    else if (newBase === "oct") cleanV = cleanV.replace(/[^0-7]/g, "");
    else if (newBase === "dec") cleanV = cleanV.replace(/[^0-9]/g, "");
    else if (newBase === "hex") cleanV = cleanV.replace(/[^0-9A-Fa-f]/g, "");

    const limits = { bin: 16, oct: 6, dec: 5, hex: 4 };
    if (cleanV.length > limits[newBase]) {
      cleanV = cleanV.slice(0, limits[newBase]);
    }

    setInputValue(cleanV);
  };

  const handleInputChange = (v: string) => {
    if (isExerciseMode && !showSolution) return;

    let cleanV = v;
    if (sourceBase === "bin") cleanV = cleanV.replace(/[^01]/g, "");
    else if (sourceBase === "oct") cleanV = cleanV.replace(/[^0-7]/g, "");
    else if (sourceBase === "dec") cleanV = cleanV.replace(/[^0-9]/g, "");
    else if (sourceBase === "hex") cleanV = cleanV.replace(/[^0-9A-Fa-f]/g, "");

    const limits = { bin: 16, oct: 6, dec: 5, hex: 4 };
    if (cleanV.length > limits[sourceBase]) {
      cleanV = cleanV.slice(0, limits[sourceBase]);
    }

    setInputValue(cleanV);
  };

  const decValue = useMemo(() => {
    if (!inputValue) return "";
    try {
      if (sourceBase === "dec")
        return /^[0-9]+$/.test(inputValue)
          ? BigInt(inputValue).toString(10)
          : "";
      if (sourceBase === "bin")
        return /^[01]+$/.test(inputValue)
          ? BigInt("0b" + inputValue).toString(10)
          : "";
      if (sourceBase === "oct")
        return /^[0-7]+$/.test(inputValue)
          ? BigInt("0o" + inputValue).toString(10)
          : "";
      if (sourceBase === "hex")
        return /^[0-9A-Fa-f]+$/.test(inputValue)
          ? BigInt("0x" + inputValue).toString(10)
          : "";
    } catch {
      return "";
    }
    return "";
  }, [inputValue, sourceBase]);

  const targetValue = useMemo(() => {
    if (!decValue) return "";
    try {
      const bigIntVal = BigInt(decValue);
      if (targetBase === "dec") return decValue;
      if (targetBase === "bin") return bigIntVal.toString(2);
      if (targetBase === "oct") return bigIntVal.toString(8);
      if (targetBase === "hex") return bigIntVal.toString(16).toUpperCase();
    } catch {
      return "";
    }
    return "";
  }, [decValue, targetBase]);

  const baseToNumber = (base: BaseType) =>
    base === "dec" ? 10 : base === "bin" ? 2 : base === "oct" ? 8 : 16;
  const baseLabel = (base: BaseType) => {
    if (base === "dec") return t("number-systems.simulator.numbers.decimal");
    if (base === "bin") return t("number-systems.simulator.numbers.binary");
    if (base === "oct") return t("number-systems.simulator.numbers.octal");
    if (base === "hex") return t("number-systems.simulator.numbers.hex");
    return "";
  };

  // Generate division steps for Dec -> Base
  const generateDivisionSteps = (targetVal: number) => {
    if (!decValue) return [];
    try {
      let currentVal = BigInt(decValue);
      const baseVal = BigInt(targetVal);
      const steps = [];

      if (currentVal === 0n) {
        return [{ value: 0n, remainder: 0n, base: targetVal }];
      }

      while (currentVal > 0n) {
        const remainder = currentVal % baseVal;
        const nextVal = currentVal / baseVal;
        steps.push({ value: currentVal, remainder, base: targetVal });
        currentVal = nextVal;
      }
      return steps;
    } catch {
      return [];
    }
  };

  const generatePowerSteps = (sourceVal: number, rawInput: string) => {
    if (!rawInput) return [];

    // valid input must be cleaned to parse correctly based on base:
    const cleanInput = sourceVal === 16 ? rawInput.toUpperCase() : rawInput;

    const steps = [];
    const len = cleanInput.length;
    for (let i = 0; i < len; i++) {
      const digitChar = cleanInput[i];
      const power = len - 1 - i;
      const digitVal = BigInt(parseInt(digitChar, sourceVal));
      const termVal = digitVal * BigInt(sourceVal) ** BigInt(power);
      steps.push({
        digit: digitChar,
        digitVal,
        power,
        base: sourceVal,
        termVal,
      });
    }
    return steps;
  };

  const showToDecSteps = sourceBase !== "dec" && decValue !== "";
  const showFromDecSteps = targetBase !== "dec" && decValue !== "";

  const renderToDec = () => {
    const steps = generatePowerSteps(baseToNumber(sourceBase), inputValue);
    const isBin = sourceBase === "bin";

    return (
      <div className="space-y-3">
        <p className="text-foreground text-sm font-medium">
          {isBin
            ? t("number-systems.simulator.numbers.binToDec")
            : `${baseLabel(sourceBase)} ${t("number-systems.simulator.numbers.toDec")}`}
        </p>
        <p className="text-muted-foreground mb-2 text-xs">
          {isBin
            ? t("number-systems.simulator.numbers.binToDecDesc")
            : t("number-systems.simulator.numbers.otherToDecDesc", {
                base: baseToNumber(sourceBase),
              })}
        </p>
        <div className="bg-background border-border/40 space-y-2 overflow-x-auto rounded-lg border p-4 font-mono text-sm whitespace-nowrap shadow-inner">
          {isBin && (
            <div className="text-muted-foreground border-border/40 mb-2 flex gap-2 border-b pb-2">
              {steps.map((step, idx) => (
                <div key={idx} className="flex min-w-15 flex-col items-center">
                  <span className="text-xs">
                    {baseToNumber(sourceBase)}
                    <sup>{step.power}</sup>
                  </span>
                  <span className="text-foreground mt-1 text-base font-bold">
                    {step.digit}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="text-foreground flex flex-wrap items-center gap-1 leading-8">
            {steps.map((step, idx) => (
              <span key={idx} className="flex items-center">
                <span>
                  ({step.digitVal.toString()} × {baseToNumber(sourceBase)}
                  <sup>{step.power}</sup>)
                </span>
                {idx < steps.length - 1 && (
                  <span className="text-muted-foreground mx-2">+</span>
                )}
              </span>
            ))}
          </div>
          <div className="text-foreground mt-2 flex flex-wrap items-center gap-1 leading-8">
            <span className="w-5">=</span>
            {steps.map((step, idx) => (
              <span key={idx} className="flex items-center">
                <span>{step.termVal.toString()}</span>
                {idx < steps.length - 1 && (
                  <span className="text-muted-foreground mx-2">+</span>
                )}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-start text-sm font-semibold">
          <span className="bg-primary/10 text-primary flex items-center gap-2 rounded-md px-3 py-1">
            = {decValue}
          </span>
        </div>
      </div>
    );
  };

  const renderFromDec = () => {
    const steps = generateDivisionSteps(baseToNumber(targetBase));

    return (
      <div className="space-y-3">
        <p className="text-foreground text-sm font-medium">
          {targetBase === "bin"
            ? t("number-systems.simulator.numbers.decToBin")
            : t("number-systems.simulator.numbers.decToTarget", {
                target: String(baseLabel(targetBase)),
              })}
        </p>
        <p className="text-muted-foreground mb-2 text-xs">
          {targetBase === "bin"
            ? t("number-systems.simulator.numbers.decToBinDesc")
            : t("number-systems.simulator.numbers.divByBaseDesc", {
                base: Number(baseToNumber(targetBase)),
              })}
        </p>
        <div className="bg-background border-border/40 space-y-2 rounded-lg border p-4 font-mono text-sm shadow-inner">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-30 text-right">
                {step.value.toString()} : {step.base}
              </div>
              <div className="w-5 text-center">=</div>
              <div className="w-20 text-right">
                {step.value / BigInt(step.base)}
              </div>
              <div className="text-muted-foreground w-21.25 text-right whitespace-nowrap">
                {t("number-systems.simulator.numbers.remainder")}
              </div>
              <div className="text-primary w-5 text-right font-bold">
                {targetBase === "hex" && step.remainder > 9n
                  ? step.remainder.toString(16).toUpperCase()
                  : step.remainder.toString()}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end text-sm font-semibold">
          <span className="bg-primary/10 text-primary flex items-center gap-2 rounded-md px-3 py-1">
            {t("number-systems.simulator.numbers.result")}{" "}
            <span className="tracking-widest">{targetValue}</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in zoom-in-95 space-y-8 duration-300">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Converter Inputs */}
        <div className="bg-card border-border/50 rounded-xl border p-6 shadow-sm">
          <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
            {t("number-systems.simulator.numbers.converter")}
          </h3>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                  {t("number-systems.simulator.numbers.fromBase")}
                </label>
                <DropdownSelect
                  value={sourceBase}
                  options={[
                    {
                      value: "dec",
                      label: t("number-systems.simulator.numbers.decimal"),
                    },
                    {
                      value: "bin",
                      label: t("number-systems.simulator.numbers.binary"),
                    },
                    {
                      value: "oct",
                      label: t("number-systems.simulator.numbers.octal"),
                    },
                    {
                      value: "hex",
                      label: t("number-systems.simulator.numbers.hex"),
                    },
                  ]}
                  onChange={handleSourceBaseChange}
                  ariaLabel={t("number-systems.simulator.numbers.fromBase")}
                  disabled={!!isExerciseMode && !showSolution}
                  triggerClassName="w-full px-3 py-2 text-sm font-normal"
                  menuClassName="w-full"
                  triggerTestId="ns-integer-source-base"
                />
              </div>
              <div>
                <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                  {t("number-systems.simulator.numbers.toBase")}
                </label>
                <DropdownSelect
                  value={targetBase}
                  options={[
                    {
                      value: "dec",
                      label: t("number-systems.simulator.numbers.decimal"),
                    },
                    {
                      value: "bin",
                      label: t("number-systems.simulator.numbers.binary"),
                    },
                    {
                      value: "oct",
                      label: t("number-systems.simulator.numbers.octal"),
                    },
                    {
                      value: "hex",
                      label: t("number-systems.simulator.numbers.hex"),
                    },
                  ]}
                  onChange={setTargetBase}
                  ariaLabel={t("number-systems.simulator.numbers.toBase")}
                  disabled={!!isExerciseMode && !showSolution}
                  triggerClassName="w-full px-3 py-2 text-sm font-normal"
                  menuClassName="w-full"
                  triggerTestId="ns-integer-target-base"
                />
              </div>
            </div>

            <div className={locked ? "opacity-60" : ""}>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                {t("number-systems.simulator.numbers.valueLabel")}
              </label>
              <input
                type="text"
                data-testid="ns-converter-value-input"
                value={locked && initialBase !== sourceBase ? "" : inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                readOnly={locked}
                placeholder="..."
                maxLength={
                  sourceBase === "bin"
                    ? 16
                    : sourceBase === "oct"
                      ? 6
                      : sourceBase === "dec"
                        ? 5
                        : 4
                }
                className={`bg-background text-foreground placeholder:text-muted-foreground/50 w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none ${locked ? "bg-muted border-input pointer-events-none" : "border-input focus:border-primary focus:ring-primary/20 focus:ring-1"}`}
              />
              {inputValue !== "" && decValue === "" && (
                <p className="text-destructive mt-1 text-xs">
                  {t("number-systems.simulator.numbers.invalidInputBase")}{" "}
                  {baseToNumber(sourceBase)}.
                </p>
              )}
            </div>

            <div className="border-border/40 border-t pt-4">
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                {t("number-systems.simulator.numbers.resultLabel")}
              </label>
              <div
                data-testid="ns-converter-result"
                className="text-primary bg-primary/5 border-primary/20 flex min-h-13.5 items-center rounded-md border px-4 py-3 font-mono text-xl font-bold tracking-wider break-all shadow-inner"
              >
                {!locked && decValue !== ""
                  ? targetValue
                  : locked
                    ? "--------"
                    : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Explanation Panel */}
        <div className="bg-muted/30 border-border/50 max-h-125 overflow-auto rounded-xl border p-6 shadow-sm">
          {locked ? (
            <ExerciseValidationPanel
              expectedResult={targetValue}
              onShowSolution={onShowSolution!}
              onExitExercise={onExitExercise}
              inputMode={
                (
                  {
                    bin: "binary",
                    oct: "octal",
                    dec: "decimal",
                    hex: "hex",
                  } as Record<string, ValidationInputMode>
                )[targetBase] ?? "text"
              }
              placeholder={`z.B. ${targetBase === "bin" ? "10110" : targetBase === "hex" ? "2A" : "42"}`}
            />
          ) : (
            <>
              <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
                <Info className="text-primary h-5 w-5" />
                {t("number-systems.simulator.numbers.explanation")}
              </h3>

              {!decValue ? (
                <p className="text-muted-foreground text-sm">
                  {t("number-systems.simulator.numbers.enterValue")}
                </p>
              ) : sourceBase === targetBase ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-8">
                  <ArrowRight className="mb-2 h-8 w-8 opacity-20" />
                  <p className="text-sm">
                    {t("number-systems.simulator.numbers.sameBase")}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {showToDecSteps && showFromDecSteps && (
                    <div className="bg-popover/50 border-primary text-muted-foreground rounded-r-md border-l-4 p-3 text-sm">
                      {t("number-systems.simulator.numbers.nonDecConvHint")}
                    </div>
                  )}

                  {showToDecSteps && (
                    <div>
                      {showFromDecSteps && (
                        <h4 className="text-muted-foreground border-border/50 mb-3 border-b pb-2 text-xs font-bold tracking-wider uppercase">
                          {t("number-systems.simulator.numbers.step1TempDec")}
                        </h4>
                      )}
                      {renderToDec()}
                    </div>
                  )}

                  {showToDecSteps && showFromDecSteps && (
                    <div className="bg-border/50 my-6 h-px" />
                  )}

                  {showFromDecSteps && (
                    <div>
                      {showToDecSteps && (
                        <h4 className="text-muted-foreground border-border/50 mb-3 border-b pb-2 text-xs font-bold tracking-wider uppercase">
                          {t(
                            "number-systems.simulator.numbers.step2TempTarget",
                          )}
                        </h4>
                      )}
                      {renderFromDec()}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
