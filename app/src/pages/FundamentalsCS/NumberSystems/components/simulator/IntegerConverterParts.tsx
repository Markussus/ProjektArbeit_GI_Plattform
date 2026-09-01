import { ArrowRight, Info } from "lucide-react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { DropdownSelect } from "@/components/shared/DropdownSelect/DropdownSelect";
import { ExerciseValidationPanel } from "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel";
import type { ValidationInputMode } from "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel";
import type { BaseType } from "./nsTransferCodec";
import {
  baseToNumber,
  formatRemainder,
  generateDivisionSteps,
  generatePowerSteps,
} from "./integerConverterUtils";

interface BaseSelectorProps {
  label: string;
  value: BaseType;
  onChange: (value: BaseType) => void;
  disabled?: boolean;
  triggerTestId: string;
}

interface ConversionResultProps {
  decValue: string;
  targetValue: string;
  locked: boolean;
}

interface ToDecExplanationProps {
  sourceBase: BaseType;
  inputValue: string;
  decValue: string;
}

interface FromDecExplanationProps {
  targetBase: BaseType;
  decValue: string;
  targetValue: string;
}

interface ExplanationPanelProps {
  locked: boolean;
  sourceBase: BaseType;
  targetBase: BaseType;
  decValue: string;
  targetValue: string;
  onShowSolution?: () => void;
  onExitExercise?: () => void;
  inputValue: string;
}

interface ConverterInputPanelProps {
  sourceBase: BaseType;
  targetBase: BaseType;
  inputValue: string;
  locked: boolean;
  isExerciseMode?: boolean;
  showSolution?: boolean;
  initialBase: BaseType;
  onSourceBaseChange: (base: BaseType) => void;
  onTargetBaseChange: (base: BaseType) => void;
  onInputChange: (value: string) => void;
  decValue: string;
  targetValue: string;
}

const baseOptions = (t: TFunction<"translation">) => [
  {
    value: "dec" as const,
    label: t("number-systems.simulator.numbers.decimal"),
  },
  {
    value: "bin" as const,
    label: t("number-systems.simulator.numbers.binary"),
  },
  { value: "oct" as const, label: t("number-systems.simulator.numbers.octal") },
  { value: "hex" as const, label: t("number-systems.simulator.numbers.hex") },
];

function BaseSelector({
  label,
  value,
  onChange,
  disabled,
  triggerTestId,
}: BaseSelectorProps) {
  const { t } = useTranslation("translation");

  return (
    <div>
      <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
        {label}
      </label>
      <DropdownSelect
        value={value}
        options={baseOptions(t)}
        onChange={onChange}
        ariaLabel={label}
        disabled={disabled}
        triggerClassName="w-full px-3 py-2 text-sm font-normal"
        menuClassName="w-full"
        triggerTestId={triggerTestId}
      />
    </div>
  );
}

export function ValueInput({
  value,
  locked,
  sourceBase,
  onChange,
  isInvalid,
  baseNumber,
}: {
  value: string;
  locked: boolean;
  sourceBase: BaseType;
  onChange: (value: string) => void;
  isInvalid: boolean;
  baseNumber: number;
}) {
  const { t } = useTranslation("translation");

  return (
    <div className={locked ? "opacity-60" : ""}>
      <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
        {t("number-systems.simulator.numbers.valueLabel")}
      </label>
      <input
        type="text"
        data-testid="ns-converter-value-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
      {isInvalid && (
        <p className="text-destructive mt-1 text-xs">
          {t("number-systems.simulator.numbers.invalidInputBase")} {baseNumber}.
        </p>
      )}
    </div>
  );
}

function ConversionResult({
  decValue,
  targetValue,
  locked,
}: ConversionResultProps) {
  const { t } = useTranslation("translation");

  return (
    <div className="border-border/40 border-t pt-4">
      <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
        {t("number-systems.simulator.numbers.resultLabel")}
      </label>
      <div
        data-testid="ns-converter-result"
        className="text-primary bg-primary/5 border-primary/20 flex min-h-13.5 items-center rounded-md border px-4 py-3 font-mono text-xl font-bold tracking-wider break-all shadow-inner"
      >
        {!locked && decValue !== "" ? targetValue : locked ? "--------" : ""}
      </div>
    </div>
  );
}

export function ConverterInputPanel({
  sourceBase,
  targetBase,
  inputValue,
  locked,
  isExerciseMode,
  showSolution,
  initialBase,
  onSourceBaseChange,
  onTargetBaseChange,
  onInputChange,
  decValue,
  targetValue,
}: ConverterInputPanelProps) {
  const { t } = useTranslation("translation");
  const disabled = !!isExerciseMode && !showSolution;

  return (
    <div className="bg-card border-border/50 rounded-xl border p-6 shadow-sm">
      <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
        {t("number-systems.simulator.numbers.converter")}
      </h3>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <BaseSelector
            label={t("number-systems.simulator.numbers.fromBase")}
            value={sourceBase}
            onChange={onSourceBaseChange}
            disabled={disabled}
            triggerTestId="ns-integer-source-base"
          />
          <BaseSelector
            label={t("number-systems.simulator.numbers.toBase")}
            value={targetBase}
            onChange={onTargetBaseChange}
            disabled={disabled}
            triggerTestId="ns-integer-target-base"
          />
        </div>

        <ValueInput
          value={locked && initialBase !== sourceBase ? "" : inputValue}
          locked={locked}
          sourceBase={sourceBase}
          onChange={onInputChange}
          isInvalid={inputValue !== "" && decValue === ""}
          baseNumber={baseToNumber(sourceBase)}
        />

        <ConversionResult
          decValue={decValue}
          targetValue={targetValue}
          locked={locked}
        />
      </div>
    </div>
  );
}

