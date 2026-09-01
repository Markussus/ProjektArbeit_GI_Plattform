import { AlertTriangle, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExerciseValidationPanel } from "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel";
import type { IEEE754Analysis } from "./useIEEE754Converter";

interface IEEE754ConverterPartsProps {
  mode: "decToIeee" | "ieeeToDec";
  analysis: IEEE754Analysis;
  locked?: boolean;
}

interface ModeToggleProps {
  mode: "decToIeee" | "ieeeToDec";
  onChange: (mode: "decToIeee" | "ieeeToDec") => void;
}

interface ExplanationPanelProps extends IEEE754ConverterPartsProps {
  expectedResult: string | string[];
  onShowSolution?: () => void;
  onExitExercise?: () => void;
  inputPlaceholder?: string;
  inputMode?: "ieee-binary" | "float";
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const { t } = useTranslation("translation");

  const baseClass =
    "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors";
  const activeClass = "bg-background text-foreground shadow-sm";
  const inactiveClass = "text-muted-foreground hover:text-foreground";

  return (
    <div className="bg-muted mb-2 flex shrink-0 rounded-md p-1 sm:mb-0">
      <button
        data-testid="ns-ieee-dec-to-ieee-button"
        onClick={() => {
          onChange("decToIeee");
        }}
        className={`${baseClass} ${mode === "decToIeee" ? activeClass : inactiveClass}`}
      >
        {t("number-systems.simulator.numbers.modeDecToIeee")}
      </button>
      <button
        data-testid="ns-ieee-ieee-to-dec-button"
        onClick={() => {
          onChange("ieeeToDec");
        }}
        className={`${baseClass} ${mode === "ieeeToDec" ? activeClass : inactiveClass}`}
      >
        {t("number-systems.simulator.numbers.modeIeeeToDec")}
      </button>
    </div>
  );
}

interface IeeeInputFieldProps {
  mode: "decToIeee" | "ieeeToDec";
  value: string;
  onChange: (value: string) => void;
  locked?: boolean;
}

export function IeeeInputField({
  mode,
  value,
  onChange,
  locked,
}: IeeeInputFieldProps) {
  const { t } = useTranslation("translation");

  const label =
    mode === "decToIeee"
      ? t("number-systems.simulator.numbers.decInputFloat")
      : t("number-systems.simulator.numbers.ieeeInputFormat");
  const placeholder =
    mode === "decToIeee" ? "12.5" : "01000001010010000000000000000000";

  return (
    <div className={locked ? "opacity-60" : ""}>
      <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
        {label}
      </label>
      <div
        className={`bg-background relative flex items-center border ${locked ? "border-input bg-muted pointer-events-none" : "border-input focus-within:border-primary focus-within:ring-primary/20 focus-within:ring-1"} overflow-hidden rounded-md`}
      >
        <input
          type="text"
          data-testid="ns-ieee-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={locked}
          className="text-foreground w-full border-none bg-transparent px-3 py-2 font-mono text-sm focus:outline-none"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

export function DecToIeeeResult({
  analysis: { isNaNVal, sign, exponent, mantissa },
  locked,
}: IEEE754ConverterPartsProps) {
  if (locked) {
    return (
      <div className="text-muted-foreground py-4 text-sm">{"--------"}</div>
    );
  }

  return (
    <div
      data-testid="ns-ieee-result"
      className="bg-background border-border/40 flex shrink-0 overflow-hidden rounded-lg border"
    >
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
          {isNaNVal ? "10000000000000000000000".slice(0, 23) : mantissa}
        </span>
      </div>
    </div>
  );
}

export function IeeeToDecResult({
  analysis: { isNaNVal, floatVal },
  locked,
}: IEEE754ConverterPartsProps) {
  if (locked) {
    return (
      <div className="text-muted-foreground py-4 text-sm">{"--------"}</div>
    );
  }

  return (
    <div
      data-testid="ns-ieee-result"
      className="bg-background border-border/40 flex items-center justify-center overflow-hidden rounded-lg border p-6 font-mono text-2xl font-bold tracking-wider"
    >
      {isNaNVal ? "NaN" : Object.is(floatVal, -0) ? "-0" : floatVal}
    </div>
  );
}

export function ResultSection({
  mode,
  analysis,
  locked,
}: IEEE754ConverterPartsProps) {
  const { t } = useTranslation("translation");
  const { isValid, isNaNVal } = analysis;

  const hasDecToIeeeResult = !locked && (isValid || isNaNVal);
  const hasIeeeToDecResult = !locked && isValid;

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
        {mode === "decToIeee"
          ? t("number-systems.simulator.numbers.resultUpper")
          : t("number-systems.simulator.numbers.decResultUpper")}
      </div>

      {mode === "decToIeee" ? (
        hasDecToIeeeResult ? (
          <DecToIeeeResult mode={mode} analysis={analysis} locked={locked} />
        ) : (
          <div className="text-muted-foreground py-4 text-sm">
            {locked
              ? "--------"
              : t("number-systems.simulator.numbers.enterValidNumber")}
          </div>
        )
      ) : hasIeeeToDecResult ? (
        <IeeeToDecResult mode={mode} analysis={analysis} locked={locked} />
      ) : (
        <div className="text-muted-foreground py-4 text-sm">
          {locked
            ? "--------"
            : t("number-systems.simulator.numbers.enterValid32Bit")}
        </div>
      )}
    </div>
  );
}

export function SpecialCaseBanner({
  analysis: { isZero, isInf, isNaNVal },
}: IEEE754ConverterPartsProps) {
  const { t } = useTranslation("translation");

  if (!isZero && !isInf && !isNaNVal) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 shadow-sm">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
        <AlertTriangle className="h-5 w-5" />
        {t("number-systems.simulator.numbers.specialCase")}
      </h3>
      <div className="text-sm text-amber-800 dark:text-amber-300/80">
        {isZero && (
          <p>
            <strong>{t("number-systems.simulator.numbers.zero")}</strong>{" "}
            {t("number-systems.simulator.numbers.zeroDesc")}
          </p>
        )}
        {isInf && (
          <p>
            <strong>{t("number-systems.simulator.numbers.infinity")}</strong>{" "}
            {t("number-systems.simulator.numbers.infDesc")}
          </p>
        )}
        {isNaNVal && (
          <p>
            <strong>{t("number-systems.simulator.numbers.nan")}</strong>{" "}
            {t("number-systems.simulator.numbers.nanDesc")}
          </p>
        )}
      </div>
    </div>
  );
}

