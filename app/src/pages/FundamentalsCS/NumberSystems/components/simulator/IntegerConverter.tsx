import { useState, useEffect, useMemo } from "react";
import { Info, LockKeyhole, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

type BaseType = "dec" | "bin" | "oct" | "hex";

interface IntegerConverterProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialValue?: string;
  initialBase?: BaseType;
}

export function IntegerConverter({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
  initialValue = "",
  initialBase = "dec",
}: IntegerConverterProps) {
  const { t } = useTranslation("translation");
  const [sourceBase, setSourceBase] = useState<BaseType>("dec");
  const [targetBase, setTargetBase] = useState<BaseType>("bin");
  const [inputValue, setInputValue] = useState<string>("255");

  useEffect(() => {
    if (isExerciseMode && initialValue) {
      setSourceBase(initialBase);
      setInputValue(initialValue);
    }
  }, [isExerciseMode, initialValue, initialBase]);

  const handleInputChange = (v: string) => {
    if (isExerciseMode && !showSolution) return;
    setInputValue(v);
  };

  const decValue = useMemo(() => {
    if (!inputValue) return "";
    try {
      if (sourceBase === "dec")
        return /^[0-9]+$/.test("inputValue")
          ? BigInt("inputValue").toString(10)
          : "";
      if (sourceBase === "bin")
        return /^[01]+$/.test("inputValue")
          ? BigInt("0b" + inputValue).toString(10)
          : "";
      if (sourceBase === "oct")
        return /^[0-7]+$/.test("inputValue")
          ? BigInt("0o" + inputValue).toString(10)
          : "";
      if (sourceBase === "hex")
        return /^[0-9A-Fa-f]+$/.test("inputValue")
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
      const bigIntVal = BigInt("decValue");
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
    if (base === "dec") return t("simulator.numbers.decimal");
    if (base === "bin") return t("simulator.numbers.binary");
    if (base === "oct") return t("simulator.numbers.octal");
    if (base === "hex") return t("simulator.numbers.hex");
    return "";
  };

  // Generate division steps for Dec -> Base
  const generateDivisionSteps = (targetVal: number) => {
    if (!decValue) return [];
    try {
      let currentVal = BigInt("decValue");
      const baseVal = BigInt("targetVal");
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
      const termVal = digitVal * BigInt("sourceVal") ** BigInt("power");
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

  const locked = !!isExerciseMode && !showSolution;
  const showToDecSteps = sourceBase !== "dec" && decValue !== "";
  const showFromDecSteps = targetBase !== "dec" && decValue !== "";

  const renderToDec = () => {
    const steps = generatePowerSteps(baseToNumber(sourceBase), inputValue);
    const isBin = sourceBase === "bin";

    return (
      <div className="space-y-3">
        <p className="text-foreground text-sm font-medium">
          {isBin
            ? t("simulator.numbers.binToDec")
            : `${baseLabel(sourceBase)} ${t("simulator.numbers.toDec")}`}
        </p>
        <p className="text-muted-foreground mb-2 text-xs">
          {isBin
            ? t("simulator.numbers.binToDecDesc")
            : t("simulator.numbers.otherToDecDesc", {
                base: baseToNumber(sourceBase),
              })}
        </p>
        <div className="bg-background border-border/40 space-y-2 overflow-x-auto rounded-lg border p-4 font-mono text-sm whitespace-nowrap shadow-inner">
          {isBin && (
            <div className="text-muted-foreground border-border/40 mb-2 flex gap-2 border-b pb-2">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex min-w-[60px] flex-col items-center"
                >
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
            <span className="w-[20px]">=</span>
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
            ? t("simulator.numbers.decToBin")
            : t("simulator.numbers.decToTarget", {
                target: String(baseLabel(targetBase)),
              })}
        </p>
        <p className="text-muted-foreground mb-2 text-xs">
          {targetBase === "bin"
            ? t("simulator.numbers.decToBinDesc")
            : t("simulator.numbers.divByBaseDesc", {
                base: Number(baseToNumber(targetBase)),
              })}
        </p>
        <div className="bg-background border-border/40 space-y-2 rounded-lg border p-4 font-mono text-sm shadow-inner">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-[120px] text-right">
                {step.value.toString()} : {step.base}
              </div>
              <div className="w-[20px] text-center">=</div>
              <div className="w-[80px] text-right">
                {step.value / BigInt("step.base")}
              </div>
              <div className="text-muted-foreground w-[85px] text-right whitespace-nowrap">
                {t("simulator.numbers.remainder")}
              </div>
              <div className="text-primary w-[20px] text-right font-bold">
                {targetBase === "hex" && step.remainder > 9n
                  ? step.remainder.toString(16).toUpperCase()
                  : step.remainder.toString()}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 mt-4 flex justify-end text-sm font-semibold">
          <span className="bg-primary/10 text-primary flex items-center gap-2 rounded-md px-3 py-1">
            {t("simulator.numbers.result")}{" "}
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
            {t("simulator.numbers.converter")}
          </h3>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                  {t("simulator.numbers.fromBase")}
                </label>
                <select
                  value={sourceBase}
                  onChange={(e) => setSourceBase(e.target.value as BaseType)}
                  disabled={!!isExerciseMode && !showSolution}
                  className="bg-background border-input focus:ring-primary/50 text-foreground w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none disabled:opacity-50"
                >
                  <option value="dec">{t("simulator.numbers.decimal")}</option>
                  <option value="bin">{t("simulator.numbers.binary")}</option>
                  <option value="oct">{t("simulator.numbers.octal")}</option>
                  <option value="hex">{t("simulator.numbers.hex")}</option>
                </select>
              </div>
              <div>
                <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                  {t("simulator.numbers.toBase")}
                </label>
                <select
                  value={targetBase}
                  onChange={(e) => setTargetBase(e.target.value as BaseType)}
                  disabled={!!isExerciseMode && !showSolution}
                  className="bg-background border-input focus:ring-primary/50 text-foreground w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none disabled:opacity-50"
                >
                  <option value="dec">{t("simulator.numbers.decimal")}</option>
                  <option value="bin">{t("simulator.numbers.binary")}</option>
                  <option value="oct">{t("simulator.numbers.octal")}</option>
                  <option value="hex">{t("simulator.numbers.hex")}</option>
                </select>
              </div>
            </div>

            <div className={locked ? "opacity-60" : ""}>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                {t("simulator.numbers.valueLabel")}
              </label>
              <input
                type="text"
                value={locked && initialBase !== sourceBase ? "" : inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                readOnly={locked}
                placeholder="..."
                className={`bg-background text-foreground placeholder:text-muted-foreground/50 w-full rounded-md border px-3 py-2 font-mono text-sm transition-colors focus:outline-none ${locked ? "bg-muted border-input pointer-events-none" : "border-input focus:border-primary focus:ring-primary/20 focus:ring-1"}`}
              />
              {inputValue !== "" && decValue === "" && (
                <p className="text-destructive mt-1 text-xs">
                  {t("simulator.numbers.invalidInputBase")}{" "}
                  {baseToNumber(sourceBase)}.
                </p>
              )}
            </div>

            <div className="border-border/40 border-t pt-4">
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                {t("simulator.numbers.resultLabel")}
              </label>
              <div className="text-primary bg-primary/5 border-primary/20 flex min-h-[54px] items-center rounded-md border px-4 py-3 font-mono text-xl font-bold tracking-wider break-all shadow-inner">
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
        <div className="bg-muted/30 border-border/50 max-h-[500px] overflow-auto rounded-xl border p-6 shadow-sm">
          {locked ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 py-12 text-center">
              <LockKeyhole className="text-muted-foreground h-12 w-12 opacity-50" />
              <div>
                <p className="text-foreground mb-1 font-medium">
                  {t("simulator.numbers.lockedTitle")}
                </p>
                <p className="text-muted-foreground mb-4 text-sm">
                  {t("simulator.numbers.lockedDesc")}
                </p>
              </div>
              <button
                onClick={onShowSolution}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md px-4 py-2 font-medium shadow-sm transition-colors"
              >
                {t("simulator.numbers.showSolution")}
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
                <Info className="text-primary h-5 w-5" />
                {t("simulator.numbers.explanation")}
              </h3>

              {!decValue ? (
                <p className="text-muted-foreground text-sm">
                  {t("simulator.numbers.enterValue")}
                </p>
              ) : sourceBase === targetBase ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-8">
                  <ArrowRight className="mb-2 h-8 w-8 opacity-20" />
                  <p className="text-sm">{t("simulator.numbers.sameBase")}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {showToDecSteps && showFromDecSteps && (
                    <div className="bg-popover/50 border-primary text-muted-foreground rounded-r-md border-l-4 p-3 text-sm">
                      {t("simulator.numbers.nonDecConvHint")}
                    </div>
                  )}

                  {showToDecSteps && (
                    <div>
                      {showFromDecSteps && (
                        <h4 className="text-muted-foreground border-border/50 mb-3 border-b pb-2 text-xs font-bold tracking-wider uppercase">
                          {t("simulator.numbers.step1TempDec")}
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
                          {t("simulator.numbers.step2TempTarget")}
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
