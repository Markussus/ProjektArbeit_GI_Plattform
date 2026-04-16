import { useState, useMemo } from "react";
import { Info, LockKeyhole, ChevronsLeft, ChevronsRight, List, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ShiftingProps {
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

export function Shifting({ isExerciseMode, showSolution = true, onShowSolution, initialA }: ShiftingProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "1101");
  const [shiftAmount, setShiftAmount] = useState<number>(2);
  const [direction, setDirection] = useState<"left" | "right">("left");
  const [showStepByStep, setShowStepByStep] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0, 1, 2]));

  const locked = !!isExerciseMode && !showSolution;

  const handleInputA = (val: string) => {
    if (locked) return;
    setValA(val.replace(/[^01]/g, "").slice(0, 16));
  };

  const { resultStr, decimalBefore, decimalAfter, explanation, shiftSteps } = useMemo(() => {
    if (!valA) return { resultStr: "", decimalBefore: 0, decimalAfter: 0, explanation: "", shiftSteps: [] };
    
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
          description: t("simulator.arithmetic.shifting.stepOriginal", "Originale Binärzahl: {{val}}", { val: valA }),
          highlightedBit: null,
          newBit: null
        });
        
        for (let i = 0; i < Math.min(shiftAmount, 4); i++) {
          const currentResult = valA + "0".repeat(i + 1);
          steps.push({
            step: i + 1,
            binary: currentResult,
            description: t("simulator.arithmetic.shifting.stepLeftShift", "Bits werden nach links verschoben. {{count}} Null(en) angehängt.", { count: i + 1 }),
            highlightedBit: valA.length + i,
            newBit: "0"
          });
        }
        
        if (shiftAmount > 4) {
          steps.push({
            step: 5,
            binary: valA + "0".repeat(shiftAmount),
            description: t("simulator.arithmetic.shifting.stepLeftComplete", "Alle {{count}} Nullen wurden angehängt.", { count: shiftAmount }),
            highlightedBit: null,
            newBit: null
          });
        }
    } else {
        if (shiftAmount >= valA.length) {
            resStr = "0";
            steps.push({
              step: 0,
              binary: valA,
              description: t("simulator.arithmetic.shifting.stepOriginal", "Originale Binärzahl: {{val}}", { val: valA }),
              highlightedBit: null,
              newBit: null
            });
            steps.push({
              step: 1,
              binary: "0",
              description: t("simulator.arithmetic.shifting.stepRightZero", "Verschiebung um {{count}} >= Länge der Zahl, Ergebnis ist 0.", { count: shiftAmount }),
              highlightedBit: null,
              newBit: null
            });
        } else {
            resStr = valA.slice(0, valA.length - shiftAmount);
            afterDec = Math.floor(beforeDec / Math.pow(2, shiftAmount));
            expl = t("simulator.arithmetic.shifting.shiftRightExpl");
            
            steps.push({
              step: 0,
              binary: valA,
              description: t("simulator.arithmetic.shifting.stepOriginal", "Originale Binärzahl: {{val}}", { val: valA }),
              highlightedBit: null,
              newBit: null
            });
            
            for (let i = 0; i < Math.min(shiftAmount, 4); i++) {
              const bit = valA[valA.length - 1 - i];
              const remaining = valA.slice(0, valA.length - i - 1);
              steps.push({
                step: i + 1,
                binary: remaining + "X".repeat(i + 1),
                description: t("simulator.arithmetic.shifting.stepRightShift", "Das rechte Bit ({{bit}}) fällt heraus.", { bit: bit }),
                highlightedBit: valA.length - 1 - i,
                newBit: null
              });
            }
            
            if (shiftAmount > 4) {
              steps.push({
                step: 5,
                binary: valA.slice(0, valA.length - shiftAmount),
                description: t("simulator.arithmetic.shifting.stepRightComplete", "Alle {{count}} rechten Bits wurden entfernt.", { count: shiftAmount }),
                highlightedBit: null,
                newBit: null
              });
            }
        }
    }

    return { 
      resultStr: resStr || "0", 
      decimalBefore: beforeDec, 
      decimalAfter: afterDec, 
      explanation: expl,
      shiftSteps: steps
    };
  }, [valA, shiftAmount, direction, t]);

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
             Operanden
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
             {t("simulator.arithmetic.shifting.desc", "Hier kannst du Binärzahlen nach links oder rechts verschieben.")}
          </p>
        </div>

        <div className="space-y-4">
          <div className={locked ? "opacity-60" : ""}>
             <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t("simulator.arithmetic.shifting.binaryNumber", "Binärzahl")}</label>
             <input
               type="text"
               value={valA}
               onChange={(e) => handleInputA(e.target.value)}
               readOnly={locked}
               className={`w-full bg-background transition-colors border rounded-md py-2 px-3 focus:outline-none font-mono tracking-widest text-sm text-foreground ${locked ? 'bg-muted border-input pointer-events-none' : 'border-input focus:border-primary focus:ring-1 focus:ring-primary/20'}`}
             />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className={locked ? "opacity-60" : ""}>
               <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t("simulator.arithmetic.shifting.amount", "Verschiebung um (n Bits)")}</label>
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
                 className={`w-full bg-background transition-colors border rounded-md py-2 px-3 focus:outline-none font-mono text-sm text-foreground ${locked ? 'bg-muted border-input pointer-events-none' : 'border-input focus:border-primary focus:ring-1 focus:ring-primary/20'}`}
               />
            </div>
            
            <div className={locked ? "pointer-events-none opacity-60" : ""}>
               <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t("simulator.arithmetic.shifting.direction", "Richtung")}</label>
               <div className="flex bg-muted p-1 rounded-md">
                 <button 
                    onClick={() => setDirection("left")}
                    className={`flex-1 flex items-center justify-center p-1 rounded transition-colors ${direction === "left" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                 >
                    <ChevronsLeft className="w-4 h-4 mr-1" />
                 </button>
                 <button 
                    onClick={() => setDirection("right")}
                    className={`flex-1 flex items-center justify-center p-1 rounded transition-colors ${direction === "right" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                 >
                    <ChevronsRight className="w-4 h-4 mr-1" />
                 </button>
               </div>
            </div>
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
              Ergebnis
            </h3>

            {valA && shiftAmount >= 0 ? (
                <div className="flex flex-col items-center justify-center p-4">
                  {/* Step-by-Step Toggle */}
                  <button
                    onClick={() => setShowStepByStep(!showStepByStep)}
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-4 self-start"
                  >
                    <List className="w-4 h-4" />
                    {t("simulator.arithmetic.common.showStepByStep", "Schritt-für-Schritt anzeigen")}
                    {showStepByStep ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  {showStepByStep && shiftSteps.length > 0 && (
                    <div className="w-full space-y-3 mb-6">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {direction === "left" 
                          ? t("simulator.arithmetic.shifting.leftStepsTitle", "Linksverschiebung: Nullen werden rechts angehängt")
                          : t("simulator.arithmetic.shifting.rightStepsTitle", "Rechtsverschiebung: Bits fallen rechts heraus")
                        }
                      </div>

                      {/* Step-by-step visualization */}
                      <div className="space-y-2">
                        {shiftSteps.map((step, idx) => (
                          <div key={idx} className="border border-border/40 rounded-lg overflow-hidden">
                            <button
                              onClick={() => toggleStep(idx)}
                              className="w-full flex items-center justify-between p-3 bg-background hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-muted-foreground w-16">
                                  {t("simulator.arithmetic.shifting.stepN", "Schritt {{n}}", { n: step.step })}
                                </span>
                                <div className="font-mono text-lg tracking-widest">
                                  {step.binary.split('').map((char, charIdx) => (
                                    <span 
                                      key={charIdx}
                                      className={`inline-block w-6 text-center ${
                                        char === "X" 
                                          ? 'text-destructive/50' 
                                          : charIdx === step.highlightedBit 
                                            ? 'text-primary font-bold bg-primary/10 rounded' 
                                            : 'text-foreground'
                                      }`}
                                    >
                                      {char}
                                    </span>
                                  ))}
                                </div>
                                {direction === "left" && step.newBit && (
                                  <span className="text-xs text-muted-foreground">
                                    +{step.newBit}
                                  </span>
                                )}
                                {direction === "right" && step.highlightedBit !== null && (
                                  <span className="text-xs text-destructive">
                                    -{step.binary[step.highlightedBit] || ""}
                                  </span>
                                )}
                              </div>
                              {expandedSteps.has(idx) ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                            {expandedSteps.has(idx) && (
                              <div className="p-3 bg-muted/30 border-t border-border/40">
                                <p className="text-sm text-foreground">{step.description}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Visual shift diagram */}
                      <div className="bg-background p-4 rounded-lg border border-border/40 mt-4">
                        <div className="text-xs text-muted-foreground mb-2">
                          {t("simulator.arithmetic.shifting.visualization", "Visuelle Darstellung:")}
                        </div>
                        <div className="flex items-center justify-center gap-4 font-mono text-lg">
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-muted-foreground mb-1">{t("simulator.arithmetic.shifting.before", "Vorher")}</span>
                            <div className="tracking-widest">
                              {valA.split('').map((b, i) => (
                                <span key={i} className="inline-block w-6 h-8 text-center border border-border/20 rounded">{b}</span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col items-center text-primary">
                            {direction === "left" ? (
                              <ChevronsLeft className="w-8 h-8" />
                            ) : (
                              <ChevronsRight className="w-8 h-8" />
                            )}
                            <span className="text-xs mt-1">×{shiftAmount}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-muted-foreground mb-1">{t("simulator.arithmetic.shifting.after", "Nachher")}</span>
                            <div className="tracking-widest">
                              {resultStr.split('').map((b, i) => (
                                <span 
                                  key={i} 
                                  className={`inline-block w-6 h-8 text-center border border-border/20 rounded ${
                                    (direction === "left" && i >= valA.length) 
                                      ? 'bg-primary/10 text-primary' 
                                      : (direction === "right" && i >= resultStr.length)
                                        ? 'bg-destructive/10 text-destructive/50'
                                        : ''
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

                  <div className="font-mono text-xl md:text-2xl font-medium tracking-widest leading-loose select-none bg-background py-8 px-6 w-full text-center rounded-lg border border-border/40 shadow-inner">
                    
                    <div className="flex items-center justify-center gap-4 text-muted-foreground mb-4 opacity-50">
                       <span>{valA}</span>
                       <span>{direction === "left" ? "<<" : ">>"}</span>
                       <span>{shiftAmount}</span>
                    </div>
                    
                    <div className="text-primary font-bold">
                       {resultStr}
                    </div>
                    
                  </div>
                  
                  <div className="mt-6 bg-primary/10 border-l-4 border-primary p-4 rounded-r-md w-full">
                     <p className="text-sm text-foreground mb-2">
                       <strong className="block mb-1">{t("simulator.arithmetic.shifting.mathMeaning", "Mathematische Bedeutung:")}</strong>
                       {explanation}
                     </p>
                     
                     <div className="font-mono text-xs text-muted-foreground mt-2 border-t border-primary/20 pt-2">
                        {direction === "left" ? (
                           <span>{decimalBefore} × 2^{shiftAmount} = {decimalAfter}</span>
                        ) : (
                           <span>{decimalBefore} : 2^{shiftAmount} = {decimalAfter} (Ganzzahlig)</span>
                        )}
                     </div>
                  </div>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t("simulator.arithmetic.shifting.enterBinary", "Bitte gebe eine Binärzahl ein.")}</p>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
