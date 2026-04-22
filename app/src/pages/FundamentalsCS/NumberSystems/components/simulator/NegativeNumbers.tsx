import { useState, useEffect } from "react";
import { Info, LockKeyhole } from "lucide-react";
import { useTranslation } from "react-i18next";

interface NegativeNumbersProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialValue?: string;
}

export function NegativeNumbers({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
  initialValue = "",
}: NegativeNumbersProps) {
  const { t } = useTranslation("translation");
  const [inputValue, setInputValue] = useState<string>("-5");
  type StepMode = "sign" | "ones" | "twos";
  const [activeMode, setActiveMode] = useState<StepMode>("twos");

  useEffect(() => {
    if (isExerciseMode && initialValue) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputValue(initialValue);
    }
  }, [isExerciseMode, initialValue]);

  const parsed = parseInt(inputValue, 10);
  const isValid = !isNaN(parsed) && parsed >= -128 && parsed <= 127;

  // 8-bit conversions
  let signMagnitude = "00000000";
  let onesComplement = "00000000";
  let twosComplement = "00000000";
  let positiveBin = "00000000";

  if (isValid) {
    const absVal = Math.abs(parsed);
    positiveBin = absVal.toString(2).padStart(8, "0");

    if (parsed >= 0) {
      signMagnitude = positiveBin;
      onesComplement = positiveBin;
      twosComplement = positiveBin;
    } else {
      signMagnitude = "1" + positiveBin.substring(1);

      let ones = "";
      for (const bit of positiveBin) {
        ones += bit === "0" ? "1" : "0";
      }
      onesComplement = ones;

      // Twos complement: invert and add 1
      let twos = "";
      let carry = 1;
      for (let i = 7; i >= 0; i--) {
        const bit = onesComplement[i];
        if (bit === "1" && carry === 1) {
          twos = "0" + twos;
        } else if (bit === "0" && carry === 1) {
          twos = "1" + twos;
          carry = 0;
        } else {
          twos = bit + twos;
        }
      }
      twosComplement = twos;
    }
  }

  const locked = !!isExerciseMode && !showSolution;

  return (
    <div className="animate-in fade-in zoom-in-95 space-y-8 duration-300">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Converter Inputs */}
        <div className="bg-card border-border/50 rounded-xl border p-6 shadow-sm">
          <h3 className="text-foreground mb-4 text-lg font-semibold">
            {t("simulator.numbers.eightBit")}
          </h3>
          <div className="space-y-6">
            <div className={locked ? "opacity-60" : ""}>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                {t("simulator.numbers.decInput")}
              </label>
              <div
                className={`bg-background relative flex items-center border ${locked ? "border-input bg-muted pointer-events-none" : "border-input focus-within:border-primary focus-within:ring-primary/20 focus-within:ring-1"} overflow-hidden rounded-md`}
              >
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  readOnly={locked}
                  className="text-foreground w-full border-none bg-transparent px-3 py-2 font-mono text-sm focus:outline-none"
                />
              </div>
              {!isValid && inputValue !== "" && (
                <p className="text-destructive mt-1 text-xs">
                  {t("simulator.numbers.invalidRange")}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <ResultRow
                label={t("simulator.numbers.signMagnitude")}
                value={locked ? "" : signMagnitude}
                valid={isValid}
                highlight={activeMode === "sign"}
                onClick={() => setActiveMode("sign")}
              />
              <ResultRow
                label={t("simulator.numbers.onesComplement")}
                value={locked ? "" : onesComplement}
                valid={isValid}
                highlight={activeMode === "ones"}
                onClick={() => setActiveMode("ones")}
              />
              <ResultRow
                label={t("simulator.numbers.twosComplement")}
                value={locked ? "" : twosComplement}
                valid={isValid}
                highlight={activeMode === "twos"}
                onClick={() => setActiveMode("twos")}
              />
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
                {activeMode === "twos"
                  ? t("simulator.numbers.stepByStepTwos")
                  : activeMode === "ones"
                    ? t("simulator.numbers.stepByStepOnes")
                    : t("simulator.numbers.stepByStepSign")}
              </h3>

              {!isValid ? (
                <p className="text-muted-foreground text-sm">
                  {t("simulator.numbers.enterValueForExp")}
                </p>
              ) : parsed >= 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t("simulator.numbers.positiveExplanation")}
                </p>
              ) : (
                <div className="space-y-6">
                  <p className="text-muted-foreground text-sm">
                    {activeMode === "twos"
                      ? t("simulator.numbers.howTwosBuilt", { val: parsed })
                      : activeMode === "ones"
                        ? t("simulator.numbers.howOnesBuilt", { val: parsed })
                        : t("simulator.numbers.howSignBuilt", { val: parsed })}
                  </p>

                  <div className="space-y-4">
                    <div className="bg-background border-border/40 rounded-lg border p-4 shadow-inner">
                      <div className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                        {t("simulator.numbers.step1Abs")}
                      </div>
                      <p className="text-muted-foreground mb-2 text-xs">
                        {t("simulator.numbers.positive8Bit", {
                          val: Math.abs(parsed),
                        })}
                      </p>
                      <div className="text-foreground bg-muted/50 rounded py-2 text-center font-mono text-lg tracking-[0.25em]">
                        {positiveBin}
                      </div>
                    </div>

                    {activeMode === "sign" && (
                      <div className="bg-background border-border/40 relative mt-4 rounded-lg border p-4 shadow-inner">
                        <div className="bg-popover text-popover-foreground absolute -top-3 left-1/2 -translate-x-1/2 rounded px-2 py-0.5 text-xs shadow">
                          {t("simulator.numbers.flipFirstBit")}
                        </div>
                        <div className="text-muted-foreground mt-2 mb-2 text-xs font-semibold tracking-wider uppercase">
                          {t("simulator.numbers.step2Sign")}
                        </div>
                        <p className="text-muted-foreground mb-2 text-xs">
                          {t("simulator.numbers.setSignBit")}
                        </p>
                        <div className="bg-primary/10 flex justify-center rounded py-2 text-center font-mono text-lg tracking-[0.25em]">
                          <span className="text-destructive font-bold">1</span>
                          <span className="text-primary">
                            {positiveBin.substring(1)}
                          </span>
                        </div>
                      </div>
                    )}

                    {(activeMode === "ones" || activeMode === "twos") && (
                      <div className="bg-background border-border/40 relative mt-4 rounded-lg border p-4 shadow-inner">
                        <div className="bg-popover text-popover-foreground absolute -top-3 left-1/2 -translate-x-1/2 rounded px-2 py-0.5 text-xs shadow">
                          {t("simulator.numbers.flipBits")}
                        </div>
                        <div className="text-muted-foreground mt-2 mb-2 text-xs font-semibold tracking-wider uppercase">
                          {t("simulator.numbers.step2Ones")}
                        </div>
                        <p className="text-muted-foreground mb-2 text-xs">
                          {t("simulator.numbers.zeroToOne")}
                        </p>
                        <div className="rounded bg-orange-500/10 py-2 text-center font-mono text-lg tracking-[0.25em] text-orange-500">
                          {onesComplement}
                        </div>
                      </div>
                    )}

                    {activeMode === "twos" && (
                      <div className="bg-background border-border/40 relative mt-4 rounded-lg border p-4 shadow-inner">
                        <div className="bg-popover text-popover-foreground absolute -top-3 left-1/2 -translate-x-1/2 rounded px-2 py-0.5 text-xs shadow">
                          {t("simulator.numbers.addOne")}
                        </div>
                        <div className="text-muted-foreground mt-2 mb-2 text-xs font-semibold tracking-wider uppercase">
                          {t("simulator.numbers.step3Twos")}
                        </div>
                        <p className="text-muted-foreground mb-2 text-xs">
                          {t("simulator.numbers.addToOnes")}
                        </p>
                        <div className="bg-primary/10 flex flex-col items-center rounded py-2 font-mono text-lg tracking-[0.25em]">
                          <div className="text-orange-500">
                            {onesComplement}
                          </div>
                          <div className="text-muted-foreground/70">+ 1</div>
                          <div className="bg-primary/30 my-1 h-[1px] w-4/5"></div>
                          <div className="text-primary font-bold">
                            {twosComplement}
                          </div>
                        </div>
                      </div>
                    )}
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

function ResultRow({
  label,
  value,
  valid,
  highlight = false,
  onClick,
}: {
  label: string;
  value: string;
  valid: boolean;
  highlight?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={valid ? onClick : undefined}
      disabled={!valid || !onClick}
      className={`w-full rounded-lg border p-3 text-left transition-colors ${highlight ? "border-primary bg-primary/5 ring-primary/20 ring-1" : "border-border/40 bg-background hover:border-primary/50 cursor-pointer"} ${(!valid || !onClick) && "hover:border-border/40 cursor-not-allowed opacity-50"}`}
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
