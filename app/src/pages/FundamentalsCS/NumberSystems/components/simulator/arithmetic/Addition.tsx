import { useState, useMemo } from "react";
import { Info, LockKeyhole, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AdditionProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialA?: string;
  initialB?: string;
}

export function Addition({ isExerciseMode, showSolution = true, onShowSolution, initialA, initialB }: AdditionProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "01100101");
  const [valB, setValB] = useState(initialB || "00111100");

  const locked = !!isExerciseMode && !showSolution;

  const handleInputA = (val: string) => {
    if (locked) return;
    setValA(val.replace(/[^01]/g, "").slice(0, 8));
  };
  const handleInputB = (val: string) => {
    if (locked) return;
    setValB(val.replace(/[^01]/g, "").slice(0, 8));
  };

  const { padA, padB, sum, carries, overflow, carryOut } = useMemo(() => {
    const padA = valA.padStart(8, '0');
    const padB = valB.padStart(8, '0');
    
    const carriesArr = Array(9).fill(0); // index 0 is C_0, index 8 is C_8
    const sumArr = Array(8).fill(0);
    
    for (let i = 7; i >= 0; i--) {
        const bitA = parseInt(padA[i] || '0');
        const bitB = parseInt(padB[i] || '0');
        const cIn = carriesArr[7 - i]; 
        const s = bitA + bitB + cIn;
        sumArr[i] = s % 2;
        carriesArr[7 - i + 1] = Math.floor(s / 2);
    }
    
    // carriesArr[8] represents Carry Out
    // Overflow in 2s comp: C_in to MSB != C_out of MSB -> carriesArr[7] !== carriesArr[8]
    const overflow = carriesArr[7] !== carriesArr[8];
    const carryOut = carriesArr[8] === 1;

    // We want the visual carry string to map left-to-right (C_8 ... C_1). C_0 isn't displayed above digits usually, or sometimes it is.
    // Let's create an array of 9 visible carry bits: [C8, C7, C6, C5, C4, C3, C2, C1, C0]
    const visCarries = [...carriesArr].reverse();

    return { 
      padA, 
      padB, 
      sum: sumArr.join(""), 
      carries: visCarries, 
      overflow, 
      carryOut 
    };
  }, [valA, valB]);

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

            {/* Math Grid */}
            <div className="flex justify-center p-4">
              <div className="font-mono text-lg md:text-xl font-medium tracking-widest leading-loose select-none bg-background p-6 rounded-lg border border-border/40 shadow-inner">
                {/* Carries */}
                <div className="text-destructive text-sm flex gap-2">
                  <span className="w-4" /> {/* For the plus sign col */}
                  <span className="w-4 mr-2" /> {/* Gap for layout */}
                  {carries.slice(0, 8).map((c, i) => (
                    <span key={i} className={`w-4 text-center ${c ? 'opacity-100 font-bold' : 'opacity-20'}`}>{c}</span>
                  ))}
                  {/* We don't render C0 visually above the ones place usually unless we want to show it. It's implicitly 0. */}
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
                    <strong className="block mb-1">Carry Out:</strong> 
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