export function ToDecExplanation({
  sourceBase,
  inputValue,
  decValue,
}: ToDecExplanationProps) {
  const { t } = useTranslation("translation");
  const sourceNum = baseToNumber(sourceBase);
  const steps = generatePowerSteps(sourceNum, inputValue);
  const isBin = sourceBase === "bin";

  return (
    <div className="space-y-3">
      <p className="text-foreground text-sm font-medium">
        {isBin
          ? t("number-systems.simulator.numbers.binToDec")
          : `${t(`number-systems.simulator.numbers.${sourceBase === "oct" ? "octal" : "hex"}`)} ${t("number-systems.simulator.numbers.toDec")}`}
      </p>
      <p className="text-muted-foreground mb-2 text-xs">
        {isBin
          ? t("number-systems.simulator.numbers.binToDecDesc")
          : t("number-systems.simulator.numbers.otherToDecDesc", {
              base: sourceNum,
            })}
      </p>
      <div className="bg-background border-border/40 space-y-2 overflow-x-auto rounded-lg border p-4 font-mono text-sm whitespace-nowrap shadow-inner">
        {isBin && (
          <div className="text-muted-foreground border-border/40 mb-2 flex gap-2 border-b pb-2">
            {steps.map((step, idx) => (
              <div key={idx} className="flex min-w-15 flex-col items-center">
                <span className="text-xs">
                  {sourceNum}
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
                ({step.digitVal.toString()} × {sourceNum}
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
}

export function FromDecExplanation({
  targetBase,
  decValue,
  targetValue,
}: FromDecExplanationProps) {
  const { t } = useTranslation("translation");
  const targetNum = baseToNumber(targetBase);
  const steps = generateDivisionSteps(decValue, targetNum);

  return (
    <div className="space-y-3">
      <p className="text-foreground text-sm font-medium">
        {targetBase === "bin"
          ? t("number-systems.simulator.numbers.decToBin")
          : t("number-systems.simulator.numbers.decToTarget", {
              target: t(
                `number-systems.simulator.numbers.${targetBase === "oct" ? "octal" : targetBase === "hex" ? "hex" : "decimal"}`,
              ),
            })}
      </p>
      <p className="text-muted-foreground mb-2 text-xs">
        {targetBase === "bin"
          ? t("number-systems.simulator.numbers.decToBinDesc")
          : t("number-systems.simulator.numbers.divByBaseDesc", {
              base: targetNum,
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
              {formatRemainder(step.remainder, targetBase)}
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
}

export function ExplanationContent({
  sourceBase,
  targetBase,
  decValue,
  targetValue,
  inputValue,
}: Omit<
  ExplanationPanelProps,
  "locked" | "onShowSolution" | "onExitExercise"
>) {
  const { t } = useTranslation("translation");

  const showToDecSteps = sourceBase !== "dec" && decValue !== "";
  const showFromDecSteps = targetBase !== "dec" && decValue !== "";

  if (!decValue) {
    return (
      <p className="text-muted-foreground text-sm">
        {t("number-systems.simulator.numbers.enterValue")}
      </p>
    );
  }

  if (sourceBase === targetBase) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center py-8">
        <ArrowRight className="mb-2 h-8 w-8 opacity-20" />
        <p className="text-sm">
          {t("number-systems.simulator.numbers.sameBase")}
        </p>
      </div>
    );
  }

  return (
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
          <ToDecExplanation
            sourceBase={sourceBase}
            inputValue={inputValue}
            decValue={decValue}
          />
        </div>
      )}

      {showToDecSteps && showFromDecSteps && (
        <div className="bg-border/50 my-6 h-px" />
      )}

      {showFromDecSteps && (
        <div>
          {showToDecSteps && (
            <h4 className="text-muted-foreground border-border/50 mb-3 border-b pb-2 text-xs font-bold tracking-wider uppercase">
              {t("number-systems.simulator.numbers.step2TempTarget")}
            </h4>
          )}
          <FromDecExplanation
            targetBase={targetBase}
            decValue={decValue}
            targetValue={targetValue}
          />
        </div>
      )}
    </div>
  );
}

const INPUT_MODES: Record<BaseType, ValidationInputMode> = {
  bin: "binary",
  oct: "octal",
  dec: "decimal",
  hex: "hex",
};

export function ExplanationPanel({
  locked,
  sourceBase,
  targetBase,
  decValue,
  targetValue,
  onShowSolution,
  onExitExercise,
  inputValue,
}: ExplanationPanelProps) {
  const { t } = useTranslation("translation");

  return (
    <div className="bg-muted/30 border-border/50 max-h-125 overflow-auto rounded-xl border p-6 shadow-sm">
      {locked ? (
        <ExerciseValidationPanel
          expectedResult={targetValue}
          onShowSolution={onShowSolution!}
          onExitExercise={onExitExercise}
          inputMode={INPUT_MODES[targetBase] ?? "text"}
          placeholder={`z.B. ${targetBase === "bin" ? "10110" : targetBase === "hex" ? "2A" : "42"}`}
        />
      ) : (
        <>
          <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
            <Info className="text-primary h-5 w-5" />
            {t("number-systems.simulator.numbers.explanation")}
          </h3>
          <ExplanationContent
            sourceBase={sourceBase}
            targetBase={targetBase}
            decValue={decValue}
            targetValue={targetValue}
            inputValue={inputValue}
          />
        </>
      )}
    </div>
  );
}
