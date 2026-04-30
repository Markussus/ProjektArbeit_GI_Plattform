import { useState, useMemo, type ReactNode } from "react";
import { Info, List, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExerciseValidationPanel } from "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel";

interface DivisionProps {
  renderModeSelector?: ReactNode;
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialA?: string;
  initialB?: string;
}

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
  initialA,
  initialB,
  renderModeSelector,
}: DivisionProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "11010");
  const [valB, setValB] = useState(initialB || "101");
  const [showStepByStep, setShowStepByStep] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(
    new Set(["0", "1", "2"]),
  );

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
          remainderAfter: remainderAfter,
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
            {t("simulator.arithmetic.common.operands")}
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">
            {t("simulator.arithmetic.division.desc")}
          </p>
        </div>

        <div className="space-y-4">
          {renderModeSelector}
          <div className={locked ? "opacity-60" : ""}>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              {t("simulator.arithmetic.division.dividend")}
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
              {t("simulator.arithmetic.division.divisor")}
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
            placeholder={remainder === "0" ? "z.B. 10" : "z.B. 10 Rest 1"}
          />
        ) : (
          <div className="space-y-6">
            <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
              <Info className="text-primary h-5 w-5" />
              {t("simulator.arithmetic.common.stepsResult")}
            </h3>

            {isZeroDiv ? (
              <p className="text-destructive py-4 text-sm font-semibold">
                {t("simulator.arithmetic.division.divByZero")}
              </p>
            ) : valA && valB ? (
              <>
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

                {showStepByStep && steps.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <div className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                      {t("simulator.arithmetic.division.stepByStepTitle")}
                    </div>

                    {/* Collapsible Steps */}
                    <div className="space-y-2">
                      {steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="border-border/40 overflow-hidden rounded-lg border"
                        >
                          <button
                            onClick={() => toggleStep(idx)}
                            className="bg-background hover:bg-muted/50 flex w-full items-center justify-between p-3 transition-colors"
                          >
                            <div className="flex items-center gap-4">
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
                            </div>
                          )}
                        </div>
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

                {/* Original Visual */}
                <div className="flex justify-center overflow-x-auto p-4">
                  <div className="bg-background border-border/40 min-w-fit rounded-lg border p-6 font-mono text-lg leading-loose font-medium tracking-widest shadow-inner select-none">
                    {/* Header */}
                    <div className="border-foreground/30 mb-4 flex justify-start gap-2 border-b-2 pb-2 whitespace-nowrap">
                      <span>{valA}</span>
                      <span className="text-primary mx-2">:</span>
                      <span>{valB}</span>
                      <span className="text-primary mx-2">=</span>
                      <span className="text-primary font-bold">{quotient}</span>
                    </div>

                    {/* Steps visualized */}
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

                    {/* Result */}
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
        )}
      </div>
    </div>
  );
}