export function DecToIeeeExplanation({
  analysis: { floatVal, sign, exponent, mantissa, expVal },
}: IEEE754ConverterPartsProps) {
  const { t } = useTranslation("translation");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="mb-2 text-xs font-semibold tracking-wider text-blue-600 uppercase dark:text-blue-400">
          {t("number-systems.simulator.numbers.step1Sign")}
        </div>
        <div className="bg-background flex items-center justify-between rounded-lg border border-blue-500/20 p-4 shadow-inner">
          <span className="text-muted-foreground text-sm">
            {t("number-systems.simulator.numbers.isNegative")}{" "}
            {floatVal < 0
              ? t("number-systems.simulator.numbers.yes")
              : t("number-systems.simulator.numbers.no")}
          </span>
          <span className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">
            {sign}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-foreground mt-4 mb-2 text-xs font-semibold tracking-wider uppercase">
          {t("number-systems.simulator.numbers.step2Norm")}
        </div>
        <div className="bg-background border-border/40 text-muted-foreground space-y-2 rounded-lg border p-4 text-sm shadow-inner">
          <p>{t("number-systems.simulator.numbers.normDesc")}</p>
          <div className="bg-muted/50 border-border/40 text-foreground mt-2 rounded border p-2 text-center font-mono">
            X.X &rarr; <span className="text-primary font-bold">1</span>.XXX
            &times; 2
            <sup className="text-[10px] text-green-600 dark:text-green-400">
              Y
            </sup>
          </div>
          <p className="text-primary border-primary mt-2 border-l-2 pl-2 text-xs font-medium">
            {t("number-systems.simulator.numbers.normSubDesc", {
              val: expVal - 127,
            })}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <div className="mb-2 text-xs font-semibold tracking-wider text-green-600 uppercase dark:text-green-400">
          {t("number-systems.simulator.numbers.step3Exp")}
        </div>
        <div className="bg-background text-muted-foreground space-y-2 rounded-lg border border-green-500/20 p-4 text-sm shadow-inner">
          <p>{t("number-systems.simulator.numbers.biasDesc")}</p>
          <div className="bg-muted/50 flex items-center justify-center gap-4 rounded p-2 font-mono">
            <span>{expVal - 127}</span>
            <span>+</span>
            <span>127</span>
            <span>=</span>
            <span className="text-foreground font-bold">{expVal}</span>
          </div>
          <p className="text-center">
            {t("number-systems.simulator.numbers.binaryMode")}{" "}
            <strong className="tracking-widest text-green-600 dark:text-green-400">
              {exponent}
            </strong>
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <div className="mb-2 text-xs font-semibold tracking-wider text-orange-600 uppercase dark:text-orange-400">
          {t("number-systems.simulator.numbers.step4Mantissa")}
        </div>
        <div className="bg-background text-muted-foreground space-y-2 rounded-lg border border-orange-500/20 p-4 text-sm shadow-inner">
          <p>{t("number-systems.simulator.numbers.mantissaDesc")}</p>
          <p className="border-l-2 border-orange-500/50 pl-2 text-xs">
            <strong>
              {t("number-systems.simulator.numbers.hiddenBitTitle")}
            </strong>{" "}
            {t("number-systems.simulator.numbers.hiddenBitDesc")}
          </p>
          <p className="bg-muted/50 mt-2 rounded p-2 text-center font-mono tracking-widest break-all text-orange-600 dark:text-orange-400">
            {mantissa}
          </p>
        </div>
      </div>
    </div>
  );
}

