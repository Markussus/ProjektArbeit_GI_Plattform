import { useState, useMemo } from "react";
import { Info, LockKeyhole, ArrowRight, AlertTriangle, List, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SubtractionProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialA?: string;
  initialB?: string;
}

interface OnesComplementStep {
  position: number;
  originalBit: string;
  flippedBit: string;
  explanation: string;
}

interface TwosComplementStep {
  position: number;
  carryIn: number;
  currentBit: number;
  resultBit: number;
  carryOut: number;
  explanation: string;
}

interface AdditionStep {
  position: number;
  bitA: number;
  bitB: number;
  carryIn: number;
  sum: number;
  carryOut: number;
  explanation: string;
}

export function Subtraction({ isExerciseMode, showSolution = true, onShowSolution, initialA, initialB }: SubtractionProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "00101010");
  const [valB, setValB] = useState(initialB || "00001010");
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

  const { padA, padB, onesComp, twosComp, onesSteps, twosSteps, addSteps, sum, carries, overflow, carryOut } = useMemo(() => {
    const padA = valA.padStart(8, '0');
    const padB = valB.padStart(8, '0');
    
    const onesComp = padB.split('').map(b => b === '1' ? '0' : '1').join('');
    
    const onesSteps: OnesComplementStep[] = padB.split('').map((bit, i) => ({
      position: 7 - i,
      originalBit: bit,
      flippedBit: bit === '1' ? '0' : '1',
      explanation: t("simulator.arithmetic.subtraction.flipBitDesc", "Position {{pos}}: {{orig}} → {{flipped}} (invertiert)", {
        pos: 7 - i,
        orig: bit,
        flipped: bit === '1' ? '0' : '1'
      })
    })).reverse();
    
    const twosCompArr = Array(8).fill(0);
    let c = 1;
    for (let i = 7; i >= 0; i--) {
        const bit = parseInt(onesComp[i]);
        const s = bit + c;
        twosCompArr[i] = s % 2;
        c = Math.floor(s / 2);
    }
    const twosComp = twosCompArr.join('');
    
    const twosSteps: TwosComplementStep[] = [];
    c = 1;
    for (let i = 7; i >= 0; i--) {
        const bit = parseInt(onesComp[i]);
        const s = bit + c;
        const resultBit = s % 2;
        c = Math.floor(s / 2);
        twosSteps.unshift({
          position: 7 - i,
          carryIn: c === 0 ? 1 : 0,
          currentBit: bit,
          resultBit,
          carryOut: c,
          explanation: t("simulator.arithmetic.subtraction.addOneDesc", "Position {{pos}}: {{bit}} + {{carry}} = {{sum}} → {{result}}, Carry {{nextCarry}}", {
            pos: 7 - i,
            bit: bit,
            carry: c === 0 ? 1 : 0,
            sum: s,
            result: resultBit,
            nextCarry: c
          })
        });
    }
    
    const carriesArr = Array(9).fill(0);
    const sumArr = Array(8).fill(0);
    const addSteps: AdditionStep[] = [];
    
    for (let i = 7; i >= 0; i--) {
        const bitA = parseInt(padA[i] || '0');
        const bitB = parseInt(twosComp[i] || '0');
        const cIn = carriesArr[7 - i]; 
        const s = bitA + bitB + cIn;
        sumArr[i] = s % 2;
        const cOut = Math.floor(s / 2);
        carriesArr[7 - i + 1] = cOut;
        
        let explanation = "";
        if (bitA === 0 && bitB === 0 && cIn === 0) {
          explanation = t("simulator.arithmetic.subtraction.add0", "Position {{pos}}: 0 + 0 + 0 = 0, kein Übertrag", { pos: 7 - i });
        } else if ((bitA === 1 && bitB === 0 && cIn === 1) || (bitA === 0 && bitB === 1 && cIn === 1)) {
          explanation = t("simulator.arithmetic.subtraction.add1", "Position {{pos}}: 1 + 0/1 + 1 = 0, Übertrag 1", { pos: 7 - i });
        } else if (bitA === 1 && bitB === 1 && cIn === 0) {
          explanation = t("simulator.arithmetic.subtraction.add2", "Position {{pos}}: 1 + 1 + 0 = 0, Übertrag 1", { pos: 7 - i });
        } else if (bitA === 1 && bitB === 1 && cIn === 1) {
          explanation = t("simulator.arithmetic.subtraction.add3", "Position {{pos}}: 1 + 1 + 1 = 1, Übertrag 1", { pos: 7 - i });
        } else {
          explanation = t("simulator.arithmetic.subtraction.add4", "Position {{pos}}: {{a}} + {{b}} + {{c}} = {{sum}}, Übertrag {{carry}}", {
            pos: 7 - i,
            a: bitA,
            b: bitB,
            c: cIn,
            sum: sumArr[i],
            carry: cOut
          });
        }
        
        addSteps.unshift({
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
      onesComp,
      twosComp,
      onesSteps,
      twosSteps,
      addSteps,
      sum: sumArr.join(""), 
      carries: visCarries, 
      overflow, 
      carryOut 
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
             {t("simulator.arithmetic.subtraction.desc", "Die binäre Subtraktion wird üblicherweise als Addition mit der negativen Zahl (im Zweierkomplement) ausgeführt.")}
          </p>
        </div>

        <div className="space-y-4">
          <div className={locked ? "opacity-60" : ""}>
             <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t("simulator.arithmetic.subtraction.minuend", "Minuend (Zahl A)")}</label>
             <input
               type="text"
               value={valA}
               onChange={(e) => handleInputA(e.target.value)}
               readOnly={locked}
               className={`w-full bg-background transition-colors border rounded-md py-2 px-3 focus:outline-none font-mono tracking-widest text-sm text-foreground ${locked ? 'bg-muted border-input pointer-events-none' : 'border-input focus:border-primary focus:ring-1 focus:ring-primary/20'}`}
             />
          </div>
          <div className={locked ? "opacity-60" : ""}>
             <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t("simulator.arithmetic.subtraction.subtrahend", "Subtrahend (Zahl B, die abgezogen wird)")}</label>
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
              <div className="space-y-4">
                {/* Step 1: Ones Complement */}
                <div className="bg-background p-4 rounded-lg border border-border/40 shadow-inner">
                  <p className="font-sans text-xs font-bold uppercase text-muted-foreground tracking-normal mb-3">
                    {t("simulator.arithmetic.subtraction.step1", "1. Einerkomplement bilden (Bits kippen)")}
                  </p>
                  <div className="space-y-2">
                    {onesSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-4 font-mono text-sm">
                        <span className="w-16 text-muted-foreground text-xs">
                          {t("simulator.arithmetic.subtraction.bitN", "Bit {{n}}", { n: step.position })}
                        </span>
                        <span className="w-8 h-8 bg-blue-500/10 rounded flex items-center justify-center">{step.originalBit}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <span className="w-8 h-8 bg-destructive/10 rounded flex items-center justify-center text-destructive">{step.flippedBit}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/40 flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">{t("simulator.arithmetic.subtraction.onesResult", "Einerkomplement:")}</span>
                    <span className="font-mono text-destructive font-bold">{onesComp}</span>
                  </div>
                </div>

                {/* Step 2: Add 1 */}
                <div className="bg-background p-4 rounded-lg border border-border/40 shadow-inner">
                  <p className="font-sans text-xs font-bold uppercase text-muted-foreground tracking-normal mb-3">
                    {t("simulator.arithmetic.subtraction.step2", "2. +1 addieren (Zweierkomplement)")}
                  </p>
                  <div className="space-y-2">
                    {twosSteps.map((step, idx) => (
                      <div key={idx} className="border border-border/40 rounded overflow-hidden">
                        <button
                          onClick={() => toggleStep(idx)}
                          className="w-full flex items-center justify-between p-2 bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4 font-mono text-sm">
                            <span className="w-16 text-muted-foreground text-xs">
                              {t("simulator.arithmetic.subtraction.bitN", "Bit {{n}}", { n: step.position })}
                            </span>
                            <span className="w-8 h-6 bg-destructive/10 rounded flex items-center justify-center text-destructive">{step.currentBit}</span>
                            <span className="text-muted-foreground">+1</span>
                            <span className="w-8 h-6 bg-yellow-500/10 rounded flex items-center justify-center text-yellow-600 dark:text-yellow-400">{step.carryIn}</span>
                            <span className="text-muted-foreground">=</span>
                            <span className="w-8 h-6 bg-primary/10 rounded flex items-center justify-center text-primary font-bold">{step.resultBit}</span>
                            {step.carryOut > 0 && (
                              <>
                                <span className="text-muted-foreground mx-1">→</span>
                                <span className="w-8 h-6 bg-destructive/10 rounded flex items-center justify-center text-destructive">{step.carryOut}</span>
                              </>
                            )}
                          </div>
                          {expandedSteps.has(idx) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        {expandedSteps.has(idx) && (
                          <div className="p-2 bg-muted/20 border-t border-border/40">
                            <p className="text-xs text-muted-foreground">{step.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/40 flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">{t("simulator.arithmetic.subtraction.twosResult", "Zweierkomplement:")}</span>
                    <span className="font-mono text-primary font-bold">{twosComp}</span>
                  </div>
                </div>

                {/* Step 3: Add */}
                <div className="bg-background p-4 rounded-lg border border-border/40 shadow-inner">
                  <p className="font-sans text-xs font-bold uppercase text-muted-foreground tracking-normal mb-3">
                    {t("simulator.arithmetic.subtraction.step3", "3. Addiere das Zweierkomplement zur Zahl A")}
                  </p>
                  <div className="space-y-2">
                    {addSteps.map((step, idx) => (
                      <div key={idx} className="border border-border/40 rounded overflow-hidden">
                        <button
                          onClick={() => toggleStep(idx)}
                          className="w-full flex items-center justify-between p-2 bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 font-mono text-sm">
                            <span className="w-16 text-muted-foreground text-xs">
                              {t("simulator.arithmetic.subtraction.bitN", "Bit {{n}}", { n: step.position })}
                            </span>
                            <span className="w-6 h-6 bg-blue-500/10 rounded flex items-center justify-center">{step.bitA}</span>
                            <span>+</span>
                            <span className="w-6 h-6 bg-green-500/10 rounded flex items-center justify-center">{step.bitB}</span>
                            <span>+</span>
                            <span className="w-6 h-6 bg-yellow-500/10 rounded flex items-center justify-center">{step.carryIn}</span>
                            <span>=</span>
                            <span className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center text-primary font-bold">{step.sum}</span>
                            {step.carryOut > 0 && (
                              <>
                                <span className="text-muted-foreground mx-1">→</span>
                                <span className="w-6 h-6 bg-destructive/10 rounded flex items-center justify-center text-destructive">{step.carryOut}</span>
                              </>
                            )}
                          </div>
                          {expandedSteps.has(idx) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        {expandedSteps.has(idx) && (
                          <div className="p-2 bg-muted/20 border-t border-border/40">
                            <p className="text-xs text-muted-foreground">{step.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Original Steps */}
            <div className="space-y-4 bg-background p-4 rounded-lg border border-border/40 shadow-inner text-sm font-mono tracking-widest">
               <div className="space-y-1">
                   <p className="font-sans text-xs font-bold uppercase text-muted-foreground tracking-normal">{t("simulator.arithmetic.subtraction.step1", "1. Einerkomplement bilden")}</p>
                   <div className="flex gap-4">
                     <span className="opacity-50">{padB}</span>
                     <ArrowRight className="w-4 h-4 opacity-50" />
                     <span className="text-destructive font-semibold">{onesComp}</span>
                   </div>
               </div>
               <div className="space-y-1">
                   <p className="font-sans text-xs font-bold uppercase text-muted-foreground tracking-normal mt-2">{t("simulator.arithmetic.subtraction.step2", "2. +1 addieren (Zweierkomplement)")}</p>
                   <div className="flex gap-4">
                     <span className="opacity-50 text-destructive">{onesComp}</span>
                     <span className="opacity-50 text-primary">+ 00000001</span>
                     <ArrowRight className="w-4 h-4 opacity-50" />
                     <span className="text-primary font-bold">{twosComp}</span>
                   </div>
               </div>
            </div>

            {/* Addition Grid */}
            <p className="font-sans text-xs font-bold uppercase text-muted-foreground tracking-normal mt-6 border-b border-border/50 pb-2">{t("simulator.arithmetic.subtraction.step3", "3. Addiere das Zweierkomplement zur Zahl A")}</p>

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

                {/* Twos Comp of B */}
                <div className="flex gap-2 border-b-2 border-foreground/30 pb-2 mb-2">
                   <span className="w-4 text-center mr-2 text-primary">+</span>
                   <span className="w-4 text-center" /> 
                   {twosComp.split('').map((b, i) => (
                     <span key={`b-${i}`} className="w-4 text-center">{b}</span>
                   ))}
                </div>

                {/* Subtraction Sum */}
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
                <div className="bg-muted border-l-4 border-muted-foreground p-4 rounded-r-md flex items-start gap-3">
                  <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">
                    <strong className="block mb-1">{t("simulator.arithmetic.subtraction.carryOutTitle", "Übertrag (Carry Out):")}</strong> 
                    {t("simulator.arithmetic.subtraction.carryOutInfo", "Da wir via Zweierkomplement subtrahieren, bedeutet ein Carry-Out in der Regel, dass das Ergebnis positiv ist. Den Übertrag werfen wir in diesem Fixpunkt-System einfach weg.")}
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
