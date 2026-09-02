import { useMemo } from "react";
import { Info } from "lucide-react";
import { ExerciseValidationPanel } from "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel";
import type { BaseArithmeticProps } from "./types";
import {
  SimulatorLayout,
  StepByStepToggle,
  CollapsibleStep,
  ResultSectionHeader,
} from "@/components/shared/SimulatorShared";
import { ArithmeticInputPanel } from "./ArithmeticInputPanel";
import {
  useArithmeticExercise,
  type ArithmeticExerciseState,
} from "./useArithmeticExercise";

interface MultiplicationStep {
  bitIndex: number;
  bitValue: string;
  termStr: string;
  isZero: boolean;
  shiftAmount: number;
  decimalProduct: number;
  explanation: string;
}

export function Multiplication(props: BaseArithmeticProps) {
  const state = useArithmeticExercise(props, {
    defaultA: "1101",
    defaultB: "101",
    maxLengthA: 8,
    maxLengthB: 8,
  });
  const {
    t,
    valA,
    valB,
    locked,
    handleInputA,
    handleInputB,
    showStepByStep,
    setShowStepByStep,
    expanded,
    toggle,
    onShowSolution,
    onExitExercise,
    renderModeSelector,
  } = state satisfies ArithmeticExerciseState;

  const { steps, finalSum, finalSumDec, partialSums } = useMemo(() => {
    if (!valA || !valB)
      return { steps: [], finalSum: "", finalSumDec: "", partialSums: [] };

    const stepsArr: MultiplicationStep[] = [];
    let sum = 0n;
    const partialSumsArr: string[] = [];

    const reversedB = valB.split("").reverse().join("");

    for (let i = 0; i < reversedB.length; i++) {
      const bit = reversedB[i];
      let termStr = "";
      let termVal = 0n;

      if (bit === "1") {
        termStr = valA + "0".repeat(i);
        termVal = BigInt("0b" + termStr);
        sum += termVal;
        partialSumsArr.push(termStr);
      } else {
        termStr = "0".repeat(valA.length + i);
        partialSumsArr.push(termStr);
      }

      stepsArr.push({
        bitIndex: i,
        bitValue: bit,
        termStr,
        isZero: bit === "0",
        shiftAmount: i,
        decimalProduct: bit === "1" ? parseInt(valA, 2) * Math.pow(2, i) : 0,
        explanation:
          bit === "1"
            ? t("number-systems.simulator.arithmetic.multiplication.stepDesc", {
                n: i,
                bit: bit,
                val: valA,
                shift: i,
                result: termStr,
              })
            : t("number-systems.simulator.arithmetic.multiplication.skipZero", {
                n: i,
                bit: bit,
              }),
      });
    }

    return {
      steps: stepsArr.reverse(),
      finalSum: sum.toString(2),
      finalSumDec: sum.toString(10),
      partialSums: partialSumsArr.reverse(),
    };
  }, [valA, valB, t]);

  return (
    <SimulatorLayout
      inputPanel={
        <ArithmeticInputPanel
          titleKey="number-systems.simulator.arithmetic.common.operands"
          descKey="number-systems.simulator.arithmetic.multiplication.desc"
          renderModeSelector={renderModeSelector}
          locked={locked}
          operandA={{
            value: valA,
            onChange: handleInputA,
            labelKey:
              "number-systems.simulator.arithmetic.multiplication.multiplier",
          }}
          operandB={{
            value: valB,
            onChange: handleInputB,
            labelKey:
              "number-systems.simulator.arithmetic.multiplication.multiplicand",
          }}
        />
      }
      resultPanel={
        locked ? (
          <ExerciseValidationPanel
            expectedResult={finalSum}
            onShowSolution={onShowSolution!}
            onExitExercise={onExitExercise}
            inputMode="binary"
            placeholder="z.B. 1000001"
          />
        ) : (
          <div className="space-y-6">
            <ResultSectionHeader
              icon={<Info className="text-primary h-5 w-5" />}
              title={t(
                "number-systems.simulator.arithmetic.common.stepsResult",
              )}
            />

            {valA && valB ? (
              <>
                <StepByStepToggle
                  open={showStepByStep}
                  onToggle={() => setShowStepByStep(!showStepByStep)}
                />

                {showStepByStep && steps.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <div className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                      {t(
                        "number-systems.simulator.arithmetic.multiplication.stepByStepTitle",
                      )}
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
                                {t(
                                  "number-systems.simulator.arithmetic.multiplication.stepN",
                                  { n: step.bitIndex },
                                )}
                              </span>
                              <div className="flex items-center gap-2 font-mono text-sm">
                                <span
                                  className={`flex h-6 w-6 items-center justify-center rounded ${step.isZero ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}
                                >
                                  {step.bitValue}
                                </span>
                                {step.isZero ? (
                                  <span className="text-muted-foreground">
                                    {t(
                                      "number-systems.simulator.arithmetic.multiplication.skipShort",
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-foreground">
                                    × {valA} &lt;&lt; {step.shiftAmount}
                                  </span>
                                )}
                              </div>
                            </>
                          }
                        >
                          <p className="text-foreground text-sm">
                            {step.explanation}
                          </p>
                          {!step.isZero && (
                            <div className="bg-primary/5 border-primary/20 mt-2 rounded border p-2 font-mono text-sm">
                              <span className="text-muted-foreground">
                                = {step.termStr}
                              </span>
                              <span className="text-muted-foreground mx-2">
                                ({step.decimalProduct} in Dezimal)
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
                          {t(
                            "number-systems.simulator.arithmetic.multiplication.partialProducts",
                          )}
                          :
                        </strong>
                      </p>
                      <p className="text-muted-foreground mt-1 font-mono text-sm">
                        {partialSums.join(" + ") || "0"} = {finalSum}
                      </p>
                    </div>
                  </div>
                )}

                {/* Visual Grid */}
                <div className="flex justify-center overflow-x-auto p-4">
                  <div className="bg-background border-border/40 min-w-fit rounded-lg border p-6 font-mono text-lg leading-loose font-medium tracking-widest shadow-inner select-none">
                    <div className="border-foreground/30 mb-2 flex justify-end gap-2 border-b-2 pb-2 whitespace-nowrap">
                      <span>{valA}</span>
                      <span className="text-primary mx-2">×</span>
                      <span>{valB}</span>
                    </div>
                    <div className="flex w-full flex-col items-end">
                      {steps.map((step, idx) => (
                        <div
                          key={idx}
                          className={`flex w-full items-center justify-end gap-4 ${step.isZero ? "opacity-30" : "opacity-100"}`}
                        >
                          {idx < steps.length - 1 && (
                            <span className="opacity-0">+</span>
                          )}
                          {idx === steps.length - 1 && (
                            <span className="text-primary">+</span>
                          )}
                          <span className="text-right">{step.termStr}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-foreground/30 mt-2 flex justify-end gap-2 border-t-2 pt-2">
                      <span className="text-primary font-bold">{finalSum}</span>
                    </div>
                    <div className="text-muted-foreground mt-4 text-right font-sans text-xs tracking-normal">
                      {t(
                        "number-systems.simulator.arithmetic.multiplication.inDecimal",
                      )}
                      : {parseInt(valA, 2)} × {parseInt(valB, 2)} ={" "}
                      {finalSumDec}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {t(
                  "number-systems.simulator.arithmetic.common.enterValidOperands",
                )}
              </p>
            )}
          </div>
        )
      }
    />
  );
}
