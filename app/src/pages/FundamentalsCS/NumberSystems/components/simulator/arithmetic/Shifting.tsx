import { useState, useMemo } from "react";
import { Info, LockKeyhole, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ShiftingProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialA?: string;
}

export function Shifting({ isExerciseMode, showSolution = true, onShowSolution, initialA }: ShiftingProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "1101");
  const [shiftAmount, setShiftAmount] = useState<number>(2);
  const [direction, setDirection] = useState<"left" | "right">("left");

  const locked = !!isExerciseMode && !showSolution;

  const handleInputA = (val: string) => {
    if (locked) return;
    setValA(val.replace(/[^01]/g, "").slice(0, 16));
  };

  const { resultStr, decimalBefore, decimalAfter, explanation } = useMemo(() => {
    if (!valA) return { resultStr: "", decimalBefore: 0, decimalAfter: 0, explanation: "" };
    
    const beforeDec = parseInt(valA, 2);
    let afterDec = 0;
    let resStr = "";
    let expl = "";

    if (direction === "left") {
        resStr = valA + "0".repeat(shiftAmount);
        afterDec = beforeDec * Math.pow(2, shiftAmount);
        expl = t("simulator.arithmetic.shifting.shiftLeftExpl", "Ein Linksshift um n Stellen entspricht einer Multiplikation mit 2^n.");
    } else {
        if (shiftAmount >= valA.length) {
            resStr = "0";
        } else {
            resStr = valA.slice(0, valA.length - shiftAmount);
        }
        afterDec = Math.floor(beforeDec / Math.pow(2, shiftAmount));
        expl = t("simulator.arithmetic.shifting.shiftRightExpl", "Ein Rechtsshift um n Stellen entspricht einer Division durch 2^n (ohne Rest).");
    }

    return { resultStr: resStr || "0", decimalBefore: beforeDec, decimalAfter: afterDec, explanation: expl };
  }, [valA, shiftAmount, direction, t]);

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
             <label className="block text-xs font-medium text-muted-foreground mb-1.5">Binärzahl</label>
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
               <label className="block text-xs font-medium text-muted-foreground mb-1.5">Richtung</label>
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
                       <strong className="block mb-1">Mathematische Bedeutung:</strong>
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
                <p className="text-sm text-muted-foreground text-center py-4">Bitte gebe eine Binärzahl ein.</p>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
