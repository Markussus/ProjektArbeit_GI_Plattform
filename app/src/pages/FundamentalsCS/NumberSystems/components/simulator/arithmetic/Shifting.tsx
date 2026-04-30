import { useState, useMemo, type ReactNode } from "react";
import {
  Info,
  ChevronsLeft,
  ChevronsRight,
  List,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExerciseValidationPanel } from "@/components/shared/ExerciseValidationPanel/ExerciseValidationPanel";

interface ShiftingProps {
  renderModeSelector?: ReactNode;
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialA?: string;
}

interface ShiftStep {
  step: number;
  binary: string;
  description: string;
  highlightedBit: number | null;
  newBit: string | null;
}

export function Shifting({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
  initialA,
  renderModeSelector}: ShiftingProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "1101");
  const [shiftAmount, setShiftAmount] = useState<number>(2);
  const [direction, setDirection] = useState<"left" | "right">("left");
  const [showStepByStep, setShowStepByStep] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(
    new Set(["0", "1", "2"]),
  );

  const locked = !!isExerciseMode && !showSolution;

  const handleInputA = (val: string) => {
    if (locked) return;
    setValA(val.replace(/[^01]/g, "").slice(0, 16));
  };

  const { resultStr, decimalBefore, decimalAfter, explanation, shiftSteps } =
    useMemo(() => {
      if (!valA)
        return {
          resultStr: "",
          decimalBefore: 0,
          decimalAfter: 0,
          explanation: "",
          shiftSteps: [],
        };

      const beforeDec = parseInt(valA, 2);
      let afterDec = 0;
      let resStr = "";
      let expl = "";
      const steps: ShiftStep[] = [];

      if (direction === "left") {
        resStr = valA + "0".repeat(shiftAmount);
        afterDec = beforeDec * Math.pow(2, shiftAmount);
        expl = t("simulator.arithmetic.shifting.shiftLeftExpl");

        steps.push({
          step: 0,
          binary: valA,
          description: t("simulator.arithmetic.shifting.stepOriginal", {
            val: valA,
          }),
          highlightedBit: null,
          newBit: null,
        });

        for (let i = 0; i < Math.min(shiftAmount, 4); i++) {
          const currentResult = valA + "0".repeat(i + 1);
          steps.push({
            step: i + 1,
            binary: currentResult,
            description: t("simulator.arithmetic.shifting.stepLeftShift", {
              count: i + 1,
            }),
            highlightedBit: valA.length + i,
            newBit: "0",
          });
        }

        if (shiftAmount > 4) {
          steps.push({
            step: 5,
            binary: valA + "0".repeat(shiftAmount),
            description: t("simulator.arithmetic.shifting.stepLeftComplete", {
              count: shiftAmount,
            }),
            highlightedBit: null,
            newBit: null,
          });
        }
      } else {
        if (shiftAmount >= valA.length) {
          resStr = "0";
          steps.push({
            step: 0,
            binary: valA,
            description: t("simulator.arithmetic.shifting.stepOriginal", {
              val: valA,
            }),
            highlightedBit: null,
            newBit: null,
          });
          steps.push({
            step: 1,
            binary: "0",
            description: t("simulator.arithmetic.shifting.stepRightZero", {
              count: shiftAmount,
            }),
            highlightedBit: null,
            newBit: null,
          });
        } else {
          resStr = valA.slice(0, valA.length - shiftAmount);
          afterDec = Math.floor(beforeDec / Math.pow(2, shiftAmount));
          expl = t("simulator.arithmetic.shifting.shiftRightExpl");

          steps.push({
            step: 0,
            binary: valA,
            description: t("simulator.arithmetic.shifting.stepOriginal", {
              val: valA,
            }),
            highlightedBit: null,
            newBit: null,
          });

          for (let i = 0; i < Math.min(shiftAmount, 4); i++) {
            const bit = valA[valA.length - 1 - i];
            const remaining = valA.slice(0, valA.length - i - 1);
            steps.push({
              step: i + 1,
              binary: remaining + "X".repeat(i + 1),
              description: t("simulator.arithmetic.shifting.stepRightShift", {
                bit: bit,
              }),
              highlightedBit: valA.length - 1 - i,
              newBit: null,
            });
          }

          if (shiftAmount > 4) {
            steps.push({
              step: 5,
              binary: valA.slice(0, valA.length - shiftAmount),
              description: t(
                "simulator.arithmetic.shifting.stepRightComplete",
                { count: shiftAmount },
              ),
              highlightedBit: null,
              newBit: null,
            });
          }
        }
      }

      return {
        resultStr: resStr || "0",
        decimalBefore: beforeDec,
        decimalAfter: afterDec,
        explanation: expl,
        shiftSteps: steps,
      };
    }, [valA, shiftAmount, direction, t]);

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
            {t("simulator.arithmetic.shifting.desc")}
          </p>
        </div>

        <div className="space-y-4">
          {renderModeSelector}
          <div className={locked ? "opacity-60" : ""}>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              {t("simulator.arithmetic.shifting.binaryNumber")}
            </label>
            <input
              type="text"
              value={valA}
              onChange={(e) => handleInputA(e.target.value)}
              readOnly={locked}
              className={`bg-background text-foreground w-full rounded-md border px-3 py-2 font-mono text-sm tracking-widest transition-colors focus:outline-none ${locked ? "bg-muted border-input pointer-events-none" : "border-input focus:border-primary focus:ring-primary/20 focus:ring-1"}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={locked ? "opacity-60" : ""}>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                {t("simulator.arithmetic.shifting.amount")}
              </label>
              <input
                type="number"
                min={0}
                max={16}
                value={shiftAmount}
                onChange={(e) => {
                  if (locked) return;
                  setShiftAmount(Math.max(0, parseInt(e.target.value) || 0));
                }}
                readOnly={locked}
                className={`bg-background text-foreground w-full rounded-md border px-3 py-2 font-mono text-sm transition-colors focus:outline-none ${locked ? "bg-muted border-input pointer-events-none" : "border-input focus:border-primary focus:ring-primary/20 focus:ring-1"}`}
              />
            </div>

            <div className={locked ? "pointer-events-none opacity-60" : ""}>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                {t("simulator.arithmetic.shifting.direction")}
              </label>
              <div className="bg-muted flex rounded-md p-1">
                <button
                  onClick={() => setDirection("left")}
                  className={`flex flex-1 items-center justify-center rounded p-1 transition-colors ${direction === "left" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <ChevronsLeft className="mr-1 h-4 w-4" />
                </button>
                <button
                  onClick={() => setDirection("right")}
                  className={`flex flex-1 items-center justify-center rounded p-1 transition-colors ${direction === "right" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <ChevronsRight className="mr-1 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logic / Dashboard Panel */}
      <div className="bg-muted/30 border-border/50 overflow-auto rounded-xl border p-6 shadow-sm">
        {locked ? (
          <ExerciseValidationPanel
            expectedResult={resultStr}
            onShowSolution={onShowSolution!}
            placeholder="z.B. 110100"
          />
        ) : (
          <div className="space-y-6">
            <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
              <Info className="text-primary h-5 w-5" />
              {t("simulator.arithmetic.common.result")}
            </h3>

            {valA && shiftAmount >= 0 ? (
              <div className="flex flex-col items-center justify-center p-4">
                {/* Step-by-Step Toggle */}
                <button
                  onClick={() => setShowStepByStep(!showStepByStep)}
                  className="text-primary hover:text-primary/80 mb-4 flex items-center gap-2 self-start text-sm font-medium transition-colors"
                >
                  <List className="h-4 w-4" />
                  {t("simulator.arithmetic.common.showStepByStep")}
                  {showStepByStep ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {showStepByStep && shiftSteps.length > 0 && (
                  <div className="mb-6 w-full space-y-3">
                    <div className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                      {direction === "left"
                        ? t("simulator.arithmetic.shifting.leftStepsTitle")
                        : t("simulator.arithmetic.shifting.rightStepsTitle")}
                    </div>

                    {/* Step-by-step visualization */}
                    <div className="space-y-2">
                      {shiftSteps.map((step, idx) => (
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
                                {t("simulator.arithmetic.shifting.stepN", {
                                  n: step.step,
                                })}
                              </span>
                              <div className="font-mono text-lg tracking-widest">
                                {step.binary.split("").map((char, charIdx) => (
                                  <span
                                    key={charIdx}
                                    className={`inline-block w-6 text-center ${
                                      char === "X"
                                        ? "text-destructive/50"
                                        : charIdx === step.highlightedBit
                                          ? "text-primary bg-primary/10 rounded font-bold"
                                          : "text-foreground"
                                    }`}
                                  >
                                    {char}
                                  </span>
                                ))}
                              </div>
                              {direction === "left" && step.newBit && (
                                <span className="text-muted-foreground text-xs">
                                  +{step.newBit}
                                </span>
                              )}
                              {direction === "right" &&
                                step.highlightedBit !== null && (
                                  <span className="text-destructive text-xs">
                                    -{step.binary[step.highlightedBit] || ""}
                                  </span>
                                )}
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
                                {step.description}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Visual shift diagram */}
                    <div className="bg-background border-border/40 mt-4 rounded-lg border p-4">
                      <div className="text-muted-foreground mb-2 text-xs">
                        {t("simulator.arithmetic.shifting.visualization")}
                      </div>
                      <div className="flex items-center justify-center gap-4 font-mono text-lg">
                        <div className="flex flex-col items-center">
                          <span className="text-muted-foreground mb-1 text-xs">
                            {t("simulator.arithmetic.shifting.before")}
                          </span>
                          <div className="tracking-widest">
                            {valA.split("").map((b, i) => (
                              <span
                                key={i}
                                className="border-border/20 inline-block h-8 w-6 rounded border text-center"
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-primary flex flex-col items-center">
                          {direction === "left" ? (
                            <ChevronsLeft className="h-8 w-8" />
                          ) : (
                            <ChevronsRight className="h-8 w-8" />
                          )}
                          <span className="mt-1 text-xs">×{shiftAmount}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-muted-foreground mb-1 text-xs">
                            {t("simulator.arithmetic.shifting.after")}
                          </span>
                          <div className="tracking-widest">
                            {resultStr.split("").map((b, i) => (
                              <span
                                key={i}
                                className={`border-border/20 inline-block h-8 w-6 rounded border text-center ${
                                  direction === "left" && i >= valA.length
                                    ? "bg-primary/10 text-primary"
                                    : direction === "right" &&
                                        i >= resultStr.length
                                      ? "bg-destructive/10 text-destructive/50"
                                      : ""
                                }`}
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-background border-border/40 w-full rounded-lg border px-6 py-8 text-center font-mono text-xl leading-loose font-medium tracking-widest shadow-inner select-none md:text-2xl">
                  <div className="text-muted-foreground mb-4 flex items-center justify-center gap-4 opacity-50">
                    <span>{valA}</span>
                    <span>{direction === "left" ? "<<" : ">>"}</span>
                    <span>{shiftAmount}</span>
                  </div>

                  <div className="text-primary font-bold">{resultStr}</div>
                </div>

                <div className="bg-primary/10 border-primary mt-6 w-full rounded-r-md border-l-4 p-4">
                  <p className="text-foreground mb-2 text-sm">
                    <strong className="mb-1 block">
                      {t("simulator.arithmetic.shifting.mathMeaning")}
                    </strong>
                    {explanation}
                  </p>

                  <div className="text-muted-foreground border-primary/20 mt-2 border-t pt-2 font-mono text-xs">
                    {direction === "left" ? (
                      <span>
                        {decimalBefore} × 2^{shiftAmount} = {decimalAfter}
                      </span>
                    ) : (
                      <span>
                        {decimalBefore} : 2^{shiftAmount} = {decimalAfter}{" "}
                        {t("simulator.arithmetic.shifting.integer")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {t("simulator.arithmetic.shifting.enterBinary")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
