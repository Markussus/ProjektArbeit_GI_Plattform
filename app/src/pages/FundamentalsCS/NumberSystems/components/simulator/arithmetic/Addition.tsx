import { useState, useMemo } from "react";
import {
  Info,
  LockKeyhole,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  List,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface AdditionProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialA?: string;
  initialB?: string;
}

interface BitStep {
  position: number;
  bitA: number;
  bitB: number;
  carryIn: number;
  sum: number;
  carryOut: number;
  explanation: string;
}

export function Addition({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
  initialA,
  initialB,
}: AdditionProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "01100101");
  const [valB, setValB] = useState(initialB || "00111100");
  const [showStepByStep, setShowStepByStep] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(
    new Set(["0", "1", "2"]),
  );

  const locked = !!isExerciseMode && !showSolution;

  const handleInputA = (val: string) => {
    if (locked) return;
    setValA(val.replace(/[^01]/g, "").slice(0, 8));
  };
  const handleInputB = (val: string) => {
    if (locked) return;
    setValB(val.replace(/[^01]/g, "").slice(0, 8));
  };

  const { padA, padB, sum, carries, overflow, carryOut, bitSteps } =
    useMemo(() => {
      const padA = valA.padStart(8, "0");
      const padB = valB.padStart(8, "0");

      const carriesArr = Array(9).fill(0);
      const sumArr = Array(8).fill(0);
      const steps: BitStep[] = [];

      for (let i = 7; i >= 0; i--) {
        const bitA = parseInt(padA[i] || "0");
        const bitB = parseInt(padB[i] || "0");
        const cIn = carriesArr[7 - i];
        const s = bitA + bitB + cIn;
        sumArr[i] = s % 2;
        const cOut = Math.floor(s / 2);
        carriesArr[7 - i + 1] = cOut;

        let explanation = "";
        if (bitA === 0 && bitB === 0 && cIn === 0) {
          explanation = t("simulator.arithmetic.addition.step0");
        } else if (bitA === 1 && bitB === 0 && cIn === 0) {
          explanation = t("simulator.arithmetic.addition.step1");
        } else if (bitA === 0 && bitB === 1 && cIn === 0) {
          explanation = t("simulator.arithmetic.addition.step2");
        } else if (bitA === 0 && bitB === 0 && cIn === 1) {
          explanation = t("simulator.arithmetic.addition.step3");
        } else if (bitA === 1 && bitB === 1 && cIn === 0) {
          explanation = t("simulator.arithmetic.addition.step4");
        } else if (bitA === 1 && bitB === 0 && cIn === 1) {
          explanation = t("simulator.arithmetic.addition.step5");
        } else if (bitA === 0 && bitB === 1 && cIn === 1) {
          explanation = t("simulator.arithmetic.addition.step6");
        } else if (bitA === 1 && bitB === 1 && cIn === 1) {
          explanation = t("simulator.arithmetic.addition.step7");
        }

        steps.unshift({
          position: 7 - i,
          bitA,
          bitB,
          carryIn: cIn,
          sum: sumArr[i],
          carryOut: cOut,
          explanation,
        });
      }

      const overflow = carriesArr[7] !== carriesArr[8];
      const carryOut = carriesArr[8] === 1;
      const visCarries = [...carriesArr].reverse();

      return {
        padA,
        padB,
        sum: sumArr.join(""),
        carries: visCarries,
        overflow,
        carryOut,
        bitSteps: steps,
      };
    }, [valA, valB, t]);

  const toggleStep = (index: number) => {
    const newExpanded = new Set(expandedSteps);
    const key = String(index);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSteps(newExpanded);
  };

  return (
    <div className="animate-in fade-in zoom-in-95 grid w-full grid-cols-1 gap-6 duration-300 md:grid-cols-2">
      {/* Inputs */}
      <div className="bg-card border-border/50 space-y-6 rounded-xl border p-6 shadow-sm">
        <div>
          <h3 className="text-foreground mb-2 flex items-center gap-2 text-lg font-semibold">
            {t("simulator.arithmetic.common.operands8bit")}
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">
            {t("simulator.arithmetic.addition.desc")}
          </p>
        </div>

        <div className="space-y-4">
          <div className={locked ? "opacity-60" : ""}>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              {t("simulator.arithmetic.common.operandA")}
            </label>
            <input
              type="text"
              value={valA}
              onChange={(e) => handleInputA(e.target.value)}
              readOnly={locked}
              className={`bg-background text-foreground w-full rounded-md border px-3 py-2 font-mono text-sm tracking-widest transition-colors focus:outline-none ${locked ? "bg-muted border-input pointer-events-none" : "border-input focus:border-primary focus:ring-primary/20 focus:ring-1"}`}
            />
          </div>
          <div className={locked ? "opacity-60" : ""}>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              {t("simulator.arithmetic.common.operandB")}
            </label>
            <input
              type="text"
              value={valB}
              onChange={(e) => handleInputB(e.target.value)}
              readOnly={locked}
              className={`bg-background text-foreground w-full rounded-md border px-3 py-2 font-mono text-sm tracking-widest transition-colors focus:outline-none ${locked ? "bg-muted border-input pointer-events-none" : "border-input focus:border-primary focus:ring-primary/20 focus:ring-1"}`}
            />
          </div>
        </div>
      </div>

      {/* Logic / Dashboard Panel */}
      <div className="bg-muted/30 border-border/50 overflow-auto rounded-xl border p-6 shadow-sm">
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
          <div className="space-y-6">
            <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
              <Info className="text-primary h-5 w-5" />
              {t("simulator.arithmetic.common.stepsResult")}
            </h3>

            {/* Step-by-Step Toggle */}
            <button
              onClick={() => setShowStepByStep(!showStepByStep)}
              className="text-primary hover:text-primary/80 mb-4 flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <List className="h-4 w-4" />
              {t("simulator.arithmetic.common.showStepByStep")}
              {showStepByStep ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {showStepByStep && (
              <div className="space-y-3">
                <div className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                  {t("simulator.arithmetic.addition.stepByStepTitle")}
                </div>

                {/* Bit Position Legend */}
                <div className="mb-4 flex justify-center">
                  <div className="text-muted-foreground bg-background border-border/40 flex gap-2 rounded border p-2 font-mono text-xs">
                    <div className="flex items-center gap-1">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/10">
                        A
                      </span>
                      <span>{t("simulator.arithmetic.addition.legendA")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-green-500/10">
                        B
                      </span>
                      <span>{t("simulator.arithmetic.addition.legendB")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-yellow-500/10">
                        C
                      </span>
                      <span>{t("simulator.arithmetic.addition.legendC")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded">
                        S
                      </span>
                      <span>{t("simulator.arithmetic.addition.legendS")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="bg-destructive/10 text-destructive flex h-6 w-6 items-center justify-center rounded">
                        →
                      </span>
                      <span>
                        {t("simulator.arithmetic.addition.legendOut")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Collapsible Steps */}
                <div className="space-y-2">
                  {bitSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="border-border/40 overflow-hidden rounded-lg border"
                    >
                      <button
                        onClick={() => toggleStep(idx)}
                        className="bg-background hover:bg-muted/50 flex w-full items-center justify-between p-3 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground text-xs font-bold">
                            {t("simulator.arithmetic.addition.bitPos", {
                              pos: step.position,
                            })}
                          </span>
                          <div className="flex items-center gap-1 font-mono text-sm">
                            <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/10">
                              {step.bitA}
                            </span>
                            <span>+</span>
                            <span className="flex h-6 w-6 items-center justify-center rounded bg-green-500/10">
                              {step.bitB}
                            </span>
                            <span>+</span>
                            <span className="flex h-6 w-6 items-center justify-center rounded bg-yellow-500/10">
                              {step.carryIn}
                            </span>
                            <span>=</span>
                            <span className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded font-bold">
                              {step.sum}
                            </span>
                            {step.carryOut > 0 && (
                              <>
                                <span className="text-muted-foreground mx-1">
                                  →
                                </span>
                                <span className="bg-destructive/10 text-destructive flex h-6 w-6 items-center justify-center rounded font-bold">
                                  {step.carryOut}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {expandedSteps.has(String(idx)) ? (
                          <ChevronDown className="text-muted-foreground h-4 w-4" />
                        ) : (
                          <ChevronRight className="text-muted-foreground h-4 w-4" />
                        )}
                      </button>
                      {expandedSteps.has(String(idx)) && (
                        <div className="bg-muted/30 border-border/40 border-t p-3">
                          <p className="text-foreground text-sm">
                            {step.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-border/50 mt-4 border-t pt-4">
                  <p className="text-muted-foreground text-sm">
                    {t("simulator.arithmetic.addition.finalResult")}
                  </p>
                </div>
              </div>
            )}

            {/* Math Grid */}
            <div className="flex justify-center p-4">
              <div className="bg-background border-border/40 rounded-lg border p-6 font-mono text-lg leading-loose font-medium tracking-widest shadow-inner select-none md:text-xl">
                {/* Carries */}
                <div className="text-destructive flex gap-2 text-sm">
                  <span className="w-4" />
                  <span className="mr-2 w-4" />
                  {carries.slice(0, 8).map((c, i) => (
                    <span
                      key={i}
                      className={`w-4 text-center ${c ? "font-bold opacity-100" : "opacity-20"}`}
                    >
                      {c}
                    </span>
                  ))}
                </div>

                {/* Pad A */}
                <div className="flex gap-2">
                  <span className="w-4 text-center" />
                  <span className="mr-2 w-4 text-center" />
                  {padA.split("").map((b, i) => (
                    <span key={`a-${i}`} className="w-4 text-center">
                      {b}
                    </span>
                  ))}
                </div>

                {/* Pad B */}
                <div className="border-foreground/30 mb-2 flex gap-2 border-b-2 pb-2">
                  <span className="text-primary mr-2 w-4 text-center">+</span>
                  <span className="w-4 text-center" />
                  {padB.split("").map((b, i) => (
                    <span key={`b-${i}`} className="w-4 text-center">
                      {b}
                    </span>
                  ))}
                </div>

                {/* Sum */}
                <div className="flex gap-2">
                  <span className="w-4 text-center" />
                  <span
                    className={`mr-2 w-4 text-center ${carryOut ? "text-destructive font-bold" : "text-muted-foreground opacity-20"}`}
                  >
                    {carries[0]}
                  </span>
                  {sum.split("").map((b, i) => (
                    <span
                      key={`s-${i}`}
                      className="text-primary w-4 text-center font-bold"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Warnings */}
            <div className="space-y-3">
              {carryOut && (
                <div className="bg-destructive/10 border-destructive flex items-start gap-3 rounded-r-md border-l-4 p-4">
                  <AlertTriangle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
                  <p className="text-destructive-foreground text-sm">
                    <strong className="mb-1 block">
                      {t("simulator.arithmetic.subtraction.carryOutTitle")}
                    </strong>
                    {t("simulator.arithmetic.addition.carryOutWarning")}
                  </p>
                </div>
              )}
              {overflow && (
                <div className="flex items-start gap-3 rounded-r-md border-l-4 border-orange-500 bg-orange-500/10 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                  <p className="text-sm text-orange-700 dark:text-orange-400">
                    <strong className="mb-1 block">
                      {t("simulator.arithmetic.addition.overflowTitle")}
                    </strong>
                    {t("simulator.arithmetic.addition.overflowWarning")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
