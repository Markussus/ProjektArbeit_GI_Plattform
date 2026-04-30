import { useState, useMemo, type ReactNode } from "react";
import {
  Info,
  LockKeyhole,
  List,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface MultiplicationProps {
  renderModeSelector?: ReactNode;
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialA?: string;
  initialB?: string;
}

interface MultiplicationStep {
  bitIndex: number;
  bitValue: string;
  termStr: string;
  isZero: boolean;
  shiftAmount: number;
  decimalProduct: number;
  explanation: string;
}

export function Multiplication({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
  initialA,
  initialB,
  renderModeSelector}: MultiplicationProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "1101");
  const [valB, setValB] = useState(initialB || "101");
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
            ? t("simulator.arithmetic.multiplication.stepDesc", {
                n: i,
                bit: bit,
                val: valA,
                shift: i,
                result: termStr,
              })
            : t("simulator.arithmetic.multiplication.skipZero", {
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
            {t("simulator.arithmetic.multiplication.desc")}
          </p>
        </div>

        <div className="space-y-4">
          {renderModeSelector}
          <div className={locked ? "opacity-60" : ""}>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              {t("simulator.arithmetic.multiplication.multiplier")}
            </label>
            <input
              type="text"
              value={valA}
              onChange={(e) => handleInputA(e.target.value)}
              readOnly={locked}
              className={`bg-background text-foreground w-full rounded-md border px-3 py-2 font-mono text-sm tracking-widest transition-colors focus:outline-none ${locked ? "bg-muted border-input pointer-events-none" : "border-input focus:border-primary focus-ring-primary/20 focus:ring-1"}`}
            />
          </div>
          <div className={locked ? "opacity-60" : ""}>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              {t("simulator.arithmetic.multiplication.multiplicand")}
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

            {valA && valB ? (
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
                      {t("simulator.arithmetic.multiplication.stepByStepTitle")}
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
                                {t(
                                  "simulator.arithmetic.multiplication.stepN",
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
                                      "simulator.arithmetic.multiplication.skipShort",
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-foreground">
                                    × {valA} &lt;&lt; {step.shiftAmount}
                                  </span>
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
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Summary */}
                    <div className="bg-primary/10 border-primary mt-4 rounded-r-md border-l-4 p-4">
                      <p className="text-foreground text-sm">
                        <strong>
                          {t(
                            "simulator.arithmetic.multiplication.partialProducts",
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

                {/* Original Visual */}
                <div className="flex justify-center overflow-x-auto p-4">
                  <div className="bg-background border-border/40 min-w-fit rounded-lg border p-6 font-mono text-lg leading-loose font-medium tracking-widest shadow-inner select-none">
                    {/* Header: A * B */}
                    <div className="border-foreground/30 mb-2 flex justify-end gap-2 border-b-2 pb-2 whitespace-nowrap">
                      <span>{valA}</span>
                      <span className="text-primary mx-2">×</span>
                      <span>{valB}</span>
                    </div>

                    {/* Steps */}
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

                    {/* Result */}
                    <div className="border-foreground/30 mt-2 flex justify-end gap-2 border-t-2 pt-2">
                      <span className="text-primary font-bold">{finalSum}</span>
                    </div>

                    <div className="text-muted-foreground mt-4 text-right font-sans text-xs tracking-normal">
                      {t("simulator.arithmetic.multiplication.inDecimal")}:{" "}
                      {parseInt(valA, 2)} × {parseInt(valB, 2)} = {finalSumDec}
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
