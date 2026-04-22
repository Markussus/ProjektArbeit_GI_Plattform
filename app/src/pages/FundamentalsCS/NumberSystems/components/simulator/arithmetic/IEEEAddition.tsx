import { useState, useMemo } from "react";
import {
  Info,
  LockKeyhole,
  ArrowRight,
  List,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface IEEEAdditionProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
}

interface IEEEParsedValue {
  sign: number;
  exp: number;
  expBits: string;
  mantissaBits: string;
  hiddenBit: string;
  isZero: boolean;
  signBit: string;
  expDec: number;
}

interface IEEEShiftStep {
  position: number;
  originalMantissa: string;
  shiftedMantissa: string;
  explanation: string;
}

export function IEEEAddition({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
}: IEEEAdditionProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState("13.37");
  const [valB, setValB] = useState("2.5");
  const [showStepByStep, setShowStepByStep] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(
    new Set(["0", "1", "2"]),
  );

  const locked = !!isExerciseMode && !showSolution;

  const floatToBinary = (num: number) => {
    const arr = new Float32Array(1);
    const view = new Uint32Array(arr.buffer);
    arr[0] = num;
    return view[0].toString(2).padStart(32, "0");
  };

  const { parsed, steps, result, shiftSteps } = useMemo(() => {
    const numA = parseFloat("valA");
    const numB = parseFloat("valB");

    if (isNaN(numA) || isNaN(numB)) {
      return { parsed: null, steps: null, result: null, shiftSteps: [] };
    }

    const binA = floatToBinary(numA);
    const binB = floatToBinary(numB);

    const parseIEEE = (bin: string): IEEEParsedValue => {
      const sign = parseInt(bin[0], 2);
      const expBits = bin.slice(1, 9);
      const exp = parseInt(expBits, 2);
      const mantissaBits = bin.slice(9);
      const hiddenBit = exp === 0 ? "0" : "1";
      return {
        sign,
        exp,
        expBits,
        mantissaBits,
        hiddenBit,
        isZero: exp === 0 && parseInt(mantissaBits, 2) === 0,
        signBit: bin[0],
        expDec: exp - 127,
      };
    };

    const parsedA = parseIEEE(binA);
    const parsedB = parseIEEE(binB);

    if (parsedA.isZero || parsedB.isZero) {
      return {
        parsed: { A: parsedA, B: parsedB },
        steps: { msg: t("simulator.arithmetic.ieee754.zeroSkipped") },
        result: { sumDec: numA + numB, binStr: floatToBinary(numA + numB) },
        shiftSteps: [],
      };
    }

    let larger = parsedA;
    let smaller = parsedB;
    let swapped = false;

    if (
      parsedB.exp > parsedA.exp ||
      (parsedB.exp === parsedA.exp && numB > numA)
    ) {
      larger = parsedB;
      smaller = parsedA;
      swapped = true;
    }

    const expDiff = larger.exp - smaller.exp;
    const shiftVal = Math.min(expDiff, 24);
    const smallerMantissaFull = smaller.hiddenBit + smaller.mantissaBits;
    const shiftedSmaller = ("0".repeat(shiftVal) + smallerMantissaFull).slice(
      0,
      24,
    );

    const shiftSteps: IEEEShiftStep[] = [];
    for (let i = 0; i < shiftVal; i++) {
      shiftSteps.push({
        position: i,
        originalMantissa: smallerMantissaFull.slice(i, i + 8) || "",
        shiftedMantissa: shiftedSmaller.slice(i, i + 8) || "",
        explanation: t("simulator.arithmetic.ieee754.shiftBitDesc", {
          n: i + 1,
        }),
      });
    }

    const resultNum = numA + numB;
    const resBin = floatToBinary(resultNum);
    const resParsed = parseIEEE(resBin);

    return {
      parsed: { A: parsedA, B: parsedB, swapped },
      steps: {
        denorm: {
          diff: expDiff,
          largerExpDec: larger.exp - 127,
          smallerExpDec: smaller.exp - 127,
          shiftedMantissa: shiftedSmaller,
        },
        renorm: {
          resParsed,
        },
      },
      result: { sumDec: resultNum, binStr: resBin },
      shiftSteps,
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
            {t("simulator.arithmetic.ieee754.floatingPoint")}
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">
            {t("simulator.arithmetic.ieee754.desc")}
          </p>
        </div>

        <div className="space-y-4">
          <div className={locked ? "opacity-60" : ""}>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              {t("simulator.arithmetic.ieee754.inputA")}
            </label>
            <input
              type="text"
              value={valA}
              onChange={(e) => {
                if (!locked) setValA(e.target.value);
              }}
              readOnly={locked}
              className={`bg-background text-foreground w-full rounded-md border px-3 py-2 font-mono text-sm transition-colors focus:outline-none ${locked ? "bg-muted border-input pointer-events-none" : "border-input focus:border-primary focus:ring-primary/20 focus:ring-1"}`}
            />
          </div>
          <div className={locked ? "opacity-60" : ""}>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              {t("simulator.arithmetic.ieee754.inputB")}
            </label>
            <input
              type="text"
              value={valB}
              onChange={(e) => {
                if (!locked) setValB(e.target.value);
              }}
              readOnly={locked}
              className={`bg-background text-foreground w-full rounded-md border px-3 py-2 font-mono text-sm transition-colors focus:outline-none ${locked ? "bg-muted border-input pointer-events-none" : "border-input focus:border-primary focus:ring-primary/20 focus:ring-1"}`}
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
        ) : parsed && steps && result ? (
          <div className="space-y-6">
            <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
              <Info className="text-primary h-5 w-5" />
              {t("simulator.arithmetic.ieee754.threeSteps")}
            </h3>

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

            {showStepByStep && !steps.msg && (
              <div className="space-y-4">
                {/* Step 1: Denormalize */}
                <div className="bg-background border-border/40 rounded-lg border p-4 shadow-inner">
                  <p className="text-muted-foreground mb-3 font-sans text-xs font-bold tracking-normal uppercase">
                    {t("simulator.arithmetic.ieee754.step1")}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex h-8 w-8 items-center justify-center rounded bg-blue-500/10 text-xs">
                        A
                      </span>
                      <span className="font-mono">
                        <span className="text-primary">{parsed.A.signBit}</span>
                        <span className="mx-1">{parsed.A.expBits}</span>
                        <span className="text-muted-foreground">
                          {parsed.A.mantissaBits.slice(0, 8)}
                        </span>
                        <span className="text-muted-foreground/50">
                          {parsed.A.mantissaBits.slice(8)}
                        </span>
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Exp: {parsed.A.expDec}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex h-8 w-8 items-center justify-center rounded bg-green-500/10 text-xs">
                        B
                      </span>
                      <span className="font-mono">
                        <span className="text-primary">{parsed.B.signBit}</span>
                        <span className="mx-1">{parsed.B.expBits}</span>
                        <span className="text-muted-foreground">
                          {parsed.B.mantissaBits.slice(0, 8)}
                        </span>
                        <span className="text-muted-foreground/50">
                          {parsed.B.mantissaBits.slice(8)}
                        </span>
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Exp: {parsed.B.expDec}
                      </span>
                    </div>

                    <div className="border-border/40 border-t pt-3">
                      <p className="text-muted-foreground mb-2 text-xs">
                        {t("simulator.arithmetic.ieee754.expDiffDesc", {
                          larger: steps.denorm?.largerExpDec,
                          smaller: steps.denorm?.smallerExpDec,
                          diff: steps.denorm?.diff,
                        })}
                      </p>
                      <p className="text-muted-foreground mb-2 text-xs">
                        {t("simulator.arithmetic.ieee754.shiftDesc", {
                          diff: steps.denorm?.diff,
                        })}
                      </p>

                      {shiftSteps.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-muted-foreground text-xs font-semibold">
                            {t(
                              "simulator.arithmetic.ieee754.shiftVisualization",
                            )}
                          </p>
                          {shiftSteps.map((step, idx) => (
                            <div
                              key={idx}
                              className="border-border/30 overflow-hidden rounded border"
                            >
                              <button
                                onClick={() => toggleStep(idx)}
                                className="bg-muted/30 hover:bg-muted/50 flex w-full items-center justify-between p-2 transition-colors"
                              >
                                <div className="flex items-center gap-2 font-mono text-xs">
                                  <span className="text-muted-foreground w-16">
                                    {t("simulator.arithmetic.ieee754.shiftN", {
                                      n: idx + 1,
                                    })}
                                  </span>
                                  <span className="text-muted-foreground">
                                    1.
                                    {steps.denorm?.shiftedMantissa.slice(0, 8)}
                                  </span>
                                  <span className="text-muted-foreground/50">
                                    ...
                                  </span>
                                </div>
                                {expandedSteps.has(String(idx)) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                              {expandedSteps.has(String(idx)) && (
                                <div className="bg-muted/20 border-border/30 border-t p-2">
                                  <p className="text-muted-foreground text-xs">
                                    {step.explanation}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 2: Add Mantissas */}
                <div className="bg-background border-border/40 rounded-lg border p-4 shadow-inner">
                  <p className="text-muted-foreground mb-3 font-sans text-xs font-bold tracking-normal uppercase">
                    {t("simulator.arithmetic.ieee754.step2")}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {t("simulator.arithmetic.ieee754.addDesc", {
                      exp: steps.denorm?.largerExpDec,
                    })}
                  </p>
                  <div className="bg-primary/5 border-primary/20 mt-3 rounded border p-2 font-mono text-sm">
                    <span className="text-muted-foreground">
                      1.{parsed.A.mantissaBits.slice(0, 12)}...
                    </span>
                    <span className="text-primary mx-2">+</span>
                    <span className="text-muted-foreground">
                      0.{steps.denorm?.shiftedMantissa.slice(0, 12)}...
                    </span>
                    <ArrowRight className="mx-2 inline-block h-4 w-4" />
                    <span className="text-primary font-bold">
                      = 1.{steps.renorm?.resParsed.mantissaBits.slice(0, 12)}...
                    </span>
                  </div>
                </div>

                {/* Step 3: Normalize */}
                <div className="bg-background border-border/40 rounded-lg border p-4 shadow-inner">
                  <p className="text-muted-foreground mb-3 font-sans text-xs font-bold tracking-normal uppercase">
                    {t("simulator.arithmetic.ieee754.step3")}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {t("simulator.arithmetic.ieee754.normDesc")}
                  </p>
                  <div className="bg-primary/5 border-primary/20 mt-3 flex flex-col gap-1 rounded border p-3">
                    <span className="text-muted-foreground text-xs">
                      {t("simulator.arithmetic.ieee754.signExpMant")}
                    </span>
                    <div className="font-mono">
                      <span className="text-lg font-bold">
                        {steps.renorm?.resParsed.signBit}
                      </span>
                      <span className="text-primary mx-2 text-lg">
                        {steps.renorm?.resParsed.expBits}
                      </span>
                      <span className="text-foreground text-lg">
                        {steps.renorm?.resParsed.mantissaBits.slice(0, 16)}
                        <span className="text-muted-foreground/50">
                          {steps.renorm?.resParsed.mantissaBits.slice(16)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {steps.msg ? (
              <p className="text-muted-foreground text-sm">{steps.msg}</p>
            ) : (
              <div className="space-y-4 font-mono text-sm">
                {/* Denorm */}
                <div className="bg-background border-border/40 space-y-2 rounded border p-4 shadow-inner">
                  <p className="text-muted-foreground font-sans text-xs font-bold tracking-normal uppercase">
                    {t("simulator.arithmetic.ieee754.step1")}
                  </p>
                  <p className="text-muted-foreground font-sans text-xs">
                    {t("simulator.arithmetic.ieee754.expDiffDesc", {
                      larger: steps.denorm?.largerExpDec,
                      smaller: steps.denorm?.smallerExpDec,
                      diff: steps.denorm?.diff,
                    })}
                  </p>
                  <p className="text-muted-foreground font-sans text-xs">
                    {t("simulator.arithmetic.ieee754.shiftDesc", {
                      diff: steps.denorm?.diff,
                    })}
                  </p>
                  <div className="pt-2">
                    <span className="mr-2 line-through opacity-50">
                      1.{parsed.B.mantissaBits}
                    </span>
                    <ArrowRight className="text-primary mx-2 inline-block h-4 w-4" />
                    <span className="text-primary font-bold">
                      0.{steps.denorm?.shiftedMantissa.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Mantissas Add */}
                <div className="bg-background border-border/40 space-y-2 rounded border p-4 shadow-inner">
                  <p className="text-muted-foreground font-sans text-xs font-bold tracking-normal uppercase">
                    {t("simulator.arithmetic.ieee754.step2")}
                  </p>
                  <p className="text-muted-foreground font-sans text-xs">
                    {t("simulator.arithmetic.ieee754.expAligned", {
                      exp: steps.denorm?.largerExpDec,
                    })}
                  </p>
                </div>

                {/* Renorm */}
                <div className="bg-background border-border/40 space-y-2 rounded border p-4 shadow-inner">
                  <p className="text-muted-foreground font-sans text-xs font-bold tracking-normal uppercase">
                    {t("simulator.arithmetic.ieee754.step3")}
                  </p>
                  <p className="text-muted-foreground font-sans text-xs">
                    {t("simulator.arithmetic.ieee754.normBack")}
                  </p>
                  <div className="bg-primary/5 border-primary/20 mt-2 flex flex-col gap-1 rounded border p-2">
                    <span className="text-muted-foreground text-xs">
                      {t("simulator.arithmetic.ieee754.signExpMant")}
                    </span>
                    <div>
                      <span className="font-bold">
                        {steps.renorm?.resParsed.sign}
                      </span>
                      <span className="text-primary mx-2">
                        {steps.renorm?.resParsed.expBits}
                      </span>
                      <span className="text-foreground">
                        {steps.renorm?.resParsed.mantissaBits}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="border-border/50 flex justify-start border-t pt-4 text-sm font-semibold">
              <span className="bg-primary/10 text-primary flex items-center gap-2 rounded-md px-3 py-1">
                {t("simulator.arithmetic.ieee754.decimalResult")}:{" "}
                {result.sumDec}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground py-4 text-center text-sm">
            {t("simulator.arithmetic.common.enterValidOperands")}
          </p>
        )}
      </div>
    </div>
  );
}