export function IeeeToDecExplanation({
  analysis: {
    floatVal,
    sign,
    exponent,
    mantissa,
    expVal,
    sumOfFractions,
    fractionSteps,
  },
}: IEEE754ConverterPartsProps) {
  const { t } = useTranslation("translation");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="mb-2 text-xs font-semibold tracking-wider text-blue-600 uppercase dark:text-blue-400">
          {t("number-systems.simulator.numbers.step1Sign")}
        </div>
        <div className="bg-background flex items-center justify-between rounded-lg border border-blue-500/20 p-4 shadow-inner">
          <span className="text-muted-foreground text-sm">
            {t("number-systems.simulator.numbers.isNegative")}{" "}
            {sign === "1"
              ? t("number-systems.simulator.numbers.yes")
              : t("number-systems.simulator.numbers.no")}
          </span>
          <span className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">
            {sign}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="mt-4 mb-2 text-xs font-semibold tracking-wider text-green-600 uppercase dark:text-green-400">
          {t("number-systems.simulator.numbers.step2ExpExtract")}
        </div>
        <div className="bg-background text-muted-foreground rounded-lg border border-green-500/20 p-4 text-sm shadow-inner">
          <p>{t("number-systems.simulator.numbers.expBinToDecDesc")}</p>
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
              <span className="text-foreground font-bold">{expVal - 127}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="mt-4 mb-2 text-xs font-semibold tracking-wider text-orange-600 uppercase dark:text-orange-400">
          {t("number-systems.simulator.numbers.step3MantExtract")}
        </div>
        <div className="bg-background text-muted-foreground space-y-2 rounded-lg border border-orange-500/20 p-4 text-sm shadow-inner">
          <p>{t("number-systems.simulator.numbers.mantissaBinToDecDesc")}</p>
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
              {t("number-systems.simulator.numbers.fractionSum")}:{" "}
              {sumOfFractions}
            </span>
            <span className="text-foreground font-bold">
              = 1.0 + {sumOfFractions} = {1 + sumOfFractions}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <div className="text-primary mb-2 text-xs font-semibold tracking-wider uppercase">
          {t("number-systems.simulator.numbers.step4FinalCalc")}
        </div>
        <div className="bg-background border-primary/20 text-muted-foreground space-y-2 rounded-lg border p-4 text-sm shadow-inner">
          <p>{t("number-systems.simulator.numbers.finalFormulaDesc")}</p>
          <div className="bg-muted/50 mt-2 flex flex-wrap items-center justify-center gap-4 rounded p-3 font-mono">
            <span>
              (-1)
              <sup className="text-blue-600 dark:text-blue-400">{sign}</sup>
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
  );
}

export function ConceptPath(props: IEEE754ConverterPartsProps) {
  const { t } = useTranslation("translation");
  const { isValid, isNaNVal, isSpecial } = props.analysis;

  if (!isValid && !isNaNVal) {
    return (
      <p className="text-muted-foreground text-sm">
        {t("number-systems.simulator.numbers.enterValueForExp")}
      </p>
    );
  }

  if (isSpecial || isNaNVal) {
    return (
      <p className="text-muted-foreground text-sm">
        {t("number-systems.simulator.numbers.specialCaseNoMath")}
      </p>
    );
  }

  return props.mode === "decToIeee" ? (
    <DecToIeeeExplanation {...props} />
  ) : (
    <IeeeToDecExplanation {...props} />
  );
}

export function ExplanationPanel({
  mode,
  analysis,
  locked,
  expectedResult,
  onShowSolution,
  onExitExercise,
}: ExplanationPanelProps) {
  const { t } = useTranslation("translation");

  return (
    <div className="bg-muted/30 border-border/50 max-h-200 overflow-auto rounded-xl border p-6 shadow-sm xl:max-h-150">
      {locked ? (
        <ExerciseValidationPanel
          expectedResult={expectedResult}
          onShowSolution={onShowSolution!}
          onExitExercise={onExitExercise}
          inputMode={mode === "decToIeee" ? "ieee-binary" : "float"}
          placeholder={
            mode === "decToIeee" ? "z.B. 0 10000000 0000000..." : "z.B. 12.5"
          }
        />
      ) : (
        <>
          <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
            <Info className="text-primary h-5 w-5" />
            {t("number-systems.simulator.numbers.conceptPath")}
          </h3>
          <ConceptPath mode={mode} analysis={analysis} />
        </>
      )}
    </div>
  );
}

export function ConverterCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border-border/50 rounded-xl border p-6 shadow-sm">
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h3 className="text-foreground text-lg font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}
