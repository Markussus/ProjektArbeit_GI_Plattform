import { useMemo } from "react";
import { Info } from "lucide-react";
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
import { addBinary8Bit, getStepExplanation } from "./binaryArithmetic";

export function Addition({
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
    defaultA: "01100101",
    defaultB: "00111100",
    maxLengthA: 8,
    maxLengthB: 8,
    initialA,
    initialB,
    isExerciseMode,
    showSolution,
    onChangeValues,
  });

  const { padA, padB, sum, carries, overflow, carryOut, bitSteps } = useMemo(
    () => addBinary8Bit(valA, valB, (step) => getStepExplanation(step, t)),
    [valA, valB, t],
  );

  return (
    <SimulatorLayout
      inputPanel={
        <>
          <div>
            <h3 className="text-foreground mb-2 flex items-center gap-2 text-lg font-semibold">
              {t("number-systems.simulator.arithmetic.common.operands8bit")}
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              {t("number-systems.simulator.arithmetic.addition.desc")}
            </p>
          </div>
          <div className="space-y-4">
            {renderModeSelector}
            <BinaryInput
              label={t("number-systems.simulator.arithmetic.common.operandA")}
              value={valA}
              onChange={handleInputA}
              locked={locked}
            />
            <BinaryInput
              label={t("number-systems.simulator.arithmetic.common.operandB")}
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
            placeholder="z.B. 10100011"
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
              <div className="space-y-3">
                <div className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                  {t(
                    "number-systems.simulator.arithmetic.addition.stepByStepTitle",
                  )}
                </div>

                {/* Bit Position Legend */}
                <div className="mb-4 flex justify-center">
                  <div className="text-muted-foreground bg-background border-border/40 flex gap-2 rounded border p-2 font-mono text-xs">
                    <div className="flex items-center gap-1">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/10">
                        A
                      </span>
                      <span>
                        {t(
                          "number-systems.simulator.arithmetic.addition.legendA",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-green-500/10">
                        B
                      </span>
                      <span>
                        {t(
                          "number-systems.simulator.arithmetic.addition.legendB",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-yellow-500/10">
                        C
                      </span>
                      <span>
                        {t(
                          "number-systems.simulator.arithmetic.addition.legendC",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded">
                        S
                      </span>
                      <span>
                        {t(
                          "number-systems.simulator.arithmetic.addition.legendS",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="bg-destructive/10 text-destructive flex h-6 w-6 items-center justify-center rounded">
                        →
                      </span>
                      <span>
                        {t(
                          "number-systems.simulator.arithmetic.addition.legendOut",
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Collapsible Steps */}
                <div className="space-y-2">
                  {bitSteps.map((step, idx) => (
                    <CollapsibleStep
                      key={idx}
                      isOpen={expanded.has(String(idx))}
                      onToggle={() => toggle(String(idx))}
                      header={
                        <>
                          <span className="text-muted-foreground text-xs font-bold">
                            {t(
                              "number-systems.simulator.arithmetic.addition.bitPos",
                              {
                                pos: step.position,
                              },
                            )}
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
                        </>
                      }
                    >
                      <p className="text-foreground text-sm">
                        {step.explanation}
                      </p>
                    </CollapsibleStep>
                  ))}
                </div>

                <div className="border-border/50 mt-4 border-t pt-4">
                  <p className="text-muted-foreground text-sm">
                    {t(
                      "number-systems.simulator.arithmetic.addition.finalResult",
                    )}
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
                <WarningBanner
                  variant="destructive"
                  title={t(
                    "number-systems.simulator.arithmetic.subtraction.carryOutTitle",
                  )}
                >
                  {t(
                    "number-systems.simulator.arithmetic.addition.carryOutWarning",
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
