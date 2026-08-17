import { useState, useMemo, useEffect } from "react";
import { Info, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExerciseValidationPanel } from "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel";
import type { BaseArithmeticProps } from "./types";
import {
  SimulatorLayout,
  BinaryInput,
  StepByStepToggle,
  CollapsibleStep,
  WarningBanner,
  ResultSectionHeader,
  useToggleSet,
} from "@/components/shared/SimulatorShared";

interface OnesComplementStep {
  position: number;
  originalBit: string;
  flippedBit: string;
  explanation: string;
}

interface TwosComplementStep {
  position: number;
  carryIn: number;
  currentBit: number;
  resultBit: number;
  carryOut: number;
  explanation: string;
}

interface AdditionStep {
  position: number;
  bitA: number;
  bitB: number;
  carryIn: number;
  sum: number;
  carryOut: number;
  explanation: string;
}

export function Subtraction({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
  onExitExercise,
  initialA,
  initialB,
  onChangeValues,
  renderModeSelector,
}: BaseArithmeticProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "00101010");
  const [valB, setValB] = useState(initialB || "00001010");
  const [showStepByStep, setShowStepByStep] = useState(false);
  const { expanded, toggle } = useToggleSet(["0", "1", "2"]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initialA) setValA(initialA);
    if (initialB) setValB(initialB);
  }, [initialA, initialB]);

  useEffect(() => {
    onChangeValues?.(valA, valB);
  }, [valA, valB, onChangeValues]);

  const locked = !!isExerciseMode && !showSolution;

  const handleInputA = (val: string) => {
    if (locked) return;
    setValA(val.replace(/[^01]/g, "").slice(0, 8));
  };
  const handleInputB = (val: string) => {
    if (locked) return;
    setValB(val.replace(/[^01]/g, "").slice(0, 8));
  };

  const {
    padA,
    padB,
    onesComp,
    twosComp,
    onesSteps,
    twosSteps,
    addSteps,
    sum,
    carries,
    overflow,
    carryOut,
  } = useMemo(() => {
    const padA = valA.padStart(8, "0");
    const padB = valB.padStart(8, "0");

    const onesComp = padB
      .split("")
      .map((b) => (b === "1" ? "0" : "1"))
      .join("");

    const onesSteps: OnesComplementStep[] = padB
      .split("")
      .map((bit, i) => ({
        position: 7 - i,
        originalBit: bit,
        flippedBit: bit === "1" ? "0" : "1",
        explanation: t("simulator.arithmetic.subtraction.flipBitDesc", {
          pos: 7 - i,
          orig: bit,
          flipped: bit === "1" ? "0" : "1",
        }),
      }))
      .reverse();

    const twosCompArr = Array(8).fill(0);
    let c = 1;
    for (let i = 7; i >= 0; i--) {
      const bit = parseInt(onesComp[i]);
      const s = bit + c;
      twosCompArr[i] = s % 2;
      c = Math.floor(s / 2);
    }
    const twosComp = twosCompArr.join("");

    const twosSteps: TwosComplementStep[] = [];
    c = 1;
    for (let i = 7; i >= 0; i--) {
      const bit = parseInt(onesComp[i]);
      const s = bit + c;
      const resultBit = s % 2;
      c = Math.floor(s / 2);
      twosSteps.unshift({
        position: 7 - i,
        carryIn: c === 0 ? 1 : 0,
        currentBit: bit,
        resultBit,
        carryOut: c,
        explanation: t("simulator.arithmetic.subtraction.addOneDesc", {
          pos: 7 - i,
          bit: bit,
          carry: c === 0 ? 1 : 0,
          sum: s,
          result: resultBit,
          nextCarry: c,
        }),
      });
    }

    const carriesArr = Array(9).fill(0);
    const sumArr = Array(8).fill(0);
    const addSteps: AdditionStep[] = [];

    for (let i = 7; i >= 0; i--) {
      const bitA = parseInt(padA[i] || "0");
      const bitB = parseInt(twosComp[i] || "0");
      const cIn = carriesArr[7 - i];
      const s = bitA + bitB + cIn;
      sumArr[i] = s % 2;
      const cOut = Math.floor(s / 2);
      carriesArr[7 - i + 1] = cOut;

      let explanation = "";
      if (bitA === 0 && bitB === 0 && cIn === 0) {
        explanation = t("simulator.arithmetic.subtraction.add0", {
          pos: 7 - i,
        });
      } else if (
        (bitA === 1 && bitB === 0 && cIn === 1) ||
        (bitA === 0 && bitB === 1 && cIn === 1)
      ) {
        explanation = t("simulator.arithmetic.subtraction.add1", {
          pos: 7 - i,
        });
      } else if (bitA === 1 && bitB === 1 && cIn === 0) {
        explanation = t("simulator.arithmetic.subtraction.add2", {
          pos: 7 - i,
        });
      } else if (bitA === 1 && bitB === 1 && cIn === 1) {
        explanation = t("simulator.arithmetic.subtraction.add3", {
          pos: 7 - i,
        });
      } else {
        explanation = t("simulator.arithmetic.subtraction.add4", {
          pos: 7 - i,
          a: bitA,
          b: bitB,
          c: cIn,
          sum: sumArr[i],
          carry: cOut,
        });
      }

      addSteps.unshift({
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
      onesComp,
      twosComp,
      onesSteps,
      twosSteps,
      addSteps,
      sum: sumArr.join(""),
      carries: visCarries,
      overflow,
      carryOut,
    };
  }, [valA, valB, t]);

  return (
    <SimulatorLayout
      inputPanel={
        <>
          <div>
            <h3 className="text-foreground mb-2 flex items-center gap-2 text-lg font-semibold">
              {t("simulator.arithmetic.common.operands8bit")}
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              {t("simulator.arithmetic.subtraction.desc")}
            </p>
          </div>
          <div className="space-y-4">
            {renderModeSelector}
            <BinaryInput
              label={t("simulator.arithmetic.subtraction.minuend")}
              value={valA}
              onChange={handleInputA}
              locked={locked}
            />
            <BinaryInput
              label={t("simulator.arithmetic.subtraction.subtrahend")}
              value={valB}
              onChange={handleInputB}
              locked={locked}
            />
          </div>
        </>
      }
      resultPanel={
        locked ? (
          <ExerciseValidationPanel
            expectedResult={sum}
            onShowSolution={onShowSolution!}
            onExitExercise={onExitExercise}
            inputMode="binary"
            placeholder="z.B. 00100000"
          />
        ) : (
          <div className="space-y-6">
            <ResultSectionHeader
              icon={<Info className="text-primary h-5 w-5" />}
              title={t("simulator.arithmetic.common.stepsResult")}
            />

            <StepByStepToggle
              open={showStepByStep}
              onToggle={() => setShowStepByStep(!showStepByStep)}
            />

            {showStepByStep && (
              <div className="space-y-4">
                {/* Step 1: Ones Complement */}
                <div className="bg-background border-border/40 rounded-lg border p-4 shadow-inner">
                  <p className="text-muted-foreground mb-3 font-sans text-xs font-bold tracking-normal uppercase">
                    {t("simulator.arithmetic.subtraction.step1")}
                  </p>
                  <div className="space-y-2">
                    {onesSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 font-mono text-sm"
                      >
                        <span className="text-muted-foreground w-16 text-xs">
                          {t("simulator.arithmetic.subtraction.bitN", {
                            n: step.position,
                          })}
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded bg-blue-500/10">
                          {step.originalBit}
                        </span>
                        <ArrowRight className="text-muted-foreground h-4 w-4" />
                        <span className="bg-destructive/10 text-destructive flex h-8 w-8 items-center justify-center rounded">
                          {step.flippedBit}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-border/40 mt-3 flex items-center justify-between border-t pt-3">
                    <span className="text-muted-foreground text-sm">
                      {t("simulator.arithmetic.subtraction.onesResult")}
                    </span>
                    <span className="text-destructive font-mono font-bold">
                      {onesComp}
                    </span>
                  </div>
                </div>

                {/* Step 2: Add 1 */}
                <div className="bg-background border-border/40 rounded-lg border p-4 shadow-inner">
                  <p className="text-muted-foreground mb-3 font-sans text-xs font-bold tracking-normal uppercase">
                    {t("simulator.arithmetic.subtraction.step2")}
                  </p>
                  <div className="space-y-2">
                    {twosSteps.map((step, idx) => (
                      <CollapsibleStep
                        key={idx}
                        isOpen={expanded.has(String(idx))}
                        onToggle={() => toggle(String(idx))}
                        header={
                          <div className="flex items-center gap-4 font-mono text-sm">
                            <span className="text-muted-foreground w-16 text-xs">
                              {t("simulator.arithmetic.subtraction.bitN", {
                                n: step.position,
                              })}
                            </span>
                            <span className="bg-destructive/10 text-destructive flex h-6 w-8 items-center justify-center rounded">
                              {step.currentBit}
                            </span>
                            <span className="text-muted-foreground">+1</span>
                            <span className="flex h-6 w-8 items-center justify-center rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                              {step.carryIn}
                            </span>
                            <span className="text-muted-foreground">=</span>
                            <span className="bg-primary/10 text-primary flex h-6 w-8 items-center justify-center rounded font-bold">
                              {step.resultBit}
                            </span>
                            {step.carryOut > 0 && (
                              <>
                                <span className="text-muted-foreground mx-1">
                                  →
                                </span>
                                <span className="bg-destructive/10 text-destructive flex h-6 w-8 items-center justify-center rounded">
                                  {step.carryOut}
                                </span>
                              </>
                            )}
                          </div>
                        }
                      >
                        <p className="text-muted-foreground text-xs">
                          {step.explanation}
                        </p>
                      </CollapsibleStep>
                    ))}
                  </div>
                  <div className="border-border/40 mt-3 flex items-center justify-between border-t pt-3">
                    <span className="text-muted-foreground text-sm">
                      {t("simulator.arithmetic.subtraction.twosResult")}
                    </span>
                    <span className="text-primary font-mono font-bold">
                      {twosComp}
                    </span>
                  </div>
                </div>

                {/* Step 3: Add */}
                <div className="bg-background border-border/40 rounded-lg border p-4 shadow-inner">
                  <p className="text-muted-foreground mb-3 font-sans text-xs font-bold tracking-normal uppercase">
                    {t("simulator.arithmetic.subtraction.step3")}
                  </p>
                  <div className="space-y-2">
                    {addSteps.map((step, idx) => (
                      <CollapsibleStep
                        key={idx}
                        isOpen={expanded.has(String(idx))}
                        onToggle={() => toggle(String(idx))}
                        header={
                          <div className="flex items-center gap-2 font-mono text-sm">
                            <span className="text-muted-foreground w-16 text-xs">
                              {t("simulator.arithmetic.subtraction.bitN", {
                                n: step.position,
                              })}
                            </span>
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
                                <span className="bg-destructive/10 text-destructive flex h-6 w-6 items-center justify-center rounded">
                                  {step.carryOut}
                                </span>
                              </>
                            )}
                          </div>
                        }
                      >
                        <p className="text-muted-foreground text-xs">
                          {step.explanation}
                        </p>
                      </CollapsibleStep>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Original Steps Summary */}
            <div className="bg-background border-border/40 space-y-4 rounded-lg border p-4 font-mono text-sm tracking-widest shadow-inner">
              <div className="space-y-1">
                <p className="text-muted-foreground font-sans text-xs font-bold tracking-normal uppercase">
                  {t("simulator.arithmetic.subtraction.step1")}
                </p>
                <div className="flex gap-4">
                  <span className="opacity-50">{padB}</span>
                  <ArrowRight className="h-4 w-4 opacity-50" />
                  <span className="text-destructive font-semibold">
                    {onesComp}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground mt-2 font-sans text-xs font-bold tracking-normal uppercase">
                  {t("simulator.arithmetic.subtraction.step2")}
                </p>
                <div className="flex gap-4">
                  <span className="text-destructive opacity-50">
                    {onesComp}
                  </span>
                  <span className="text-primary opacity-50">+ 00000001</span>
                  <ArrowRight className="h-4 w-4 opacity-50" />
                  <span className="text-primary font-bold">{twosComp}</span>
                </div>
              </div>
            </div>

            {/* Addition Grid */}
            <p className="text-muted-foreground border-border/50 mt-6 border-b pb-2 font-sans text-xs font-bold tracking-normal uppercase">
              {t("simulator.arithmetic.subtraction.step3")}
            </p>
            <div className="flex justify-center p-4">
              <div className="bg-background border-border/40 rounded-lg border p-6 font-mono text-lg leading-loose font-medium tracking-widest shadow-inner select-none md:text-xl">
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
                <div className="flex gap-2">
                  <span className="w-4 text-center" />
                  <span className="mr-2 w-4 text-center" />
                  {padA.split("").map((b, i) => (
                    <span key={`a-${i}`} className="w-4 text-center">
                      {b}
                    </span>
                  ))}
                </div>
                <div className="border-foreground/30 mb-2 flex gap-2 border-b-2 pb-2">
                  <span className="text-primary mr-2 w-4 text-center">+</span>
                  <span className="w-4 text-center" />
                  {twosComp.split("").map((b, i) => (
                    <span key={`b-${i}`} className="w-4 text-center">
                      {b}
                    </span>
                  ))}
                </div>
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
                <WarningBanner
                  variant="info"
                  title={t("simulator.arithmetic.subtraction.carryOutTitle")}
                >
                  {t("simulator.arithmetic.subtraction.carryOutInfo")}
                </WarningBanner>
              )}
              {overflow && (
                <WarningBanner
                  variant="warning"
                  title={t("simulator.arithmetic.addition.overflowTitle")}
                >
                  {t("simulator.arithmetic.addition.overflowWarning")}
                </WarningBanner>
              )}
            </div>
          </div>
        )
      }
    />
  );
}
