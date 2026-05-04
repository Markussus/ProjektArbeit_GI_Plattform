import { useState, useEffect } from "react";
import { Info, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExerciseValidationPanel } from "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel";

interface IEEE754ConverterProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  onExitExercise?: () => void;
  initialValue?: string;
  initialConverterMode?: "decToIeee" | "ieeeToDec";
}

export function IEEE754Converter({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
  onExitExercise,
  initialValue = "",
  initialConverterMode = "decToIeee",
}: IEEE754ConverterProps) {
  const { t } = useTranslation("translation");
  const [inputValue, setInputValue] = useState<string>("12.5");
  const [converterMode, setConverterMode] = useState<"decToIeee" | "ieeeToDec">(
    initialConverterMode,
  );

  useEffect(() => {
    if (isExerciseMode && initialValue) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputValue(initialValue);
      setConverterMode(initialConverterMode);
    }
  }, [isExerciseMode, initialValue, initialConverterMode]);

  // PARSE LOGIC
  const cleanBinary = inputValue.replace(/[^01]/g, "");
  const isIeeeToDecValid =
    converterMode === "ieeeToDec" && cleanBinary.length === 32;

  let isValid: boolean;
  let floatVal = 0;
  let isNaNVal = false;
  let isSpecial = false;

  let sign = "0";
  let exponent = "00000000";
  let mantissa = "00000000000000000000000";
  let expVal = 0;

  if (converterMode === "decToIeee") {
    floatVal = parseFloat(inputValue.replace(",", "."));
    isValid =
      inputValue.trim() !== "" &&
      !isNaN(floatVal) &&
      inputValue.toLowerCase() !== "nan";
    isNaNVal =
      inputValue.toLowerCase() === "nan" ||
      (inputValue.trim() !== "" && isNaN(floatVal) && !isValid);
    isSpecial = isValid && (!isFinite(floatVal) || floatVal === 0);

    if (isValid) {
      const buffer = new ArrayBuffer(4);
      const floatView = new Float32Array(buffer);
      const intView = new Uint32Array(buffer);

      floatView[0] = floatVal;
      const bits = intView[0].toString(2).padStart(32, "0");

      sign = bits[0];
      exponent = bits.slice(1, 9);
      mantissa = bits.slice(9);
      expVal = parseInt(exponent, 2);
    }
  } else {
    isValid = isIeeeToDecValid;
    if (isValid) {
      sign = cleanBinary[0];
      exponent = cleanBinary.slice(1, 9);
      mantissa = cleanBinary.slice(9);
      expVal = parseInt(exponent, 2);

      const buffer = new ArrayBuffer(4);
      const floatView = new Float32Array(buffer);
      const intView = new Uint32Array(buffer);

      intView[0] = parseInt(cleanBinary, 2);
      floatVal = floatView[0];

      isNaNVal = isNaN(floatVal);
      isSpecial = !isFinite(floatVal) || floatVal === 0;
    }
  }

  const isZero = isValid && floatVal === 0;
  const isInf = isValid && !isFinite(floatVal) && !isNaNVal;
  const locked = !!isExerciseMode && !showSolution;

  // Fraction Math for Explanation
  let sumOfFractions = 0;
  const fractionSteps: number[] = [];
  if (converterMode === "ieeeToDec" && isValid && !isSpecial && !isNaNVal) {
    for (let i = 0; i < mantissa.length; i++) {
      if (mantissa[i] === "1") {
        const pow = Math.pow(2, -(i + 1));
        sumOfFractions += pow;
        fractionSteps.push(i + 1);
      }
    }
  }

  return (
    <div className="animate-in fade-in zoom-in-95 space-y-8 duration-300">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Converter Inputs */}
        <div className="flex flex-col gap-6">
          <div className="bg-card border-border/50 rounded-xl border p-6 shadow-sm">
            <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <h3 className="text-foreground text-lg font-semibold">
                {t("simulator.numbers.ieeeTitle")}
              </h3>

              <div className="bg-muted mb-2 flex shrink-0 rounded-md p-1 sm:mb-0">
                <button
                  onClick={() => {
                    setConverterMode("decToIeee");
                    setInputValue("12.5");
                  }}
                  className={`rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${converterMode === "decToIeee" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t("simulator.numbers.modeDecToIeee")}
                </button>
                <button
                  onClick={() => {
                    setConverterMode("ieeeToDec");
                    setInputValue("0 10000010 10010000000000000000000");
                  }}
                  className={`rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${converterMode === "ieeeToDec" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t("simulator.numbers.modeIeeeToDec")}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className={locked ? "opacity-60" : ""}>
                <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                  {converterMode === "decToIeee"
                    ? t("simulator.numbers.decInputFloat")
                    : t("simulator.numbers.ieeeInputFormat")}
                </label>
                <div
                  className={`bg-background relative flex items-center border ${locked ? "border-input bg-muted pointer-events-none" : "border-input focus-within:border-primary focus-within:ring-primary/20 focus-within:ring-1"} overflow-hidden rounded-md`}
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    readOnly={locked}
                    className="text-foreground w-full border-none bg-transparent px-3 py-2 font-mono text-sm focus:outline-none"
                    placeholder={
                      converterMode === "decToIeee"
                        ? "12.5"
                        : "01000001010010000000000000000000"
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
                  {converterMode === "decToIeee"
                    ? t("simulator.numbers.resultUpper")
                    : t("simulator.numbers.decResultUpper")}
                </div>

                {converterMode === "decToIeee" ? (
                  // DEC TO IEEE RESULT BLOCKS
                  !locked && (isValid || isNaNVal) ? (
                    <div className="bg-background border-border/40 flex shrink-0 overflow-hidden rounded-lg border">
                      <div className="border-border/40 flex flex-col items-center border-r bg-blue-500/10 px-3 py-3">
                        <span className="mb-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          SIGN
                        </span>
                        <span className="font-mono text-blue-700 dark:text-blue-300">
                          {isNaNVal ? "0" : sign}
                        </span>
                      </div>
                      <div className="border-border/40 flex flex-col items-center border-r bg-green-500/10 px-3 py-3">
                        <span className="mb-1 text-[10px] font-bold text-green-600 dark:text-green-400">
                          EXPONENT
                        </span>
                        <span className="font-mono tracking-widest text-green-700 dark:text-green-300">
                          {isNaNVal ? "11111111" : exponent}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col items-center overflow-hidden bg-orange-500/10 px-3 py-3">
                        <span className="mb-1 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                          MANTISSA
                        </span>
                        <span className="w-full truncate text-center font-mono tracking-widest text-orange-700 dark:text-orange-300">
                          {isNaNVal
                            ? "10000000000000000000000".slice(0, 23)
                            : mantissa}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground py-4 text-sm">
                      {locked
                        ? "--------"
                        : t("simulator.numbers.enterValidNumber")}
                    </div>
                  )
                ) : // IEEE TO DEC RESULT DISPLAY
                !locked && isValid ? (
                  <div className="bg-background border-border/40 flex items-center justify-center overflow-hidden rounded-lg border p-6 font-mono text-2xl font-bold tracking-wider">
                    {isNaNVal
                      ? "NaN"
                      : Object.is(floatVal, -0)
                        ? "-0"
                        : floatVal}
                  </div>
                ) : (
                  <div className="text-muted-foreground py-4 text-sm">
                    {locked
                      ? "--------"
                      : t("simulator.numbers.enterValid32Bit")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {!locked && (isZero || isInf || isNaNVal) && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 shadow-sm">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                {t("simulator.numbers.specialCase")}
              </h3>
              <div className="text-sm text-amber-800 dark:text-amber-300/80">
                {isZero && (
                  <p>
                    <strong>{t("simulator.numbers.zero")}</strong>{" "}
                    {t("simulator.numbers.zeroDesc")}
                  </p>
                )}
                {isInf && (
                  <p>
                    <strong>{t("simulator.numbers.infinity")}</strong>{" "}
                    {t("simulator.numbers.infDesc")}
                  </p>
                )}
                {isNaNVal && (
                  <p>
                    <strong>{t("simulator.numbers.nan")}</strong>{" "}
                    {t("simulator.numbers.nanDesc")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-muted/30 border-border/50 max-h-200 overflow-auto rounded-xl border p-6 shadow-sm xl:max-h-150">
          {locked ? (
            <ExerciseValidationPanel
              expectedResult={
                converterMode === "decToIeee"
                  ? isNaNVal
                    ? ["NaN", "nan"]
                    : [
                        sign + exponent + mantissa,
                        `${sign} ${exponent} ${mantissa}`,
                      ]
                  : isNaNVal
                    ? ["NaN", "nan"]
                    : Object.is(floatVal, -0)
                      ? ["-0", "0"]
                      : [floatVal.toString()]
              }
              onShowSolution={onShowSolution!}
              onExitExercise={onExitExercise}
              placeholder={
                converterMode === "decToIeee"
                  ? "z.B. 0 10000000 0000000..."
                  : "z.B. 12.5"
              }
            />
          ) : (
            <>
              <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
                <Info className="text-primary h-5 w-5" />
                {t("simulator.numbers.conceptPath")}
              </h3>

              {!isValid && !isNaNVal ? (
                <p className="text-muted-foreground text-sm">
                  {t("simulator.numbers.enterValueForExp")}
                </p>
              ) : isSpecial || isNaNVal ? (
                <p className="text-muted-foreground text-sm">
                  {t("simulator.numbers.specialCaseNoMath")}
                </p>
              ) : converterMode === "decToIeee" ? (
                // EXISTING DEC TO IEEE EXPLANATION
                <div className="space-y-6">
                  <div className="space-y-1">
                    <div className="mb-2 text-xs font-semibold tracking-wider text-blue-600 uppercase dark:text-blue-400">
                      {t("simulator.numbers.step1Sign")}
                    </div>
                    <div className="bg-background flex items-center justify-between rounded-lg border border-blue-500/20 p-4 shadow-inner">
                      <span className="text-muted-foreground text-sm">
                        {t("simulator.numbers.isNegative")}{" "}
                        {floatVal < 0
                          ? t("simulator.numbers.yes")
                          : t("simulator.numbers.no")}
                      </span>
                      <span className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">
                        {sign}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-foreground mt-4 mb-2 text-xs font-semibold tracking-wider uppercase">
                      {t("simulator.numbers.step2Norm")}
                    </div>
                    <div className="bg-background border-border/40 text-muted-foreground space-y-2 rounded-lg border p-4 text-sm shadow-inner">
                      <p>{t("simulator.numbers.normDesc")}</p>
                      <div className="bg-muted/50 border-border/40 text-foreground mt-2 rounded border p-2 text-center font-mono">
                        X.X &rarr;{" "}
                        <span className="text-primary font-bold">1</span>.XXX
                        &times; 2
                        <sup className="text-[10px] text-green-600 dark:text-green-400">
                          Y
                        </sup>
                      </div>
                      <p className="text-primary border-primary mt-2 border-l-2 pl-2 text-xs font-medium">
                        {t("simulator.numbers.normSubDesc", {
                          val: expVal - 127,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1">
                    <div className="mb-2 text-xs font-semibold tracking-wider text-green-600 uppercase dark:text-green-400">
                      {t("simulator.numbers.step3Exp")}
                    </div>
                    <div className="bg-background text-muted-foreground space-y-2 rounded-lg border border-green-500/20 p-4 text-sm shadow-inner">
                      <p>{t("simulator.numbers.biasDesc")}</p>
                      <div className="bg-muted/50 flex items-center justify-center gap-4 rounded p-2 font-mono">
                        <span>{expVal - 127}</span>
                        <span>+</span>
                        <span>127</span>
                        <span>=</span>
                        <span className="text-foreground font-bold">
                          {expVal}
                        </span>
                      </div>
                      <p className="text-center">
                        {t("simulator.numbers.binaryMode")}{" "}
                        <strong className="tracking-widest text-green-600 dark:text-green-400">
                          {exponent}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1">
                    <div className="mb-2 text-xs font-semibold tracking-wider text-orange-600 uppercase dark:text-orange-400">
                      {t("simulator.numbers.step4Mantissa")}
                    </div>
                    <div className="bg-background text-muted-foreground space-y-2 rounded-lg border border-orange-500/20 p-4 text-sm shadow-inner">
                      <p>{t("simulator.numbers.mantissaDesc")}</p>
                      <p className="border-l-2 border-orange-500/50 pl-2 text-xs">
                        <strong>{t("simulator.numbers.hiddenBitTitle")}</strong>{" "}
                        {t("simulator.numbers.hiddenBitDesc")}
                      </p>
                      <p className="bg-muted/50 mt-2 rounded p-2 text-center font-mono tracking-widest break-all text-orange-600 dark:text-orange-400">
                        {mantissa}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // NEW IEEE TO DEC EXPLANATION
                <div className="space-y-6">
                  <div className="space-y-1">
                    <div className="mb-2 text-xs font-semibold tracking-wider text-blue-600 uppercase dark:text-blue-400">
                      {t("simulator.numbers.step1Sign")}
                    </div>
                    <div className="bg-background flex items-center justify-between rounded-lg border border-blue-500/20 p-4 shadow-inner">
                      <span className="text-muted-foreground text-sm">
                        {t("simulator.numbers.isNegative")}{" "}
                        {sign === "1"
                          ? t("simulator.numbers.yes")
                          : t("simulator.numbers.no")}
                      </span>
                      <span className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">
                        {sign}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="mt-4 mb-2 text-xs font-semibold tracking-wider text-green-600 uppercase dark:text-green-400">
                      {t("simulator.numbers.step2ExpExtract")}
                    </div>
                    <div className="bg-background text-muted-foreground rounded-lg border border-green-500/20 p-4 text-sm shadow-inner">
                      <p>{t("simulator.numbers.expBinToDecDesc")}</p>
                      <div className="bg-muted/50 mt-2 flex flex-col justify-center gap-2 rounded p-2 text-center font-mono">
                        <span className="font-bold tracking-widest text-green-600 dark:text-green-400">
                          {exponent}₂
                        </span>
                        <span>&darr;</span>
                        <div className="flex items-center justify-center gap-4">
                          <span>{expVal}</span>
                          <span>-</span>
                          <span>127</span>
                          <span>=</span>
                          <span className="text-foreground font-bold">
                            {expVal - 127}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="mt-4 mb-2 text-xs font-semibold tracking-wider text-orange-600 uppercase dark:text-orange-400">
                      {t("simulator.numbers.step3MantExtract")}
                    </div>
                    <div className="bg-background text-muted-foreground space-y-2 rounded-lg border border-orange-500/20 p-4 text-sm shadow-inner">
                      <p>{t("simulator.numbers.mantissaBinToDecDesc")}</p>
                      <div className="bg-muted/50 mt-2 w-full truncate rounded p-2 text-center font-mono tracking-widest text-orange-600 dark:text-orange-400">
                        1.{mantissa}
                      </div>

                      {fractionSteps.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
                          <span>= 1 + (</span>
                          {fractionSteps.map((powValue, idx) => (
                            <span key={idx} className="flex gap-2">
                              <span>
                                2<sup>-{powValue}</sup>
                              </span>
                              {idx < fractionSteps.length - 1 && "+"}
                            </span>
                          ))}
                          <span>)</span>
                        </div>
                      )}

                      <div className="border-border/40 mt-2 flex flex-col items-center justify-center gap-1 border-t pt-2">
                        <span className="text-xs">
                          {t("simulator.numbers.fractionSum")}: {sumOfFractions}
                        </span>
                        <span className="text-foreground font-bold">
                          = 1.0 + {sumOfFractions} = {1 + sumOfFractions}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1">
                    <div className="text-primary mb-2 text-xs font-semibold tracking-wider uppercase">
                      {t("simulator.numbers.step4FinalCalc")}
                    </div>
                    <div className="bg-background border-primary/20 text-muted-foreground space-y-2 rounded-lg border p-4 text-sm shadow-inner">
                      <p>{t("simulator.numbers.finalFormulaDesc")}</p>
                      <div className="bg-muted/50 mt-2 flex flex-wrap items-center justify-center gap-4 rounded p-3 font-mono">
                        <span>
                          (-1)
                          <sup className="text-blue-600 dark:text-blue-400">
                            {sign}
                          </sup>
                        </span>
                        <span>&times;</span>
                        <span className="text-orange-600 dark:text-orange-400">
                          {1 + sumOfFractions}
                        </span>
                        <span>&times;</span>
                        <span>
                          2
                          <sup className="text-green-600 dark:text-green-400">
                            {expVal - 127}
                          </sup>
                        </span>
                        <span>=</span>
                        <span className="text-foreground bg-primary/10 rounded px-2 py-1 font-bold">
                          {floatVal}
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
  );
}
