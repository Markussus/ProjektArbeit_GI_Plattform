import { useState, useMemo } from "react";
import { Search } from "lucide-react";
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
} from "../shared";

interface CompareStep {
  step: number;
  position: number;
  bitA: string;
  bitB: string;
  equal: boolean;
  result: string | null;
  explanation: string;
}

export function Compare({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
  onExitExercise,
  initialA,
  initialB,
  renderModeSelector,
}: BaseArithmeticProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "10110");
  const [valB, setValB] = useState(initialB || "10011");
  const [showStepByStep, setShowStepByStep] = useState(false);
  const { expanded, toggle } = useToggleSet(["0", "1", "2"]);

  const locked = !!isExerciseMode && !showSolution;

  const handleInputA = (val: string) => {
    if (locked) return;
    setValA(val.replace(/[^01]/g, "").slice(0, 16));
  };
  const handleInputB = (val: string) => {
    if (locked) return;
    setValB(val.replace(/[^01]/g, "").slice(0, 16));
  };

  const { padA, padB, diffIndex, result, compareSteps } = useMemo(() => {
    if (!valA || !valB)
      return { padA: "", padB: "", diffIndex: -1, result: "eq", compareSteps: [] };

    const maxLen = Math.max(valA.length, valB.length);
    const pA = valA.padStart(maxLen, "0");
    const pB = valB.padStart(maxLen, "0");

    let dIndex = -1;
    let res = "eq";
    const steps: CompareStep[] = [];

    for (let i = 0; i < maxLen; i++) {
      const bitA = pA[i];
      const bitB = pB[i];
      const equal = bitA === bitB;
      let stepResult: string | null = null;
      let explanation = "";

      if (!equal) {
        dIndex = i;
        res = bitA === "1" ? "greater" : "less";
        if (bitA === "1") {
          explanation = t("simulator.arithmetic.compare.stepResultGreater", { pos: i });
          stepResult = "greater";
        } else {
          explanation = t("simulator.arithmetic.compare.stepResultLess", { pos: i });
          stepResult = "less";
        }
      } else {
        explanation = t("simulator.arithmetic.compare.stepEqual", { pos: i, bit: bitA });
      }

      steps.push({ step: i, position: i, bitA, bitB, equal, result: stepResult, explanation });

      if (!equal) break;
    }

    return { padA: pA, padB: pB, diffIndex: dIndex, result: res, compareSteps: steps };
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
              {t("simulator.arithmetic.compare.desc")}
            </p>
          </div>
          <div className="space-y-4">
            {renderModeSelector}
            <BinaryInput
              label={t("simulator.arithmetic.common.operandA")}
              value={valA}
              onChange={handleInputA}
              locked={locked}
            />
            <BinaryInput
              label={t("simulator.arithmetic.common.operandB")}
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
            expectedResult={result === "eq" ? "=" : result === "greater" ? ">" : "<"}
            onShowSolution={onShowSolution!}
            onExitExercise={onExitExercise}
            inputMode="compare"
            placeholder="z.B. > oder < oder ="
          />
        ) : (
          <div className="space-y-6">
            <ResultSectionHeader
              icon={<Search className="text-primary h-5 w-5" />}
              title={t("simulator.arithmetic.compare.visualCompare")}
            />

            {valA && valB ? (
              <div className="space-y-6">
                <StepByStepToggle
                  open={showStepByStep}
                  onToggle={() => setShowStepByStep(!showStepByStep)}
                  className="mb-0"
                />

                {showStepByStep && compareSteps.length > 0 && (
                  <div className="space-y-3">
                    {/* Padding Step */}
                    <div className="bg-background border-border/40 rounded-lg border p-4">
                      <div className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                        {t("simulator.arithmetic.compare.stepPadding")}
                      </div>
                      <p className="text-muted-foreground mb-3 text-sm">
                        {t("simulator.arithmetic.compare.padDesc")}
                      </p>
                      <div className="flex gap-6 font-mono text-sm">
                        <div>
                          <span className="text-muted-foreground">A:</span>{" "}
                          <span className="text-foreground">{valA}</span>
                          <span className="text-muted-foreground ml-2">→</span>
                          <span className="text-primary ml-2 font-bold">{padA}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">B:</span>{" "}
                          <span className="text-foreground">{valB}</span>
                          <span className="text-muted-foreground ml-2">→</span>
                          <span className="text-primary ml-2 font-bold">{padB}</span>
                        </div>
                      </div>
                      {valA.length !== padA.length && (
                        <p className="text-muted-foreground mt-2 text-xs">
                          {t("simulator.arithmetic.compare.paddingNote", {
                            count: padA.length - valA.length,
                          })}
                        </p>
                      )}
                    </div>

                    {/* Bit Comparison Steps */}
                    <div className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                      {t("simulator.arithmetic.compare.bitComparisonTitle")}
                    </div>

                    <div className="space-y-2">
                      {compareSteps.map((step, idx) => (
                        <CollapsibleStep
                          key={idx}
                          isOpen={expanded.has(String(idx))}
                          onToggle={() => toggle(String(idx))}
                          header={
                            <>
                              <span className="text-muted-foreground w-20 text-xs font-bold">
                                {t("simulator.arithmetic.compare.posN", { n: step.position })}
                              </span>
                              <div className="flex items-center gap-2 font-mono text-sm">
                                <span className="flex h-8 w-8 items-center justify-center rounded bg-blue-500/10">{step.bitA}</span>
                                <span className="text-muted-foreground">
                                  {step.equal ? "=" : step.result === "greater" ? ">" : "<"}
                                </span>
                                <span className="flex h-8 w-8 items-center justify-center rounded bg-green-500/10">{step.bitB}</span>
                                {step.result && (
                                  <span
                                    className={`ml-2 rounded px-2 py-1 text-xs ${
                                      step.result === "greater"
                                        ? "bg-primary/10 text-primary"
                                        : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                    }`}
                                  >
                                    {step.result === "greater"
                                      ? t("simulator.arithmetic.compare.AgreaterB")
                                      : t("simulator.arithmetic.compare.AlessB")}
                                  </span>
                                )}
                              </div>
                            </>
                          }
                        >
                          <p className="text-foreground text-sm">{step.explanation}</p>
                          {step.result && (
                            <p className="text-muted-foreground border-border/40 mt-2 border-t pt-2 text-sm">
                              {t("simulator.arithmetic.compare.finalResultNote")}
                            </p>
                          )}
                        </CollapsibleStep>
                      ))}
                    </div>

                    {/* Summary */}
                    <div className="bg-primary/10 border-primary rounded-r-md border-l-4 p-4">
                      <p className="text-foreground text-sm font-semibold">
                        {result === "eq"
                          ? t("simulator.arithmetic.compare.resultEq")
                          : result === "greater"
                            ? t("simulator.arithmetic.compare.resultGreater")
                            : t("simulator.arithmetic.compare.resultLess")}
                      </p>
                    </div>
                  </div>
                )}

                {!showStepByStep && (
                  <>
                    <p className="text-muted-foreground bg-background border-border/50 rounded border p-3 text-sm">
                      {t("simulator.arithmetic.compare.pad")}
                    </p>

                    <div className="flex justify-center p-4">
                      <div className="bg-background border-border/40 flex min-w-fit flex-col items-center overflow-x-auto rounded-lg border p-6 font-mono text-xl leading-loose font-medium tracking-widest shadow-inner select-none md:text-2xl">
                        <div className="flex gap-2">
                          <span className="text-muted-foreground my-auto mr-4 w-8 text-right font-sans text-sm tracking-normal uppercase">A</span>
                          {padA.split("").map((bit, i) => (
                            <span
                              key={`a-${i}`}
                              className={`w-6 text-center ${i === diffIndex ? "text-primary border-primary rounded border-2 font-bold" : "opacity-80"}`}
                            >
                              {bit}
                            </span>
                          ))}
                        </div>
                        <div className="my-2 flex gap-2">
                          <span className="mr-4 w-8" />
                          {padA.split("").map((_, i) => (
                            <span
                              key={`op-${i}`}
                              className={`flex w-6 items-center justify-center text-sm ${
                                i === diffIndex
                                  ? "text-primary"
                                  : diffIndex !== -1 && i > diffIndex
                                    ? "opacity-0"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {i === diffIndex ? (result === "greater" ? ">" : "<") : "="}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <span className="text-muted-foreground my-auto mr-4 w-8 text-right font-sans text-sm tracking-normal uppercase">B</span>
                          {padB.split("").map((bit, i) => (
                            <span
                              key={`b-${i}`}
                              className={`w-6 text-center ${i === diffIndex ? "text-primary border-primary rounded border-2 font-bold" : "opacity-80"}`}
                            >
                              {bit}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-primary/10 border-primary w-full rounded-r-md border-l-4 p-4">
                      <p className="text-foreground text-sm font-semibold">
                        {result === "eq"
                          ? t("simulator.arithmetic.compare.resultEq")
                          : result === "greater"
                            ? t("simulator.arithmetic.compare.resultGreater")
                            : t("simulator.arithmetic.compare.resultLess")}
                      </p>
                    </div>
                  </>
                )}
              </div>
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
