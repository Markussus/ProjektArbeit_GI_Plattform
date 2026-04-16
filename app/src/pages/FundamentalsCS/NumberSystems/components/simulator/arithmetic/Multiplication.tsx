import { useState, useMemo } from "react";
import { Info, LockKeyhole } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MultiplicationProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialA?: string;
  initialB?: string;
}

export function Multiplication({ isExerciseMode, showSolution = true, onShowSolution, initialA, initialB }: MultiplicationProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "1101");
  const [valB, setValB] = useState(initialB || "101");

  const locked = !!isExerciseMode && !showSolution;

  const handleInputA = (val: string) => {
    if (locked) return;
    setValA(val.replace(/[^01]/g, "").slice(0, 8)); // restrict to 8 bits for UI sanity
  };
  const handleInputB = (val: string) => {
    if (locked) return;
    setValB(val.replace(/[^01]/g, "").slice(0, 8));
  };

  const { steps, finalSum, finalSumDec } = useMemo(() => {
    if (!valA || !valB) return { steps: [], finalSum: "", finalSumDec: "" };
    
    const stepsArr = [];
    let sum = 0n;
    
    // Reverse valB to iterate LSB to MSB
    const reversedB = valB.split('').reverse().join('');
    
    for (let i = 0; i < reversedB.length; i++) {
        const bit = reversedB[i];
        let termStr = "";
        let termVal = 0n;
        
        if (bit === '1') {
            termStr = valA + "0".repeat(i);
            termVal = BigInt("0b" + termStr);
        } else {
            termStr = "0".repeat(valA.length + i); // just visual padding
        }
        
        sum += termVal;
        stepsArr.push({
            bitIndex: i,
            bitValue: bit,
            termStr,
            isZero: bit === '0'
        });
    }

    return { 
      steps: stepsArr.reverse(), // MSB to LSB for traditional written math display
      finalSum: sum.toString(2),
      finalSumDec: sum.toString(10)
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
             {t("simulator.arithmetic.multiplication.desc", "Binäre schriftliche Multiplikation (Shift and Add).")}
          </p>
        </div>

        <div className="space-y-4">
          <div className={locked ? "opacity-60" : ""}>
             <label className="block text-xs font-medium text-muted-foreground mb-1.5">Multiplikator (Zahl A)</label>
             <input
               type="text"
               value={valA}
               onChange={(e) => handleInputA(e.target.value)}
               readOnly={locked}
               className={`w-full bg-background transition-colors border rounded-md py-2 px-3 focus:outline-none font-mono tracking-widest text-sm text-foreground ${locked ? 'bg-muted border-input pointer-events-none' : 'border-input focus:border-primary focus:ring-1 focus:ring-primary/20'}`}
             />
          </div>
          <div className={locked ? "opacity-60" : ""}>
             <label className="block text-xs font-medium text-muted-foreground mb-1.5">Multiplikand (Zahl B)</label>
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

            {valA && valB ? (
                <div className="flex justify-center p-4 overflow-x-auto">
                  <div className="font-mono text-lg font-medium tracking-widest leading-loose select-none bg-background p-6 rounded-lg border border-border/40 shadow-inner min-w-fit">
                    
                    {/* Header: A * B */}
                    <div className="flex justify-end gap-2 border-b-2 border-foreground/30 pb-2 mb-2 whitespace-nowrap">
                       <span>{valA}</span>
                       <span className="text-primary mx-2">×</span>
                       <span>{valB}</span>
                    </div>

                    {/* Steps */}
                    <div className="flex flex-col items-end w-full">
                       {steps.map((step, idx) => (
                          <div key={idx} className={`flex items-center gap-4 w-full justify-end ${step.isZero ? 'opacity-30' : 'opacity-100'}`}>
                             {idx < steps.length - 1 && <span className="opacity-0">+</span>}
                             {idx === steps.length - 1 && <span className="text-primary">+</span>}
                             <span className="text-right">{step.termStr}</span>
                          </div>
                       ))}
                    </div>

                    {/* Result */}
                    <div className="flex justify-end gap-2 border-t-2 border-foreground/30 pt-2 mt-2">
                       <span className="text-primary font-bold">{finalSum}</span>
                    </div>
                    
                    <div className="text-right text-xs text-muted-foreground mt-4 font-sans tracking-normal">
                      In Dezimal: {parseInt(valA, 2)} × {parseInt(valB, 2)} = {finalSumDec}
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
