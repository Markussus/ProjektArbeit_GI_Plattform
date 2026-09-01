import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExerciseValidationPanel } from "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel";
import type { NegativeStepMode } from "./nsTransferCodec";
import type { NegativeNumberConversions } from "./negativeNumbersUtils";

interface ExplanationPanelProps {
  conversions: NegativeNumberConversions;
  activeMode: NegativeStepMode;
  parsed: number | null;
  isValid: boolean;
  locked: boolean;
  onShowSolution?: () => void;
  onExitExercise?: () => void;
}

export function ResultRow({
  label,
  value,
  valid,
  highlight = false,
  onClick,
  ...rest
}: {
  label: string;
  value: string;
  valid: boolean;
  highlight?: boolean;
  onClick?: () => void;
} & React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      onClick={valid ? onClick : undefined}
      disabled={!valid || !onClick}
      className={`w-full rounded-lg border p-3 text-left ${highlight ? "border-primary bg-primary/5 ring-primary/20 ring-1" : "border-border/40 bg-background hover:border-primary/50 cursor-pointer"} ${(!valid || !onClick) && "hover:border-border/40 cursor-not-allowed opacity-50"}`}
    >
      <div className="text-muted-foreground mb-1 text-xs">{label}</div>
      <div
        className={`font-mono text-base tracking-[0.2em] ${valid ? (highlight ? "text-primary font-semibold" : "text-foreground") : "text-muted-foreground opacity-50"}`}
      >
        {valid && value ? value : "--------"}
      </div>
    </button>
  );
}

