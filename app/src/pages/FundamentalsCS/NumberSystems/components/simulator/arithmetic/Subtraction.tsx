import { useMemo } from "react";
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
} from "@/components/shared/SimulatorShared";
import { useBinaryOperands } from "./useBinaryOperands";
import { addBinary8Bit } from "./binaryArithmetic";

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
  const {
    valA,
    valB,
    locked,
    handleInputA,
    handleInputB,
    showStepByStep,
    setShowStepByStep,
    expanded,
    toggle,
  } = useBinaryOperands({
    defaultA: "00101010",
    defaultB: "00001010",
    maxLengthA: 8,
    maxLengthB: 8,
    initialA,
    initialB,
    isExerciseMode,
    showSolution,
    onChangeValues,
  });

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
        explanation: t(
          "number-systems.simulator.arithmetic.subtraction.flipBitDesc",
          {
            pos: 7 - i,
            orig: bit,
            flipped: bit === "1" ? "0" : "1",
          },
        ),
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
        explanation: t(
          "number-systems.simulator.arithmetic.subtraction.addOneDesc",
          {
            pos: 7 - i,
            bit: bit,
            carry: c === 0 ? 1 : 0,
            sum: s,
            result: resultBit,
            nextCarry: c,
          },
        ),
      });
    }

    const additionResult = addBinary8Bit(padA, twosComp, (step) => {
      if (step.bitA === 0 && step.bitB === 0 && step.carryIn === 0) {
        return t("number-systems.simulator.arithmetic.subtraction.add0", {
          pos: step.position,
        });
      }
      if (
        (step.bitA === 1 && step.bitB === 0 && step.carryIn === 1) ||
        (step.bitA === 0 && step.bitB === 1 && step.carryIn === 1)
      ) {
        return t("number-systems.simulator.arithmetic.subtraction.add1", {
          pos: step.position,
        });
      }
      if (step.bitA === 1 && step.bitB === 1 && step.carryIn === 0) {
        return t("number-systems.simulator.arithmetic.subtraction.add2", {
          pos: step.position,
        });
      }
      if (step.bitA === 1 && step.bitB === 1 && step.carryIn === 1) {
        return t("number-systems.simulator.arithmetic.subtraction.add3", {
          pos: step.position,
        });
      }
      return t("number-systems.simulator.arithmetic.subtraction.add4", {
        pos: step.position,
        a: step.bitA,
        b: step.bitB,
        c: step.carryIn,
        sum: step.sum,
        carry: step.carryOut,
      });
    });

    const addSteps = additionResult.bitSteps.map((step) => ({
      ...step,
      explanation: step.explanation ?? "",
    }));

    return {
      padA,
      padB,
      onesComp,
      twosComp,
      onesSteps,
      twosSteps,
      addSteps,
      sum: additionResult.sum,
      carries: additionResult.carries,
      overflow: additionResult.overflow,
      carryOut: additionResult.carryOut,
    };
  }, [valA, valB, t]);

  return (
    <SimulatorLayout
      inputPanel={
        <>
          <div>
            <h3 className="text-foreground mb-2 flex items-center gap-2 text-lg font-semibold">
              {t("number-systems.simulator.arithmetic.common.operands8bit")}
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              {t("number-systems.simulator.arithmetic.subtraction.desc")}
            </p>
          </div>
          <div className="space-y-4">
            {renderModeSelector}
            <BinaryInput
              label={t(
                "number-systems.simulator.arithmetic.subtraction.minuend",
              )}
              value={valA}
              onChange={handleInputA}
              locked={locked}
            />
            <BinaryInput
              label={t(
                "number-systems.simulator.arithmetic.subtraction.subtrahend",
              )}
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
              title={t(
                "number-systems.simulator.arithmetic.common.stepsResult",
              )}
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
                    {t("number-systems.simulator.arithmetic.subtraction.step1")}
                  </p>
                  <div className="space-y-2">
                    {onesSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 font-mono text-sm"
                      >
                        <span className="text-muted-foreground w-16 text-xs">
                          {t(
                            "number-systems.simulator.arithmetic.subtraction.bitN",
                            {
                              n: step.position,
                            },
                          )}
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
                      {t(
                        "number-systems.simulator.arithmetic.subtraction.onesResult",
                      )}
                    </span>
                    <span className="text-destructive font-mono font-bold">
                      {onesComp}
                    </span>
                  </div>
                </div>

                {/* Step 2: Add 1 */}
                <div className="bg-background border-border/40 rounded-lg border p-4 shadow-inner">
                  <p className="text-muted-foreground mb-3 font-sans text-xs font-bold tracking-normal uppercase">
                    {t("number-systems.simulator.arithmetic.subtraction.step2")}
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
                              {t(
                                "number-systems.simulator.arithmetic.subtraction.bitN",
                                {
                                  n: step.position,
                                },
                              )}
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
                      {t(
                        "number-systems.simulator.arithmetic.subtraction.twosResult",
                      )}
                    </span>
                    <span className="text-primary font-mono font-bold">
                      {twosComp}
                    </span>
                  </div>
                </div>

                {/* Step 3: Add */}
                <div className="bg-background border-border/40 rounded-lg border p-4 shadow-inner">
                  <p className="text-muted-foreground mb-3 font-sans text-xs font-bold tracking-normal uppercase">
                    {t("number-systems.simulator.arithmetic.subtraction.step3")}
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
                              {t(
                                "number-systems.simulator.arithmetic.subtraction.bitN",
                                {
                                  n: step.position,
                                },
                              )}
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
                  {t("number-systems.simulator.arithmetic.subtraction.step1")}
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
                  {t("number-systems.simulator.arithmetic.subtraction.step2")}
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
              {t("number-systems.simulator.arithmetic.subtraction.step3")}
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
                  title={t(
                    "number-systems.simulator.arithmetic.subtraction.carryOutTitle",
                  )}
                >
                  {t(
                    "number-systems.simulator.arithmetic.subtraction.carryOutInfo",
                  )}
                </WarningBanner>
              )}
              {overflow && (
                <WarningBanner
                  variant="warning"
                  title={t(
                    "number-systems.simulator.arithmetic.addition.overflowTitle",
                  )}
                >
                  {t(
                    "number-systems.simulator.arithmetic.addition.overflowWarning",
                  )}
                </WarningBanner>
              )}
            </div>
          </div>
        )
      }
    />
  );
}
