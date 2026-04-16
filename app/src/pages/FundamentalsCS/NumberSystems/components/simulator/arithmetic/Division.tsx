import { useState, useMemo } from "react";
import { Info, LockKeyhole } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DivisionProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialA?: string;
  initialB?: string;
}

export function Division({ isExerciseMode, showSolution = true, onShowSolution, initialA, initialB }: DivisionProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "11010"); // Dividend 26
  const [valB, setValB] = useState(initialB || "101");  // Divisor 5

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
    const stepsArr = [];

    for (let i = 0; i < valA.length; i++) {
        currentStr += valA[i];
        const currentVal = BigInt("0b" + currentStr);
        
        if (currentVal >= divisor) {
            stepsArr.push({
                droppedBitIndex: i,
                currentStr: currentStr.replace(/^0+/, '') || "0",
                subtracted: valB,
                isOne: true
            });
            qStr += "1";
            currentStr = (currentVal - divisor).toString(2);
        } else {
            stepsArr.push({
                droppedBitIndex: i,
                currentStr: currentStr.replace(/^0+/, '') || "0",
                subtracted: "0",
                isOne: false
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
  }, [valA, valB]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-in fade-in zoom-in-95 duration-300">
      
      {/* Inputs */}
      <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-foreground flex items-center gap-2">
             Operanden
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
             {t("simulator.arithmetic.division.desc", "Schriftliche Division durch Probieren (gehe von links nach rechts).")}
          </p>
        </div>

        <div className="space-y-4">
          <div className={locked ? "opacity-60" : ""}>
             <label className="block text-xs font-medium text-muted-foreground mb-1.5">Dividend (Zahl A, die geteilt wird)</label>
             <input
               type="text"
               value={valA}
               onChange={(e) => handleInputA(e.target.value)}
               readOnly={locked}
               className={`w-full bg-background transition-colors border rounded-md py-2 px-3 focus:outline-none font-mono tracking-widest text-sm text-foreground ${locked ? 'bg-muted border-input pointer-events-none' : 'border-input focus:border-primary focus:ring-1 focus:ring-primary/20'}`}
             />
          </div>
          <div className={locked ? "opacity-60" : ""}>
             <label className="block text-xs font-medium text-muted-foreground mb-1.5">Divisor (Zahl B)</label>
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
              Rechenweg & Ergebnis
            </h3>

            {isZeroDiv ? (
               <p className="text-sm font-semibold text-destructive py-4">Division durch 0 ist nicht definiert.</p>   
            ) : valA && valB ? (
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

                    {/* Steps Dropdown logic roughly visualized */}
                    <div className="flex flex-col items-start w-full whitespace-nowrap space-y-1">
                       {steps.map((step, idx) => (
                          <div key={idx} className="flex gap-4 w-full">
                             {/* Shift padding manually could be tricky, using simple visual blocks instead */}
                             <div className="flex flex-col items-end border-l-2 border-muted/50 pl-2">
                                <span className="text-foreground">{step.currentStr}</span>
                                <span className={`${step.isOne ? 'text-destructive' : 'text-muted-foreground opacity-50'}`}>- {step.subtracted}</span>
                             </div>
                             <div className="text-muted-foreground text-sm flex items-center h-full pt-4">
                                → ergänze {step.isOne ? '1' : '0'} am Ende d. Quotienten
                             </div>
                          </div>
                       ))}
                    </div>

                    {/* Result */}
                    <div className="flex justify-start gap-2 border-t-2 border-foreground/30 pt-4 mt-6">
                       <span className="text-muted-foreground">Rest:</span>
                       <span className="font-bold">{remainder}</span>
                    </div>
                    
                    <div className="text-left text-xs text-muted-foreground mt-4 font-sans tracking-normal">
                      In Dezimal: {parseInt(valA, 2)} : {parseInt(valB, 2)} = {parseInt(quotient, 2)} Rest {parseInt(remainder, 2)}
                    </div>
                  </div>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Bitte gebe gültige Operanden ein.</p>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
