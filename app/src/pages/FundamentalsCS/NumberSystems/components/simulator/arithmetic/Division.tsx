import { useState, useMemo, useEffect } from "react";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExerciseValidationPanel } from "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel";
import type { BaseArithmeticProps } from "./types";
import {
  SimulatorLayout,
  BinaryInput,
  StepByStepToggle,
  CollapsibleStep,
  ResultSectionHeader,
  useToggleSet,
} from "@/components/shared/SimulatorShared";

interface DivisionStep {
  step: number;
  droppedBitIndex: number;
  currentStr: string;
  subtracted: string;
  isOne: boolean;
  quotientBit: string;
  remainderAfter: string;
  explanation: string;
}

export function Division({
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
  const [valA, setValA] = useState(initialA || "11010");
  const [valB, setValB] = useState(initialB || "101");
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
    setValA(val.replace(/[^01]/g, "").slice(0, 12));
  };
  const handleInputB = (val: string) => {
    if (locked) return;
    setValB(val.replace(/[^01]/g, "").slice(0, 8));
  };

  const { steps, quotient, remainder, isZeroDiv } = useMemo(() => {
    if (!valA || !valB)
      return { steps: [], quotient: "", remainder: "", isZeroDiv: false };

    if (BigInt("0b" + valB || "0") === 0n)
      return { steps: [], quotient: "", remainder: "", isZeroDiv: true };

    const divisor = BigInt("0b" + valB);
    let currentStr = "";
    let qStr = "";
    const stepsArr: DivisionStep[] = [];

    for (let i = 0; i < valA.length; i++) {
      currentStr += valA[i];
      const currentVal = BigInt("0b" + currentStr);
      let remainderAfter = "";

      if (currentVal >= divisor) {
        remainderAfter = (currentVal - divisor).toString(2);
        stepsArr.push({
          step: i,
          droppedBitIndex: i,
          currentStr: currentStr.replace(/^0+/, "") || "0",
          subtracted: valB,
          isOne: true,
          quotientBit: "1",
          remainderAfter,
          explanation: t("simulator.arithmetic.division.stepDesc", {
            n: i + 1,
            current: currentStr.replace(/^0+/, "") || "0",
            divisor: valB,
          }),
        });
        qStr += "1";
        currentStr = remainderAfter;
      } else {
        stepsArr.push({
          step: i,
          droppedBitIndex: i,
          currentStr: currentStr.replace(/^0+/, "") || "0",
          subtracted: "0",
          isOne: false,
          quotientBit: "0",
          remainderAfter: currentStr,
          explanation: t("simulator.arithmetic.division.stepDescSmall", {
            n: i + 1,
            current: currentStr.replace(/^0+/, "") || "0",
            divisor: valB,
          }),
        });
        qStr += "0";
      }
    }

    return {
      steps: stepsArr,
      quotient: qStr.replace(/^0+/, "") || "0",
      remainder: currentStr.replace(/^0+/, "") || "0",
      isZeroDiv: false,
    };
  }, [valA, valB, t]);

  return (
    <SimulatorLayout
      inputPanel={
        <>
          <div>
            <h3 className="text-foreground mb-2 flex items-center gap-2 text-lg font-semibold">
              {t("simulator.arithmetic.common.operands")}
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              {t("simulator.arithmetic.division.desc")}
            </p>
          </div>
          <div className="space-y-4">
            {renderModeSelector}
            <BinaryInput
              label={t("simulator.arithmetic.division.dividend")}
              value={valA}
              onChange={handleInputA}
              locked={locked}
            />
            <BinaryInput
              label={t("simulator.arithmetic.division.divisor")}
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
            expectedResult={
              remainder === "0"
                ? quotient
                : [
                    quotient,
                    `${quotient}R${remainder}`,
                    `${quotient}Rest${remainder}`,
                  ]
            }
            onShowSolution={onShowSolution!}
            onExitExercise={onExitExercise}
            placeholder={remainder === "0" ? "z.B. 10" : "z.B. 10 Rest 1"}
          />
        ) : (
          <div className="space-y-6">
            <ResultSectionHeader
              icon={<Info className="text-primary h-5 w-5" />}
              title={t("simulator.arithmetic.common.stepsResult")}
            />

            {isZeroDiv ? (
              <p className="text-destructive py-4 text-sm font-semibold">
                {t("simulator.arithmetic.division.divByZero")}
              </p>
            ) : valA && valB ? (
              <>
                <StepByStepToggle
                  open={showStepByStep}
                  onToggle={() => setShowStepByStep(!showStepByStep)}
                />

                {showStepByStep && steps.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <div className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                      {t("simulator.arithmetic.division.stepByStepTitle")}
                    </div>

                    <div className="space-y-2">
                      {steps.map((step, idx) => (
                        <CollapsibleStep
                          key={idx}
                          isOpen={expanded.has(String(idx))}
                          onToggle={() => toggle(String(idx))}
                          header={
                            <>
                              <span className="text-muted-foreground w-16 text-xs font-bold">
                                {t("simulator.arithmetic.division.stepN", {
                                  n: step.step + 1,
                                })}
                              </span>
                              <div className="flex items-center gap-2 font-mono text-sm">
                                <span
                                  className={`flex h-6 w-6 items-center justify-center rounded ${step.isOne ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                                >
                                  {step.quotientBit}
                                </span>
                                <span className="text-muted-foreground">
                                  {step.isOne
                                    ? t(
                                        "simulator.arithmetic.division.appendOneShort",
                                      )
                                    : t(
                                        "simulator.arithmetic.division.appendZeroShort",
                                      )}
                                </span>
                              </div>
                            </>
                          }
                        >
                          <p className="text-foreground text-sm">
                            {step.explanation}
                          </p>
                          {step.isOne && (
                            <div className="bg-destructive/5 border-destructive/20 mt-2 rounded border p-2 font-mono text-sm">
                              <span className="text-muted-foreground">
                                {step.currentStr}
                              </span>
                              <span className="text-muted-foreground mx-2">
                                -
                              </span>
                              <span className="text-destructive">
                                {step.subtracted}
                              </span>
                              <span className="text-muted-foreground mx-2">
                                =
                              </span>
                              <span className="text-primary font-bold">
                                {step.remainderAfter}
                              </span>
                            </div>
                          )}
                        </CollapsibleStep>
                      ))}
                    </div>

                    {/* Summary */}
                    <div className="bg-primary/10 border-primary mt-4 rounded-r-md border-l-4 p-4">
                      <p className="text-foreground text-sm">
                        <strong>
                          {t("simulator.arithmetic.division.quotient")}:
                        </strong>{" "}
                        {quotient}
                      </p>
                      <p className="text-foreground mt-1 text-sm">
                        <strong>
                          {t("simulator.arithmetic.division.remainder")}:
                        </strong>{" "}
                        {remainder}
                      </p>
                    </div>
                  </div>
                )}

                {/* Visual */}
                <div className="flex justify-center overflow-x-auto p-4">
                  <div className="bg-background border-border/40 min-w-fit rounded-lg border p-6 font-mono text-lg leading-loose font-medium tracking-widest shadow-inner select-none">
                    <div className="border-foreground/30 mb-4 flex justify-start gap-2 border-b-2 pb-2 whitespace-nowrap">
                      <span>{valA}</span>
                      <span className="text-primary mx-2">:</span>
                      <span>{valB}</span>
                      <span className="text-primary mx-2">=</span>
                      <span className="text-primary font-bold">{quotient}</span>
                    </div>
                    <div className="flex w-full flex-col items-start space-y-1 whitespace-nowrap">
                      {steps.map((step, idx) => (
                        <div key={idx} className="flex w-full gap-4">
                          <div className="border-muted/50 flex flex-col items-end border-l-2 pl-2">
                            <span className="text-foreground">
                              {step.currentStr}
                            </span>
                            <span
                              className={`${step.isOne ? "text-destructive" : "text-muted-foreground opacity-50"}`}
                            >
                              - {step.subtracted}
                            </span>
                          </div>
                          <div className="text-muted-foreground flex h-full items-center pt-4 text-sm">
                            {step.isOne
                              ? t(
                                  "simulator.arithmetic.division.appendOneShort",
                                )
                              : t(
                                  "simulator.arithmetic.division.appendZeroShort",
                                )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-foreground/30 mt-6 flex justify-start gap-2 border-t-2 pt-4">
                      <span className="text-muted-foreground">
                        {t("simulator.arithmetic.division.remainder")}
                      </span>
                      <span className="font-bold">{remainder}</span>
                    </div>
                    <div className="text-muted-foreground mt-4 text-left font-sans text-xs tracking-normal">
                      {t("simulator.arithmetic.division.inDecimal")}:{" "}
                      {parseInt(valA, 2)} : {parseInt(valB, 2)} ={" "}
                      {parseInt(quotient, 2)} Rest {parseInt(remainder, 2)}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {t("simulator.arithmetic.common.enterValidOperands")}
              </p>
            )}
          </div>
        )
      }
    />
  );
}
