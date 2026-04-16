import { useState, useMemo } from "react";
import { Info, LockKeyhole, AlertTriangle, ChevronDown, ChevronRight, List } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AdditionProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialA?: string;
  initialB?: string;
}

interface BitStep {
  position: number;
  bitA: number;
  bitB: number;
  carryIn: number;
  sum: number;
  carryOut: number;
  explanation: string;
}

export function Addition({ isExerciseMode, showSolution = true, onShowSolution, initialA, initialB }: AdditionProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "01100101");
  const [valB, setValB] = useState(initialB || "00111100");
  const [showStepByStep, setShowStepByStep] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0, 1, 2]));

  const locked = !!isExerciseMode && !showSolution;

  const handleInputA = (val: string) => {
    if (locked) return;
    setValA(val.replace(/[^01]/g, "").slice(0, 8));
  };
  const handleInputB = (val: string) => {
    if (locked) return;
    setValB(val.replace(/[^01]/g, "").slice(0, 8));
  };

  const { padA, padB, sum, carries, overflow, carryOut, bitSteps } = useMemo(() => {
    const padA = valA.padStart(8, '0');
    const padB = valB.padStart(8, '0');
    
    const carriesArr = Array(9).fill(0);
    const sumArr = Array(8).fill(0);
    const steps: BitStep[] = [];
    
    for (let i = 7; i >= 0; i--) {
        const bitA = parseInt(padA[i] || '0');
        const bitB = parseInt(padB[i] || '0');
        const cIn = carriesArr[7 - i]; 
        const s = bitA + bitB + cIn;
        sumArr[i] = s % 2;
        const cOut = Math.floor(s / 2);
        carriesArr[7 - i + 1] = cOut;
        
        let explanation = "";
        if (bitA === 0 && bitB === 0 && cIn === 0) {
          explanation = t("simulator.arithmetic.addition.step0", "0 + 0 + 0 = 0, kein Übertrag");
        } else if (bitA === 1 && bitB === 0 && cIn === 0) {
          explanation = t("simulator.arithmetic.addition.step1", "1 + 0 + 0 = 1, kein Übertrag");
        } else if (bitA === 0 && bitB === 1 && cIn === 0) {
          explanation = t("simulator.arithmetic.addition.step2", "0 + 1 + 0 = 1, kein Übertrag");
        } else if (bitA === 0 && bitB === 0 && cIn === 1) {
          explanation = t("simulator.arithmetic.addition.step3", "0 + 0 + 1 = 1, kein Übertrag");
        } else if (bitA === 1 && bitB === 1 && cIn === 0) {
          explanation = t("simulator.arithmetic.addition.step4", "1 + 1 + 0 = 0, Übertrag 1");
        } else if (bitA === 1 && bitB === 0 && cIn === 1) {
          explanation = t("simulator.arithmetic.addition.step5", "1 + 0 + 1 = 0, Übertrag 1");
        } else if (bitA === 0 && bitB === 1 && cIn === 1) {
          explanation = t("simulator.arithmetic.addition.step6", "0 + 1 + 1 = 0, Übertrag 1");
        } else if (bitA === 1 && bitB === 1 && cIn === 1) {
          explanation = t("simulator.arithmetic.addition.step7", "1 + 1 + 1 = 1, Übertrag 1");
        }
        
        steps.unshift({
          position: 7 - i,
          bitA,
          bitB,
          carryIn: cIn,
          sum: sumArr[i],
          carryOut: cOut,
          explanation
        });
    }
    
    const overflow = carriesArr[7] !== carriesArr[8];
    const carryOut = carriesArr[8] === 1;
    const visCarries = [...carriesArr].reverse();

    return { 
      padA, 
      padB, 
      sum: sumArr.join(""), 
      carries: visCarries, 
      overflow, 
      carryOut,
      bitSteps: steps
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
             {t("simulator.arithmetic.common.operands8bit", "Operanden (max 8-Bit)")}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
             {t("simulator.arithmetic.addition.desc", "Stellenweise Addition im Binärsystem. Werden zwei Einsen addiert, gibt es einen Übertrag (Carry) an die nächste Stelle.")}
          </p>
        </div>

        <div className="space-y-4">
          <div className={locked ? "opacity-60" : ""}>
             <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t("simulator.arithmetic.common.operandA", "Zahl A")}</label>
             <input
               type="text"
               value={valA}
               onChange={(e) => handleInputA(e.target.value)}
               readOnly={locked}
               className={`w-full bg-background transition-colors border rounded-md py-2 px-3 focus:outline-none font-mono tracking-widest text-sm text-foreground ${locked ? 'bg-muted border-input pointer-events-none' : 'border-input focus:border-primary focus:ring-1 focus:ring-primary/20'}`}
             />
          </div>
          <div className={locked ? "opacity-60" : ""}>
             <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t("simulator.arithmetic.common.operandB", "Zahl B")}</label>
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

            {/* Step-by-Step Toggle */}
            <button
              onClick={() => setShowStepByStep(!showStepByStep)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-4"
            >
              <List className="w-4 h-4" />
              {t("simulator.arithmetic.common.showStepByStep", "Schritt-für-Schritt anzeigen")}
              {showStepByStep ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {showStepByStep && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t("simulator.arithmetic.addition.stepByStepTitle", "Bitweise Addition")}
                </div>
                
                {/* Bit Position Legend */}
                <div className="flex justify-center mb-4">
                  <div className="flex gap-2 text-xs font-mono text-muted-foreground bg-background p-2 rounded border border-border/40">
                    <div className="flex items-center gap-1">
                      <span className="w-6 h-6 bg-blue-500/10 rounded flex items-center justify-center">A</span>
                      <span>{t("simulator.arithmetic.addition.legendA", "Zahl A")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-6 h-6 bg-green-500/10 rounded flex items-center justify-center">B</span>
                      <span>{t("simulator.arithmetic.addition.legendB", "Zahl B")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-6 h-6 bg-yellow-500/10 rounded flex items-center justify-center">C</span>
                      <span>{t("simulator.arithmetic.addition.legendC", "Übertrag rein")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">S</span>
                      <span>{t("simulator.arithmetic.addition.legendS", "Summe")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-6 h-6 bg-destructive/10 rounded flex items-center justify-center text-destructive">→</span>
                      <span>{t("simulator.arithmetic.addition.legendOut", "Übertrag raus")}</span>
                    </div>
                  </div>
                </div>

                {/* Collapsible Steps */}
                <div className="space-y-2">
                  {bitSteps.map((step, idx) => (
                    <div key={idx} className="border border-border/40 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleStep(idx)}
                        className="w-full flex items-center justify-between p-3 bg-background hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-muted-foreground">
                            {t("simulator.arithmetic.addition.bitPos", "Bit {{pos}}", { pos: step.position })}
                          </span>
                          <div className="flex items-center gap-1 font-mono text-sm">
                            <span className="w-6 h-6 bg-blue-500/10 rounded flex items-center justify-center">{step.bitA}</span>
                            <span>+</span>
                            <span className="w-6 h-6 bg-green-500/10 rounded flex items-center justify-center">{step.bitB}</span>
                            <span>+</span>
                            <span className="w-6 h-6 bg-yellow-500/10 rounded flex items-center justify-center">{step.carryIn}</span>
                            <span>=</span>
                            <span className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center font-bold text-primary">{step.sum}</span>
                            {step.carryOut > 0 && (
                              <>
                                <span className="text-muted-foreground mx-1">→</span>
                                <span className="w-6 h-6 bg-destructive/10 rounded flex items-center justify-center font-bold text-destructive">{step.carryOut}</span>
                              </>
                            )}
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
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t border-border/50 pt-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    {t("simulator.arithmetic.addition.finalResult", "Endergebnis:")}
                  </p>
                </div>
              </div>
            )}

            {/* Math Grid */}
            <div className="flex justify-center p-4">
              <div className="font-mono text-lg md:text-xl font-medium tracking-widest leading-loose select-none bg-background p-6 rounded-lg border border-border/40 shadow-inner">
                {/* Carries */}
                <div className="text-destructive text-sm flex gap-2">
                  <span className="w-4" />
                  <span className="w-4 mr-2" />
                  {carries.slice(0, 8).map((c, i) => (
                    <span key={i} className={`w-4 text-center ${c ? 'opacity-100 font-bold' : 'opacity-20'}`}>{c}</span>
                  ))}
                </div>
                
                {/* Pad A */}
                <div className="flex gap-2">
                   <span className="w-4 text-center" />
                   <span className="w-4 text-center mr-2" /> 
                   {padA.split('').map((b, i) => (
                     <span key={`a-${i}`} className="w-4 text-center">{b}</span>
                   ))}
                </div>

                {/* Pad B */}
                <div className="flex gap-2 border-b-2 border-foreground/30 pb-2 mb-2">
                   <span className="w-4 text-center mr-2 text-primary">+</span>
                   <span className="w-4 text-center" /> 
                   {padB.split('').map((b, i) => (
                     <span key={`b-${i}`} className="w-4 text-center">{b}</span>
                   ))}
                </div>

                {/* Sum */}
                <div className="flex gap-2">
                   <span className="w-4 text-center" />
                   <span className={`w-4 text-center mr-2 ${carryOut ? 'text-destructive font-bold' : 'opacity-20 text-muted-foreground'}`}>{carries[0]}</span>
                   {sum.split('').map((b, i) => (
                     <span key={`s-${i}`} className="w-4 text-center text-primary font-bold">{b}</span>
                   ))}
                </div>
              </div>
            </div>

            {/* Warnings */}
            <div className="space-y-3">
              {carryOut && (
                <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-r-md flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive-foreground">
                    <strong className="block mb-1">{t("simulator.arithmetic.subtraction.carryOutTitle", "Carry Out:")}</strong> 
                    {t("simulator.arithmetic.addition.carryOutWarning")}
                  </p>
                </div>
              )}
              {overflow && (
                <div className="bg-orange-500/10 border-l-4 border-orange-500 p-4 rounded-r-md flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-orange-700 dark:text-orange-400">
                    <strong className="block mb-1">{t("simulator.arithmetic.addition.overflowTitle", "Overflow Error (2s Complement):")}</strong> 
                    {t("simulator.arithmetic.addition.overflowWarning")}
                  </p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
