import { useState, useMemo } from "react";
import { Info, LockKeyhole, List, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DivisionProps {
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

export function Division({ isExerciseMode, showSolution = true, onShowSolution, initialA, initialB }: DivisionProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "11010");
  const [valB, setValB] = useState(initialB || "101");
  const [showStepByStep, setShowStepByStep] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0, 1, 2]));

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
    if (!valA || !valB) return { steps: [], quotient: "", remainder: "", isZeroDiv: false };
    
    if (BigInt("0b" + valB || "0") === 0n) return { steps: [], quotient: "", remainder: "", isZeroDiv: true };

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
                currentStr: currentStr.replace(/^0+/, '') || "0",
                subtracted: valB,
                isOne: true,
                quotientBit: "1",
                remainderAfter: remainderAfter,
                explanation: t("simulator.arithmetic.division.stepDesc", "Schritt {{n}}: {{current}} >= {{divisor}}, also 1 zum Quotienten und subtrahiere {{divisor}}", {
                  n: i + 1,
                  current: currentStr.replace(/^0+/, '') || "0",
                  divisor: valB
                })
            });
            qStr += "1";
            currentStr = remainderAfter;
        } else {
            stepsArr.push({
                step: i,
                droppedBitIndex: i,
                currentStr: currentStr.replace(/^0+/, '') || "0",
                subtracted: "0",
                isOne: false,
                quotientBit: "0",
                remainderAfter: currentStr,
                explanation: t("simulator.arithmetic.division.stepDescSmall", "Schritt {{n}}: {{current}} < {{divisor}}, also 0 zum Quotienten", {
                  n: i + 1,
                  current: currentStr.replace(/^0+/, '') || "0",
                  divisor: valB
                })
            });
            qStr += "0";
        }
    }

    return { 
      steps: stepsArr,
      quotient: qStr.replace(/^0+/, '') || "0",
      remainder: currentStr.replace(/^0+/, '') || "0",
      isZeroDiv: false
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
             {t("simulator.arithmetic.common.operands", "Operanden")}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
             {t("simulator.arithmetic.division.desc", "Schriftliche Division durch Probieren (gehe von links nach rechts).")}
          </p>
        </div>

        <div className="space-y-4">
          <div className={locked ? "opacity-60" : ""}>
             <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t("simulator.arithmetic.division.dividend", "Dividend (Zahl A, die geteilt wird)")}</label>
             <input
               type="text"
               value={valA}
               onChange={(e) => handleInputA(e.target.value)}
               readOnly={locked}
               className={`w-full bg-background transition-colors border rounded-md py-2 px-3 focus:outline-none font-mono tracking-widest text-sm text-foreground ${locked ? 'bg-muted border-input pointer-events-none' : 'border-input focus:border-primary focus:ring-1 focus:ring-primary/20'}`}
             />
          </div>
          <div className={locked ? "opacity-60" : ""}>
             <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t("simulator.arithmetic.division.divisor", "Divisor (Zahl B)")}</label>
             <input
               type="text"
               value={valB}
               onChange={(e) => handleInputB(e.target.value)}
               readOnly={locked}
               className={`w-full bg-background transition-colors border rounded-md py-2 px-3 focus:outline-none font-mono tracking-widest text-sm text-foreground ${locked ? 'bg-muted border-input pointer-events-none' : 'border-input focus:border-primary focus:ring-1 focus:ring-primary/20'}`}
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
        ) : (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              {t("simulator.arithmetic.common.stepsResult", "Rechenweg & Ergebnis")}
            </h3>

            {isZeroDiv ? (
               <p className="text-sm font-semibold text-destructive py-4">{t("simulator.arithmetic.division.divByZero", "Division durch 0 ist nicht definiert.")}</p>   
            ) : valA && valB ? (
                <>
                  {/* Step-by-Step Toggle */}
                  <button
                    onClick={() => setShowStepByStep(!showStepByStep)}
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-4"
                  >
                    <List className="w-4 h-4" />
                    {t("simulator.arithmetic.common.showStepByStep", "Schritt-für-Schritt anzeigen")}
                    {showStepByStep ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  {showStepByStep && steps.length > 0 && (
                    <div className="space-y-3 mb-6">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {t("simulator.arithmetic.division.stepByStepTitle", "Bitweise Division")}
                      </div>

                      {/* Collapsible Steps */}
                      <div className="space-y-2">
                        {steps.map((step, idx) => (
                          <div key={idx} className="border border-border/40 rounded-lg overflow-hidden">
                            <button
                              onClick={() => toggleStep(idx)}
                              className="w-full flex items-center justify-between p-3 bg-background hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-muted-foreground w-16">
                                  {t("simulator.arithmetic.division.stepN", "Schritt {{n}}", { n: step.step + 1 })}
                                </span>
                                <div className="flex items-center gap-2 font-mono text-sm">
                                  <span className={`w-6 h-6 rounded flex items-center justify-center ${step.isOne ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                    {step.quotientBit}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {step.isOne 
                                      ? t("simulator.arithmetic.division.appendOneShort", "→ 1")
                                      : t("simulator.arithmetic.division.appendZeroShort", "→ 0")
                                    }
                                  </span>
                                </div>
                              </div>
                              {expandedSteps.has(idx) ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                            {expandedSteps.has(idx) && (
                              <div className="p-3 bg-muted/30 border-t border-border/40">
                                <p className="text-sm text-foreground">{step.explanation}</p>
                                {step.isOne && (
                                  <div className="mt-2 p-2 bg-destructive/5 rounded border border-destructive/20 font-mono text-sm">
                                    <span className="text-muted-foreground">{step.currentStr}</span>
                                    <span className="text-muted-foreground mx-2">-</span>
                                    <span className="text-destructive">{step.subtracted}</span>
                                    <span className="text-muted-foreground mx-2">=</span>
                                    <span className="text-primary font-bold">{step.remainderAfter}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-md mt-4">
                        <p className="text-sm text-foreground">
                          <strong>{t("simulator.arithmetic.division.quotient", "Quotient")}:</strong> {quotient}
                        </p>
                        <p className="text-sm text-foreground mt-1">
                          <strong>{t("simulator.arithmetic.division.remainder", "Rest")}:</strong> {remainder}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Original Visual */}
                  <div className="flex justify-center p-4 overflow-x-auto">
                    <div className="font-mono text-lg font-medium tracking-widest leading-loose select-none bg-background p-6 rounded-lg border border-border/40 shadow-inner min-w-fit">
                      
                      {/* Header */}
                      <div className="flex justify-start gap-2 border-b-2 border-foreground/30 pb-2 mb-4 whitespace-nowrap">
                         <span>{valA}</span>
                         <span className="text-primary mx-2">:</span>
                         <span>{valB}</span>
                         <span className="text-primary mx-2">=</span>
                         <span className="text-primary font-bold">{quotient}</span>
                      </div>

                      {/* Steps visualized */}
                      <div className="flex flex-col items-start w-full whitespace-nowrap space-y-1">
                         {steps.map((step, idx) => (
                            <div key={idx} className="flex gap-4 w-full">
                               <div className="flex flex-col items-end border-l-2 border-muted/50 pl-2">
                                  <span className="text-foreground">{step.currentStr}</span>
                                  <span className={`${step.isOne ? 'text-destructive' : 'text-muted-foreground opacity-50'}`}>- {step.subtracted}</span>
                               </div>
                               <div className="text-muted-foreground text-sm flex items-center h-full pt-4">
                                  {step.isOne 
                                    ? t("simulator.arithmetic.division.appendOneShort", "→ 1")
                                    : t("simulator.arithmetic.division.appendZeroShort", "→ 0")
                                  }
                               </div>
                            </div>
                         ))}
                      </div>

                      {/* Result */}
                      <div className="flex justify-start gap-2 border-t-2 border-foreground/30 pt-4 mt-6">
                         <span className="text-muted-foreground">{t("simulator.arithmetic.division.remainder", "Rest:")}</span>
                         <span className="font-bold">{remainder}</span>
                      </div>
                      
                      <div className="text-left text-xs text-muted-foreground mt-4 font-sans tracking-normal">
                        {t("simulator.arithmetic.division.inDecimal", "In Dezimal")}: {parseInt(valA, 2)} : {parseInt(valB, 2)} = {parseInt(quotient, 2)} Rest {parseInt(remainder, 2)}
                      </div>
                    </div>
                  </div>
                </>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t("simulator.arithmetic.common.enterValidOperands", "Bitte gebe gültige Operanden ein.")}</p>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
