import { useState, useMemo } from "react";
import {
  LockKeyhole,
  Search,
  List,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface CompareProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialA?: string;
  initialB?: string;
}

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
  initialA,
  initialB,
}: CompareProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "10110");
  const [valB, setValB] = useState(initialB || "10011");
  const [showStepByStep, setShowStepByStep] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(
    new Set(["0", "1", "2"]),
  );

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
      return {
        padA: "",
        padB: "",
        diffIndex: -1,
        result: "eq",
        compareSteps: [],
      };

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
          explanation = t("simulator.arithmetic.compare.stepResultGreater", {
            pos: i,
          });
          stepResult = "greater";
        } else {
          explanation = t("simulator.arithmetic.compare.stepResultLess", {
            pos: i,
          });
          stepResult = "less";
        }
      } else {
        explanation = t("simulator.arithmetic.compare.stepEqual", {
          pos: i,
          bit: bitA,
        });
      }

      steps.push({
        step: i,
        position: i,
        bitA,
        bitB,
        equal,
        result: stepResult,
        explanation,
      });

      if (!equal) break;
    }

    return {
      padA: pA,
      padB: pB,
      diffIndex: dIndex,
      result: res,
      compareSteps: steps,
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
            {t("simulator.arithmetic.compare.desc")}
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
              <Search className="text-primary h-5 w-5" />
              {t("simulator.arithmetic.compare.visualCompare")}
            </h3>

            {valA && valB ? (
              <div className="space-y-6">
                {/* Step-by-Step Toggle */}
                <button
                  onClick={() => setShowStepByStep(!showStepByStep)}
                  className="text-primary hover:text-primary/80 flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <List className="h-4 w-4" />
                  {t("simulator.arithmetic.common.showStepByStep")}
                  {showStepByStep ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

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
                          <span className="text-primary ml-2 font-bold">
                            {padA}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">B:</span>{" "}
                          <span className="text-foreground">{valB}</span>
                          <span className="text-muted-foreground ml-2">→</span>
                          <span className="text-primary ml-2 font-bold">
                            {padB}
                          </span>
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
                        <div
                          key={idx}
                          className="border-border/40 overflow-hidden rounded-lg border"
                        >
                          <button
                            onClick={() => toggleStep(idx)}
                            className="bg-background hover:bg-muted/50 flex w-full items-center justify-between p-3 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-muted-foreground w-20 text-xs font-bold">
                                {t("simulator.arithmetic.compare.posN", {
                                  n: step.position,
                                })}
                              </span>
                              <div className="flex items-center gap-2 font-mono text-sm">
                                <span className="flex h-8 w-8 items-center justify-center rounded bg-blue-500/10">
                                  {step.bitA}
                                </span>
                                <span className="text-muted-foreground">
                                  {step.equal
                                    ? "="
                                    : step.result === "greater"
                                      ? ">"
                                      : "<"}
                                </span>
                                <span className="flex h-8 w-8 items-center justify-center rounded bg-green-500/10">
                                  {step.bitB}
                                </span>
                                {step.result && (
                                  <span
                                    className={`ml-2 rounded px-2 py-1 text-xs ${
                                      step.result === "greater"
                                        ? "bg-primary/10 text-primary"
                                        : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                    }`}
                                  >
                                    {step.result === "greater"
                                      ? t(
                                          "simulator.arithmetic.compare.AgreaterB",
                                        )
                                      : t(
                                          "simulator.arithmetic.compare.AlessB",
                                        )}
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
                              {step.result && (
                                <p className="text-muted-foreground border-border/40 mt-2 border-t pt-2 text-sm">
                                  {t(
                                    "simulator.arithmetic.compare.finalResultNote",
                                  )}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
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
                          <span className="text-muted-foreground my-auto mr-4 w-8 text-right font-sans text-sm tracking-normal uppercase">
                            A
                          </span>
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
                              className={`flex w-6 items-center justify-center text-sm ${i === diffIndex ? "text-primary" : diffIndex !== -1 && i > diffIndex ? "opacity-0" : "text-muted-foreground"}`}
                            >
                              {i === diffIndex
                                ? result === "greater"
                                  ? ">"
                                  : "<"
                                : "="}
                            </span>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <span className="text-muted-foreground my-auto mr-4 w-8 text-right font-sans text-sm tracking-normal uppercase">
                            B
                          </span>
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
        )}
      </div>
    </div>
  );
}
