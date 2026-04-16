import { useState, useMemo } from "react";
import { LockKeyhole, Search, List, ChevronDown, ChevronRight } from "lucide-react";
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

export function Compare({ isExerciseMode, showSolution = true, onShowSolution, initialA, initialB }: CompareProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "10110");
  const [valB, setValB] = useState(initialB || "10011");
  const [showStepByStep, setShowStepByStep] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0, 1, 2]));

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
    if (!valA || !valB) return { padA: "", padB: "", diffIndex: -1, result: "eq", compareSteps: [] };
    
    const maxLen = Math.max(valA.length, valB.length);
    const pA = valA.padStart(maxLen, '0');
    const pB = valB.padStart(maxLen, '0');
    
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
            res = bitA === '1' ? "greater" : "less";
            if (bitA === '1') {
              explanation = t("simulator.arithmetic.compare.stepResultGreater", "An Position {{pos}}: A hat 1, B hat 0 → A ist größer als B.", { pos: i });
              stepResult = "greater";
            } else {
              explanation = t("simulator.arithmetic.compare.stepResultLess", "An Position {{pos}}: A hat 0, B hat 1 → A ist kleiner als B.", { pos: i });
              stepResult = "less";
            }
        } else {
            explanation = t("simulator.arithmetic.compare.stepEqual", "Position {{pos}}: Beide Bits sind {{bit}}, weiter zum nächsten Bit.", { pos: i, bit: bitA });
        }
        
        steps.push({
            step: i,
            position: i,
            bitA,
            bitB,
            equal,
            result: stepResult,
            explanation
        });
        
        if (!equal) break;
    }

    return { padA: pA, padB: pB, diffIndex: dIndex, result: res, compareSteps: steps };
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
             {t("simulator.arithmetic.compare.desc", "Vergleicht zwei Binärzahlen Bit für Bit von links nach rechts.")}
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
              <Search className="w-5 h-5 text-primary" />
              {t("simulator.arithmetic.compare.visualCompare", "Visueller Vergleich")}
            </h3>

            {valA && valB ? (
                <div className="space-y-6">
                    {/* Step-by-Step Toggle */}
                    <button
                      onClick={() => setShowStepByStep(!showStepByStep)}
                      className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      <List className="w-4 h-4" />
                      {t("simulator.arithmetic.common.showStepByStep", "Schritt-für-Schritt anzeigen")}
                      {showStepByStep ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    {showStepByStep && compareSteps.length > 0 && (
                      <div className="space-y-3">
                        {/* Padding Step */}
                        <div className="bg-background p-4 rounded-lg border border-border/40">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            {t("simulator.arithmetic.compare.stepPadding", "Schritt 0: Auffüllung")}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {t("simulator.arithmetic.compare.padDesc", "Die Zahlen werden auf die gleiche Länge aufgefüllt (mit führenden Nullen):")}
                          </p>
                          <div className="flex gap-6 font-mono text-sm">
                            <div>
                              <span className="text-muted-foreground">A:</span> <span className="text-foreground">{valA}</span>
                              <span className="text-muted-foreground ml-2">→</span>
                              <span className="ml-2 text-primary font-bold">{padA}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">B:</span> <span className="text-foreground">{valB}</span>
                              <span className="text-muted-foreground ml-2">→</span>
                              <span className="ml-2 text-primary font-bold">{padB}</span>
                            </div>
                          </div>
                          {valA.length !== padA.length && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {t("simulator.arithmetic.compare.paddingNote", "{{count}} führende Nullen hinzugefügt.", { count: padA.length - valA.length })}
                            </p>
                          )}
                        </div>

                        {/* Bit Comparison Steps */}
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          {t("simulator.arithmetic.compare.bitComparisonTitle", "Bitweise Vergleichung (von links nach rechts)")}
                        </div>

                        <div className="space-y-2">
                          {compareSteps.map((step, idx) => (
                            <div key={idx} className="border border-border/40 rounded-lg overflow-hidden">
                              <button
                                onClick={() => toggleStep(idx)}
                                className="w-full flex items-center justify-between p-3 bg-background hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  <span className="text-xs font-bold text-muted-foreground w-20">
                                    {t("simulator.arithmetic.compare.posN", "Pos. {{n}}", { n: step.position })}
                                  </span>
                                  <div className="flex items-center gap-2 font-mono text-sm">
                                    <span className="w-8 h-8 bg-blue-500/10 rounded flex items-center justify-center">{step.bitA}</span>
                                    <span className="text-muted-foreground">
                                      {step.equal ? "=" : step.result === "greater" ? ">" : "<"}
                                    </span>
                                    <span className="w-8 h-8 bg-green-500/10 rounded flex items-center justify-center">{step.bitB}</span>
                                    {step.result && (
                                      <span className={`ml-2 text-xs px-2 py-1 rounded ${
                                        step.result === "greater" 
                                          ? 'bg-primary/10 text-primary' 
                                          : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                      }`}>
                                        {step.result === "greater" 
                                          ? t("simulator.arithmetic.compare.AgreaterB", "A > B")
                                          : t("simulator.arithmetic.compare.AlessB", "A < B")
                                        }
                                      </span>
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
                                  {step.result && (
                                    <p className="text-sm text-muted-foreground mt-2 border-t border-border/40 pt-2">
                                      {t("simulator.arithmetic.compare.finalResultNote", "Da hier ein Unterschied gefunden wurde, ist der Vergleich abgeschlossen. Weitere Bits werden nicht mehr betrachtet.")}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Summary */}
                        <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-md">
                          <p className="text-sm font-semibold text-foreground">
                            {result === "eq" 
                              ? t("simulator.arithmetic.compare.resultEq", "Die Zahlen sind gleich groß.") 
                              : result === "greater" 
                                ? t("simulator.arithmetic.compare.resultGreater", "Zahl A ist größer als Zahl B.") 
                                : t("simulator.arithmetic.compare.resultLess", "Zahl A ist kleiner als Zahl B.")}
                          </p>
                        </div>
                      </div>
                    )}

                    {!showStepByStep && (
                      <>
                        <p className="text-sm text-muted-foreground bg-background p-3 rounded border border-border/50">
                            {t("simulator.arithmetic.compare.pad", "Die Zahlen werden auf die gleiche Länge (mit Nullen links) aufgefüllt.")}
                        </p>

                        <div className="flex justify-center p-4">
                          <div className="font-mono text-xl md:text-2xl font-medium tracking-widest leading-loose select-none bg-background p-6 rounded-lg border border-border/40 shadow-inner overflow-x-auto min-w-fit flex flex-col items-center">
                            
                            <div className="flex gap-2">
                                <span className="w-8 text-right mr-4 text-muted-foreground text-sm font-sans my-auto uppercase tracking-normal">A</span>
                                {padA.split('').map((bit, i) => (
                                    <span key={`a-${i}`} className={`w-6 text-center ${i === diffIndex ? 'text-primary font-bold border-2 border-primary rounded' : 'opacity-80'}`}>{bit}</span>
                                ))}
                            </div>
                            
                            <div className="flex gap-2 my-2">
                                 <span className="w-8 mr-4" />
                                {padA.split('').map((_, i) => (
                                    <span key={`op-${i}`} className={`w-6 flex justify-center items-center text-sm ${i === diffIndex ? 'text-primary' : (diffIndex !== -1 && i > diffIndex ? 'opacity-0' : 'text-muted-foreground')}`}>
                                        {i === diffIndex ? (result === "greater" ? ">" : "<") : "="}
                                    </span>
                                ))}
                            </div>
                            
                            <div className="flex gap-2">
                                <span className="w-8 text-right mr-4 text-muted-foreground text-sm font-sans my-auto uppercase tracking-normal">B</span>
                                {padB.split('').map((bit, i) => (
                                    <span key={`b-${i}`} className={`w-6 text-center ${i === diffIndex ? 'text-primary font-bold border-2 border-primary rounded' : 'opacity-80'}`}>{bit}</span>
                                ))}
                            </div>
                            
                          </div>
                        </div>
                        
                        <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-md w-full">
                           <p className="text-sm font-semibold text-foreground">
                             {result === "eq" ? t("simulator.arithmetic.compare.resultEq", "Die Zahlen sind gleich groß.") : 
                              result === "greater" ? t("simulator.arithmetic.compare.resultGreater", "Zahl A ist größer als Zahl B.") : 
                              t("simulator.arithmetic.compare.resultLess", "Zahl A ist kleiner als Zahl B.")}
                           </p>
                        </div>
                      </>
                    )}

                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t("simulator.arithmetic.common.enterValidOperands", "Bitte gebe gültige Operanden ein.")}</p>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
