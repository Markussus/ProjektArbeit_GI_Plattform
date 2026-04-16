import { useState, useMemo } from "react";
import { Info, LockKeyhole, ArrowRight, List, ChevronDown, ChevronRight } from "lucide-react";
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

export function IEEEAddition({ isExerciseMode, showSolution = true, onShowSolution }: IEEEAdditionProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState("13.37");
  const [valB, setValB] = useState("2.5");
  const [showStepByStep, setShowStepByStep] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0, 1, 2]));

  const locked = !!isExerciseMode && !showSolution;

  const floatToBinary = (num: number) => {
    const arr = new Float32Array(1);
    const view = new Uint32Array(arr.buffer);
    arr[0] = num;
    return view[0].toString(2).padStart(32, '0');
  };

  const { parsed, steps, result, shiftSteps } = useMemo(() => {
    const numA = parseFloat(valA);
    const numB = parseFloat(valB);

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
          expDec: exp - 127
        };
    };

    const parsedA = parseIEEE(binA);
    const parsedB = parseIEEE(binB);

    if (parsedA.isZero || parsedB.isZero) {
        return { 
           parsed: { A: parsedA, B: parsedB }, 
           steps: { msg: "Null-Addition übersprungen." }, 
           result: { sumDec: numA + numB, binStr: floatToBinary(numA + numB) },
           shiftSteps: []
        };
    }

    let larger = parsedA;
    let smaller = parsedB;
    let swapped = false;
    
    if (parsedB.exp > parsedA.exp || (parsedB.exp === parsedA.exp && numB > numA)) {
        larger = parsedB;
        smaller = parsedA;
        swapped = true;
    }

    const expDiff = larger.exp - smaller.exp;
    const shiftVal = Math.min(expDiff, 24);
    const smallerMantissaFull = smaller.hiddenBit + smaller.mantissaBits;
    const shiftedSmaller = ("0".repeat(shiftVal) + smallerMantissaFull).slice(0, 24);

    const shiftSteps: IEEEShiftStep[] = [];
    for (let i = 0; i < shiftVal; i++) {
      shiftSteps.push({
        position: i,
        originalMantissa: smallerMantissaFull.slice(i, i + 8) || "",
        shiftedMantissa: shiftedSmaller.slice(i, i + 8) || "",
        explanation: t("simulator.arithmetic.ieee754.shiftBitDesc", "Schritt {{n}}: Bit wird um eine Position nach rechts verschoben", { n: i + 1 })
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
            shiftedMantissa: shiftedSmaller
        },
        renorm: {
           resParsed
        }
      },
      result: { sumDec: resultNum, binStr: resBin },
      shiftSteps
    };
  }, [valA, valB, t]);

  const toggleStep = (index: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-in fade-in zoom-in-95 duration-300">
      
      {/* Inputs */}
      <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-foreground flex items-center gap-2">
             {t("simulator.arithmetic.ieee754.floatingPoint", "Gleitkommazahlen")}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
             {t("simulator.arithmetic.ieee754.desc", "Addition von zwei 32-Bit Gleitkommazahlen nach IEEE 754.")}
          </p>
        </div>

        <div className="space-y-4">
          <div className={locked ? "opacity-60" : ""}>
             <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t("simulator.arithmetic.ieee754.inputA", "Dezimal A")}</label>
             <input
               type="text"
               value={valA}
               onChange={(e) => { if (!locked) setValA(e.target.value); }}
               readOnly={locked}
               className={`w-full bg-background transition-colors border rounded-md py-2 px-3 focus:outline-none font-mono text-sm text-foreground ${locked ? 'bg-muted border-input pointer-events-none' : 'border-input focus:border-primary focus:ring-1 focus:ring-primary/20'}`}
             />
          </div>
          <div className={locked ? "opacity-60" : ""}>
             <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t("simulator.arithmetic.ieee754.inputB", "Dezimal B")}</label>
             <input
               type="text"
               value={valB}
               onChange={(e) => { if (!locked) setValB(e.target.value); }}
               readOnly={locked}
               className={`w-full bg-background transition-colors border rounded-md py-2 px-3 focus:outline-none font-mono text-sm text-foreground ${locked ? 'bg-muted border-input pointer-events-none' : 'border-input focus:border-primary focus:ring-1 focus:ring-primary/20'}`}
             />
          </div>
        </div>
      </div>

      {/* Logic / Dashboard Panel */}
      <div className="bg-muted/30 border border-border/50 rounded-xl p-6 shadow-sm overflow-auto">
        {locked ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-center py-12">
              <LockKeyhole className="w-12 h-12 text-muted-foreground opacity-50" />
              <div>
                <p className="text-foreground font-medium mb-1">{t("simulator.numbers.lockedTitle", "Lösung gesperrt")}</p>
                <p className="text-sm text-muted-foreground mb-4">{t("simulator.numbers.lockedDesc", "Klicke auf den Button, um das Ergebnis und den Rechenweg anzuzeigen.")}</p>
              </div>
              <button onClick={onShowSolution} className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2 rounded-md shadow-sm transition-colors">
                {t("simulator.numbers.showSolution", "Lösung anzeigen")}
              </button>
            </div>
        ) : parsed && steps && result ? (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              {t("simulator.arithmetic.ieee754.threeSteps", "Addition in 3 Schritten")}
            </h3>

            {/* Step-by-Step Toggle */}
            <button
              onClick={() => setShowStepByStep(!showStepByStep)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-4"
            >
              <List className="w-4 h-4" />
              {t("simulator.arithmetic.common.showStepByStep", "Schritt-für-Schritt anzeigen")}
              {showStepByStep ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {showStepByStep && !steps.msg && (
              <div className="space-y-4">
                {/* Step 1: Denormalize */}
                <div className="bg-background p-4 rounded-lg border border-border/40 shadow-inner">
                  <p className="font-sans text-xs font-bold uppercase text-muted-foreground tracking-normal mb-3">
                    {t("simulator.arithmetic.ieee754.step1", "1. Exponenten angleichen (Denormierung)")}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="w-8 h-8 bg-blue-500/10 rounded flex items-center justify-center text-xs">A</span>
                      <span className="font-mono">
                        <span className="text-primary">{parsed.A.signBit}</span>
                        <span className="mx-1">{parsed.A.expBits}</span>
                        <span className="text-muted-foreground">{parsed.A.mantissaBits.slice(0, 8)}</span>
                        <span className="text-muted-foreground/50">{parsed.A.mantissaBits.slice(8)}</span>
                      </span>
                      <span className="text-muted-foreground text-xs">Exp: {parsed.A.expDec}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="w-8 h-8 bg-green-500/10 rounded flex items-center justify-center text-xs">B</span>
                      <span className="font-mono">
                        <span className="text-primary">{parsed.B.signBit}</span>
                        <span className="mx-1">{parsed.B.expBits}</span>
                        <span className="text-muted-foreground">{parsed.B.mantissaBits.slice(0, 8)}</span>
                        <span className="text-muted-foreground/50">{parsed.B.mantissaBits.slice(8)}</span>
                      </span>
                      <span className="text-muted-foreground text-xs">Exp: {parsed.B.expDec}</span>
                    </div>

                    <div className="border-t border-border/40 pt-3">
                      <p className="text-xs text-muted-foreground mb-2">
                        {t("simulator.arithmetic.ieee754.expDiffDesc", "Exponentendifferenz: {{larger}} - {{smaller}} = {{diff}}", {
                          larger: steps.denorm?.largerExpDec,
                          smaller: steps.denorm?.smallerExpDec,
                          diff: steps.denorm?.diff
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {t("simulator.arithmetic.ieee754.shiftDesc", "Die Mantisse der kleineren Zahl wird um {{diff}} Stellen nach rechts verschoben.", {
                          diff: steps.denorm?.diff
                        })}
                      </p>
                      
                      {shiftSteps.length > 0 && (
                        <div className="space-y-2 mt-3">
                          <p className="text-xs font-semibold text-muted-foreground">
                            {t("simulator.arithmetic.ieee754.shiftVisualization", "Visuelle Verschiebung:")}
                          </p>
                          {shiftSteps.map((step, idx) => (
                            <div key={idx} className="border border-border/30 rounded overflow-hidden">
                              <button
                                onClick={() => toggleStep(idx)}
                                className="w-full flex items-center justify-between p-2 bg-muted/30 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-2 font-mono text-xs">
                                  <span className="w-16 text-muted-foreground">
                                    {t("simulator.arithmetic.ieee754.shiftN", "Shift {{n}}", { n: idx + 1 })}
                                  </span>
                                  <span className="text-muted-foreground">1.{steps.denorm?.shiftedMantissa.slice(0, 8)}</span>
                                  <span className="text-muted-foreground/50">...</span>
                                </div>
                                {expandedSteps.has(idx) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                              {expandedSteps.has(idx) && (
                                <div className="p-2 bg-muted/20 border-t border-border/30">
                                  <p className="text-xs text-muted-foreground">{step.explanation}</p>
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
                <div className="bg-background p-4 rounded-lg border border-border/40 shadow-inner">
                  <p className="font-sans text-xs font-bold uppercase text-muted-foreground tracking-normal mb-3">
                    {t("simulator.arithmetic.ieee754.step2", "2. Mantisse addieren (inklusive Hidden Bit)")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("simulator.arithmetic.ieee754.addDesc", "Nun weisen beide Glieder den Exponenten 2^{{exp}} auf und können addiert werden.", {
                      exp: steps.denorm?.largerExpDec
                    })}
                  </p>
                  <div className="mt-3 p-2 bg-primary/5 rounded border border-primary/20 font-mono text-sm">
                    <span className="text-muted-foreground">1.{parsed.A.mantissaBits.slice(0, 12)}...</span>
                    <span className="text-primary mx-2">+</span>
                    <span className="text-muted-foreground">0.{steps.denorm?.shiftedMantissa.slice(0, 12)}...</span>
                    <ArrowRight className="inline-block w-4 h-4 mx-2" />
                    <span className="text-primary font-bold">= 1.{steps.renorm?.resParsed.mantissaBits.slice(0, 12)}...</span>
                  </div>
                </div>

                {/* Step 3: Normalize */}
                <div className="bg-background p-4 rounded-lg border border-border/40 shadow-inner">
                  <p className="font-sans text-xs font-bold uppercase text-muted-foreground tracking-normal mb-3">
                    {t("simulator.arithmetic.ieee754.step3", "3. Ergebnis normieren")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("simulator.arithmetic.ieee754.normDesc", "Das Resultat wird zurück in das Format 1.M × 2^E verschoben.")}
                  </p>
                  <div className="flex flex-col gap-1 mt-3 p-3 bg-primary/5 rounded border border-primary/20">
                      <span className="text-xs text-muted-foreground">{t("simulator.arithmetic.ieee754.signExpMant", "Sign | Exponent | Mantissa")}</span>
                      <div className="font-mono">
                          <span className="font-bold text-lg">{steps.renorm?.resParsed.signBit}</span>
                          <span className="mx-2 text-primary text-lg">{steps.renorm?.resParsed.expBits}</span>
                          <span className="text-foreground text-lg">{steps.renorm?.resParsed.mantissaBits.slice(0, 16)}<span className="text-muted-foreground/50">{steps.renorm?.resParsed.mantissaBits.slice(16)}</span></span>
                      </div>
                  </div>
                </div>
              </div>
            )}

            {steps.msg ? (
               <p className="text-sm text-muted-foreground">{steps.msg}</p>
            ) : (
                <div className="space-y-4 font-mono text-sm">
                    {/* Denorm */}
                    <div className="bg-background p-4 rounded border border-border/40 shadow-inner space-y-2">
                        <p className="font-sans text-xs font-bold uppercase text-muted-foreground tracking-normal">{t("simulator.arithmetic.ieee754.step1", "1. Exponenten angleichen (Denormierung)")}</p>
                        <p className="text-xs text-muted-foreground font-sans">
                            Exponentendifferenz: {steps.denorm?.largerExpDec} - {steps.denorm?.smallerExpDec} = {steps.denorm?.diff}
                        </p>
                        <p className="text-xs text-muted-foreground font-sans">
                            Die Mantisse der kleineren Zahl wird um {steps.denorm?.diff} Stellen nach rechts verschoben.
                        </p>
                        <div className="pt-2">
                           <span className="opacity-50 line-through mr-2">1.{parsed.B.mantissaBits}</span>
                           <ArrowRight className="inline-block w-4 h-4 mx-2 text-primary" />
                           <span className="font-bold text-primary">0.{steps.denorm?.shiftedMantissa.slice(1)}</span>
                        </div>
                    </div>

                    {/* Mantissas Add */}
                    <div className="bg-background p-4 rounded border border-border/40 shadow-inner space-y-2">
                        <p className="font-sans text-xs font-bold uppercase text-muted-foreground tracking-normal">{t("simulator.arithmetic.ieee754.step2", "2. Mantisse addieren (inklusive Hidden Bit)")}</p>
                        <p className="text-xs text-muted-foreground font-sans">
                            Nun weisen beide Glieder den Exponenten 2^{steps.denorm?.largerExpDec} auf und können addiert (bzw. subtrahiert) werden.
                        </p>
                    </div>

                    {/* Renorm */}
                    <div className="bg-background p-4 rounded border border-border/40 shadow-inner space-y-2">
                        <p className="font-sans text-xs font-bold uppercase text-muted-foreground tracking-normal">{t("simulator.arithmetic.ieee754.step3", "3. Ergebnis normieren")}</p>
                        <p className="text-xs text-muted-foreground font-sans">
                            Das Resultat wird zurück in das Format 1.M × 2^E verschoben.
                        </p>
                        <div className="flex flex-col gap-1 mt-2 p-2 bg-primary/5 rounded border border-primary/20">
                            <span className="text-xs text-muted-foreground">{t("simulator.arithmetic.ieee754.signExpMant", "Sign | Exponent | Mantissa")}</span>
                            <div>
                                <span className="font-bold">{steps.renorm?.resParsed.sign}</span>
                                <span className="mx-2 text-primary">{steps.renorm?.resParsed.expBits}</span>
                                <span className="text-foreground">{steps.renorm?.resParsed.mantissaBits}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-start text-sm font-semibold border-t border-border/50 pt-4">
              <span className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-md">
                {t("simulator.arithmetic.ieee754.decimalResult", "Dezimal")}: {result.sumDec}
              </span>
            </div>

          </div>
        ) : (
             <p className="text-sm text-muted-foreground text-center py-4">{t("simulator.arithmetic.common.enterValidOperands", "Bitte gebe gültige Operanden ein.")}</p>
        )}
      </div>
    </div>
  );
}
