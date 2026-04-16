import { useState, useMemo } from "react";
import { LockKeyhole, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CompareProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialA?: string;
  initialB?: string;
}

export function Compare({ isExerciseMode, showSolution = true, onShowSolution, initialA, initialB }: CompareProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "10110");
  const [valB, setValB] = useState(initialB || "10011");

  const locked = !!isExerciseMode && !showSolution;

  const handleInputA = (val: string) => {
    if (locked) return;
    setValA(val.replace(/[^01]/g, "").slice(0, 16));
  };
  const handleInputB = (val: string) => {
    if (locked) return;
    setValB(val.replace(/[^01]/g, "").slice(0, 16));
  };

  const { padA, padB, diffIndex, result } = useMemo(() => {
    if (!valA || !valB) return { padA: "", padB: "", diffIndex: -1, result: "eq" };
    
    const maxLen = Math.max(valA.length, valB.length);
    const pA = valA.padStart(maxLen, '0');
    const pB = valB.padStart(maxLen, '0');
    
    let dIndex = -1;
    let res = "eq";
    
    for (let i = 0; i < maxLen; i++) {
        if (pA[i] !== pB[i]) {
            dIndex = i;
            res = pA[i] === '1' ? "greater" : "less";
            break;
        }
    }

    return { padA: pA, padB: pB, diffIndex: dIndex, result: res };
  }, [valA, valB]);

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