export function InputPanel({
  inputValue,
  locked,
  isValid,
  onChange,
  conversions,
  activeMode,
  onModeChange,
}: {
  inputValue: string;
  locked: boolean;
  isValid: boolean;
  onChange: (value: string) => void;
  conversions: NegativeNumberConversions;
  activeMode: NegativeStepMode;
  onModeChange: (mode: NegativeStepMode) => void;
}) {
  const { t } = useTranslation("translation");

  return (
    <div className="bg-card border-border/50 rounded-xl border p-6 shadow-sm">
      <h3 className="text-foreground mb-4 text-lg font-semibold">
        {t("number-systems.simulator.numbers.eightBit")}
      </h3>
      <div className="space-y-6">
        <div className={locked ? "opacity-60" : ""}>
          <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
            {t("number-systems.simulator.numbers.decInput")}
          </label>
          <div
            className={`bg-background relative flex items-center border ${locked ? "border-input bg-muted pointer-events-none" : "border-input focus-within:border-primary focus-within:ring-primary/20 focus-within:ring-1"} overflow-hidden rounded-md`}
          >
            <input
              type="number"
              data-testid="ns-negative-decimal-input"
              value={inputValue}
              onChange={(e) => onChange(e.target.value)}
              readOnly={locked}
              className="text-foreground w-full border-none bg-transparent px-3 py-2 font-mono text-sm focus:outline-none"
            />
          </div>
          {!isValid && inputValue !== "" && (
            <p className="text-destructive mt-1 text-xs">
              {t("number-systems.simulator.numbers.invalidRange")}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <ResultRow
            data-testid="ns-negative-sign-magnitude"
            label={t("number-systems.simulator.numbers.signMagnitude")}
            value={locked ? "" : conversions.signMagnitude}
            valid={isValid}
            highlight={activeMode === "sign"}
            onClick={() => onModeChange("sign")}
          />
          <ResultRow
            data-testid="ns-negative-ones-complement"
            label={t("number-systems.simulator.numbers.onesComplement")}
            value={locked ? "" : conversions.onesComplement}
            valid={isValid}
            highlight={activeMode === "ones"}
            onClick={() => onModeChange("ones")}
          />
          <ResultRow
            data-testid="ns-negative-twos-complement"
            label={t("number-systems.simulator.numbers.twosComplement")}
            value={locked ? "" : conversions.twosComplement}
            valid={isValid}
            highlight={activeMode === "twos"}
            onClick={() => onModeChange("twos")}
          />
        </div>
      </div>
    </div>
  );
}

export function ModeTitle({ activeMode }: { activeMode: NegativeStepMode }) {
  const { t } = useTranslation("translation");
  return (
    <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
      <Info className="text-primary h-5 w-5" />
      {activeMode === "twos"
        ? t("number-systems.simulator.numbers.stepByStepTwos")
        : activeMode === "ones"
          ? t("number-systems.simulator.numbers.stepByStepOnes")
          : t("number-systems.simulator.numbers.stepByStepSign")}
    </h3>
  );
}

export function StepIntro({
  activeMode,
  parsed,
}: {
  activeMode: NegativeStepMode;
  parsed: number;
}) {
  const { t } = useTranslation("translation");
  return (
    <p className="text-muted-foreground text-sm">
      {activeMode === "twos"
        ? t("number-systems.simulator.numbers.howTwosBuilt", { val: parsed })
        : activeMode === "ones"
          ? t("number-systems.simulator.numbers.howOnesBuilt", { val: parsed })
          : t("number-systems.simulator.numbers.howSignBuilt", { val: parsed })}
    </p>
  );
}

export function Step1Abs({
  parsed,
  positiveBin,
}: {
  parsed: number;
  positiveBin: string;
}) {
  const { t } = useTranslation("translation");
  return (
    <div className="bg-background border-border/40 rounded-lg border p-4 shadow-inner">
      <div className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
        {t("number-systems.simulator.numbers.step1Abs")}
      </div>
      <p className="text-muted-foreground mb-2 text-xs">
        {t("number-systems.simulator.numbers.positive8Bit", {
          val: Math.abs(parsed),
        })}
      </p>
      <div className="text-foreground bg-muted/50 rounded py-2 text-center font-mono text-lg tracking-[0.25em]">
        {positiveBin}
      </div>
    </div>
  );
}

export function Step2Sign({ positiveBin }: { positiveBin: string }) {
  const { t } = useTranslation("translation");
  return (
    <div className="bg-background border-border/40 relative mt-4 rounded-lg border p-4 shadow-inner">
      <div className="bg-popover text-popover-foreground absolute -top-3 left-1/2 -translate-x-1/2 rounded px-2 py-0.5 text-xs shadow">
        {t("number-systems.simulator.numbers.flipFirstBit")}
      </div>
      <div className="text-muted-foreground mt-2 mb-2 text-xs font-semibold tracking-wider uppercase">
        {t("number-systems.simulator.numbers.step2Sign")}
      </div>
      <p className="text-muted-foreground mb-2 text-xs">
        {t("number-systems.simulator.numbers.setSignBit")}
      </p>
      <div className="bg-primary/10 flex justify-center rounded py-2 text-center font-mono text-lg tracking-[0.25em]">
        <span className="text-destructive font-bold">1</span>
        <span className="text-primary">{positiveBin.substring(1)}</span>
      </div>
    </div>
  );
}

export function Step2Ones({ onesComplement }: { onesComplement: string }) {
  const { t } = useTranslation("translation");
  return (
    <div className="bg-background border-border/40 relative mt-4 rounded-lg border p-4 shadow-inner">
      <div className="bg-popover text-popover-foreground absolute -top-3 left-1/2 -translate-x-1/2 rounded px-2 py-0.5 text-xs shadow">
        {t("number-systems.simulator.numbers.flipBits")}
      </div>
      <div className="text-muted-foreground mt-2 mb-2 text-xs font-semibold tracking-wider uppercase">
        {t("number-systems.simulator.numbers.step2Ones")}
      </div>
      <p className="text-muted-foreground mb-2 text-xs">
        {t("number-systems.simulator.numbers.zeroToOne")}
      </p>
      <div className="rounded bg-orange-500/10 py-2 text-center font-mono text-lg tracking-[0.25em] text-orange-500">
        {onesComplement}
      </div>
    </div>
  );
}

export function Step3Twos({
  onesComplement,
  twosComplement,
}: {
  onesComplement: string;
  twosComplement: string;
}) {
  const { t } = useTranslation("translation");
  return (
    <div className="bg-background border-border/40 relative mt-4 rounded-lg border p-4 shadow-inner">
      <div className="bg-popover text-popover-foreground absolute -top-3 left-1/2 -translate-x-1/2 rounded px-2 py-0.5 text-xs shadow">
        {t("number-systems.simulator.numbers.addOne")}
      </div>
      <div className="text-muted-foreground mt-2 mb-2 text-xs font-semibold tracking-wider uppercase">
        {t("number-systems.simulator.numbers.step3Twos")}
      </div>
      <p className="text-muted-foreground mb-2 text-xs">
        {t("number-systems.simulator.numbers.addToOnes")}
      </p>
      <div className="bg-primary/10 flex flex-col items-center rounded py-2 font-mono text-lg tracking-[0.25em]">
        <div className="text-orange-500">{onesComplement}</div>
        <div className="text-muted-foreground/70">+ 1</div>
        <div className="bg-primary/30 my-1 h-px w-4/5"></div>
        <div className="text-primary font-bold">{twosComplement}</div>
      </div>
    </div>
  );
}

export function NegativeExplanation({
  parsed,
  conversions,
  activeMode,
}: {
  parsed: number;
  conversions: NegativeNumberConversions;
  activeMode: NegativeStepMode;
}) {
  useTranslation("translation");
  const { positiveBin, onesComplement, twosComplement } = conversions;

  return (
    <div className="space-y-6">
      <StepIntro activeMode={activeMode} parsed={parsed} />
      <div className="space-y-4">
        <Step1Abs parsed={parsed} positiveBin={positiveBin} />

        {activeMode === "sign" && <Step2Sign positiveBin={positiveBin} />}

        {(activeMode === "ones" || activeMode === "twos") && (
          <Step2Ones onesComplement={onesComplement} />
        )}

        {activeMode === "twos" && (
          <Step3Twos
            onesComplement={onesComplement}
            twosComplement={twosComplement}
          />
        )}
      </div>
    </div>
  );
}

export function ExplanationContent({
  isValid,
  parsed,
  conversions,
  activeMode,
}: {
  isValid: boolean;
  parsed: number | null;
  conversions: NegativeNumberConversions;
  activeMode: NegativeStepMode;
}) {
  const { t } = useTranslation("translation");

  if (!isValid || parsed === null) {
    return (
      <p className="text-muted-foreground text-sm">
        {t("number-systems.simulator.numbers.enterValueForExp")}
      </p>
    );
  }

  if (parsed >= 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {t("number-systems.simulator.numbers.positiveExplanation")}
      </p>
    );
  }

  return (
    <NegativeExplanation
      parsed={parsed}
      conversions={conversions}
      activeMode={activeMode}
    />
  );
}

export function ExplanationPanel({
  conversions,
  activeMode,
  parsed,
  isValid,
  locked,
  onShowSolution,
  onExitExercise,
}: ExplanationPanelProps) {
  useTranslation("translation");

  return (
    <div className="bg-muted/30 border-border/50 max-h-125 overflow-auto rounded-xl border p-6 shadow-sm">
      {locked ? (
        <ExerciseValidationPanel
          expectedResult={conversions.twosComplement}
          onShowSolution={onShowSolution!}
          onExitExercise={onExitExercise}
          inputMode="binary"
          placeholder="z.B. 11110001"
        />
      ) : (
        <>
          <ModeTitle activeMode={activeMode} />
          <ExplanationContent
            isValid={isValid}
            parsed={parsed}
            conversions={conversions}
            activeMode={activeMode}
          />
        </>
      )}
    </div>
  );
}
