import { useState, useEffect, useMemo } from "react";
import { Info, LockKeyhole, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

type BaseType = "dec" | "bin" | "oct" | "hex";

interface IntegerConverterProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialValue?: string;
  initialBase?: BaseType;
}

export function IntegerConverter({ isExerciseMode, showSolution = true, onShowSolution, initialValue = "", initialBase = "dec" }: IntegerConverterProps) {
  const { t } = useTranslation("translation");
  const [sourceBase, setSourceBase] = useState<BaseType>("dec");
  const [targetBase, setTargetBase] = useState<BaseType>("bin");
  const [inputValue, setInputValue] = useState<string>("255");

  useEffect(() => {
    if (isExerciseMode && initialValue) {
      setSourceBase(initialBase);
      setInputValue(initialValue);
    }
  }, [isExerciseMode, initialValue, initialBase]);
  
  const handleInputChange = (v: string) => {
    if (isExerciseMode && !showSolution) return;
    setInputValue(v);
  };

  const decValue = useMemo(() => {
    if (!inputValue) return "";
    try {
      if (sourceBase === "dec") return /^[0-9]+$/.test(inputValue) ? BigInt(inputValue).toString(10) : "";
      if (sourceBase === "bin") return /^[01]+$/.test(inputValue) ? BigInt("0b" + inputValue).toString(10) : "";
      if (sourceBase === "oct") return /^[0-7]+$/.test(inputValue) ? BigInt("0o" + inputValue).toString(10) : "";
      if (sourceBase === "hex") return /^[0-9A-Fa-f]+$/.test(inputValue) ? BigInt("0x" + inputValue).toString(10) : "";
    } catch {
      return "";
    }
    return "";
  }, [inputValue, sourceBase]);

  const targetValue = useMemo(() => {
    if (!decValue) return "";
    try {
        const bigIntVal = BigInt(decValue);
        if (targetBase === "dec") return decValue;
        if (targetBase === "bin") return bigIntVal.toString(2);
        if (targetBase === "oct") return bigIntVal.toString(8);
        if (targetBase === "hex") return bigIntVal.toString(16).toUpperCase();
    } catch {
        return "";
    }
    return "";
  }, [decValue, targetBase]);

  const baseToNumber = (base: BaseType) => base === "dec" ? 10 : base === "bin" ? 2 : base === "oct" ? 8 : 16;
  const baseLabel = (base: BaseType) => {
     if (base === "dec") return t("simulator.numbers.decimal", "Dezimal (Basis 10)");
     if (base === "bin") return t("simulator.numbers.binary", "Binär (Basis 2)");
     if (base === "oct") return t("simulator.numbers.octal", "Oktal (Basis 8)");
     if (base === "hex") return t("simulator.numbers.hex", "Hexadezimal (Basis 16)");
     return "";
  }

  // Generate division steps for Dec -> Base
  const generateDivisionSteps = (targetVal: number) => {
    if (!decValue) return [];
    try {
      let currentVal = BigInt(decValue);
      const baseVal = BigInt(targetVal);
      const steps = [];
      
      if (currentVal === 0n) {
        return [{ value: 0n, remainder: 0n, base: targetVal }];
      }

      while (currentVal > 0n) {
        const remainder = currentVal % baseVal;
        const nextVal = currentVal / baseVal;
        steps.push({ value: currentVal, remainder, base: targetVal });
        currentVal = nextVal;
      }
      return steps;
    } catch {
      return [];
    }
  };
  
  const generatePowerSteps = (sourceVal: number, rawInput: string) => {
    if (!rawInput) return [];
    
    // valid input must be cleaned to parse correctly based on base:
    const cleanInput = sourceVal === 16 ? rawInput.toUpperCase() : rawInput;

    const steps = [];
    const len = cleanInput.length;
    for (let i = 0; i < len; i++) {
        const digitChar = cleanInput[i];
        const power = len - 1 - i;
        const digitVal = BigInt(parseInt(digitChar, sourceVal));
        const termVal = digitVal * (BigInt(sourceVal) ** BigInt(power));
        steps.push({ digit: digitChar, digitVal, power, base: sourceVal, termVal });
    }
    return steps;
  }

  const locked = !!isExerciseMode && !showSolution;
  const showToDecSteps = sourceBase !== "dec" && decValue !== "";
  const showFromDecSteps = targetBase !== "dec" && decValue !== "";

  const renderToDec = () => {
     const steps = generatePowerSteps(baseToNumber(sourceBase), inputValue);
     const isBin = sourceBase === "bin";

     return (
        <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
               {isBin ? t("simulator.numbers.binToDec", "Binär zu Dezimal (Summe der Potenzen)") : `${baseLabel(sourceBase)} ${t("simulator.numbers.toDec", "zu Dezimal")}`}
            </p>
            <p className="text-xs text-muted-foreground mb-2">
               {isBin ? t("simulator.numbers.binToDecDesc", "Jede Ziffer wird mit der entsprechenden Potenz der Basis 2 multipliziert und addiert.") : t("simulator.numbers.otherToDecDesc", "Die Konvertierung funktioniert analog mit der Summe der Potenzen zur Basis {{base}}.", { base: baseToNumber(sourceBase) })}
            </p>
            <div className="space-y-2 bg-background p-4 rounded-lg border border-border/40 font-mono text-sm overflow-x-auto shadow-inner whitespace-nowrap">
              {isBin && (
              <div className="flex gap-2 text-muted-foreground mb-2 pb-2 border-b border-border/40">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center min-w-[60px]">
                    <span className="text-xs">{baseToNumber(sourceBase)}<sup>{step.power}</sup></span>
                    <span className="font-bold text-foreground text-base mt-1">{step.digit}</span>
                  </div>
                ))}
              </div>
              )}
              
              <div className="text-foreground flex items-center flex-wrap gap-1 leading-8">
                  {steps.map((step, idx) => (
                  <span key={idx} className="flex items-center">
                    <span>({step.digitVal.toString()} × {baseToNumber(sourceBase)}<sup>{step.power}</sup>)</span>
                    {idx < steps.length - 1 && <span className="mx-2 text-muted-foreground">+</span>}
                  </span>
                ))}
              </div>
              <div className="text-foreground flex items-center flex-wrap gap-1 mt-2 leading-8">
                  <span className="w-[20px]">=</span>
                  {steps.map((step, idx) => (
                  <span key={idx} className="flex items-center">
                    <span>{step.termVal.toString()}</span>
                    {idx < steps.length - 1 && <span className="mx-2 text-muted-foreground">+</span>}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-start mt-4 text-sm font-semibold">
              <span className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-md">
                = {decValue}
              </span>
            </div>
        </div>
     );
  };

  const renderFromDec = () => {
     const steps = generateDivisionSteps(baseToNumber(targetBase));

     return (
        <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
               {targetBase === "bin" ? t("simulator.numbers.decToBin", "Dezimal zu Binär (Division durch 2)") : `Dezimal zu ${baseLabel(targetBase)}`}
            </p>
            <p className="text-xs text-muted-foreground mb-2">
               {targetBase === "bin" ? t("simulator.numbers.decToBinDesc", "Die Zahl wird fortlaufend durch die Basis 2 geteilt. Die Reste, von unten nach oben gelesen, ergeben die Binärzahl.") : `Die Zahl wird fortlaufend durch die Basis ${baseToNumber(targetBase)} geteilt. Die Reste, von unten nach oben gelesen, ergeben das Resultat.`}
            </p>
            <div className="space-y-2 bg-background p-4 rounded-lg border border-border/40 font-mono text-sm shadow-inner">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-[120px] text-right">{step.value.toString()} : {step.base}</div>
                  <div className="w-[20px] text-center">=</div>
                  <div className="w-[80px] text-right">{step.value / BigInt(step.base)}</div>
                  <div className="w-[85px] text-right text-muted-foreground whitespace-nowrap">{t("simulator.numbers.remainder", "Rest")}</div>
                  <div className="font-bold text-primary w-[20px] text-right">
                      {(targetBase === "hex" && step.remainder > 9n) ? step.remainder.toString(16).toUpperCase() : step.remainder.toString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-2 mt-4 text-sm font-semibold">
              <span className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-md">
                {t("simulator.numbers.result", "Ergebnis:")} <span className="tracking-widest">{targetValue}</span>
              </span>
            </div>
        </div>
     );
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Converter Inputs */}
        <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
             {t("simulator.numbers.converter", "Konverter")}
          </h3>
          <div className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t("simulator.numbers.fromBase", "Von System")}</label>
                  <select 
                     value={sourceBase} 
                     onChange={(e) => setSourceBase(e.target.value as BaseType)}
                     disabled={!!isExerciseMode && !showSolution}
                     className="w-full bg-background border border-input rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm text-foreground disabled:opacity-50"
                  >
                     <option value="dec">{t("simulator.numbers.decimal", "Dezimal (Basis 10)")}</option>
                     <option value="bin">{t("simulator.numbers.binary", "Binär (Basis 2)")}</option>
                     <option value="oct">{t("simulator.numbers.octal", "Oktal (Basis 8)")}</option>
                     <option value="hex">{t("simulator.numbers.hex", "Hexadezimal (Basis 16)")}</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t("simulator.numbers.toBase", "Nach System")}</label>
                  <select 
                     value={targetBase} 
                     onChange={(e) => setTargetBase(e.target.value as BaseType)}
                     disabled={!!isExerciseMode && !showSolution}
                     className="w-full bg-background border border-input rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm text-foreground disabled:opacity-50"
                  >
                     <option value="dec">{t("simulator.numbers.decimal", "Dezimal (Basis 10)")}</option>
                     <option value="bin">{t("simulator.numbers.binary", "Binär (Basis 2)")}</option>
                     <option value="oct">{t("simulator.numbers.octal", "Oktal (Basis 8)")}</option>
                     <option value="hex">{t("simulator.numbers.hex", "Hexadezimal (Basis 16)")}</option>
                  </select>
               </div>
            </div>

            <div className={locked ? "opacity-60" : ""}>
               <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t("simulator.numbers.valueLabel", "Eingabewert")}</label>
               <input
                 type="text"
                 value={locked && initialBase !== sourceBase ? "" : inputValue}
                 onChange={(e) => handleInputChange(e.target.value)}
                 readOnly={locked}
                 placeholder="..."
                 className={`w-full bg-background transition-colors border rounded-md py-2 px-3 focus:outline-none font-mono text-sm text-foreground placeholder:text-muted-foreground/50 ${locked ? 'bg-muted border-input pointer-events-none' : 'border-input focus:border-primary focus:ring-1 focus:ring-primary/20'}`}
               />
               {inputValue !== "" && decValue === "" && (
                 <p className="text-destructive text-xs mt-1">{t("simulator.numbers.invalidInputBase", "Ungültige Eingabe für die Basis")} {baseToNumber(sourceBase)}.</p>
               )}
            </div>
            
            <div className="pt-4 border-t border-border/40">
               <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t("simulator.numbers.resultLabel", "Ergebnis:")}</label>
               <div className="text-xl font-mono tracking-wider font-bold text-primary bg-primary/5 border border-primary/20 rounded-md py-3 px-4 shadow-inner break-all min-h-[54px] flex items-center">
                  {!locked && decValue !== "" ? targetValue : (locked ? "--------" : "")}
               </div>
            </div>

          </div>
        </div>

        {/* Dynamic Explanation Panel */}
        <div className="bg-muted/30 border border-border/50 rounded-xl p-6 shadow-sm overflow-auto max-h-[500px]">
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
            <>
              <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                {t("simulator.numbers.explanation", "Erklärungsmodus")}
              </h3>
              
              {!decValue ? (
                <p className="text-muted-foreground text-sm">{t("simulator.numbers.enterValue", "Geben Sie eine Zahl ein, um den Rechenweg zu sehen.")}</p>
              ) : sourceBase === targetBase ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                   <ArrowRight className="w-8 h-8 opacity-20 mb-2" />
                   <p className="text-sm">{t("simulator.numbers.sameBase", "Die Eingabe- und Zielbasis sind identisch.")}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {showToDecSteps && showFromDecSteps && (
                     <div className="bg-popover/50 border-l-4 border-primary p-3 text-sm text-muted-foreground rounded-r-md">
                        {t("simulator.numbers.nonDecConvHint", "Die Konvertierung zwischen zwei nicht-dezimalen Systemen erfolgt am einfachsten über den Zwischenschritt der Umrechnung zum Dezimalsystem.")}
                     </div>
                  )}

                  {showToDecSteps && (
                    <div>
                      {showFromDecSteps && <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b border-border/50 pb-2">{t("simulator.numbers.step1TempDec", "Schritt 1: Zu Dezimal konvertieren")}</h4>}
                      {renderToDec()}
                    </div>
                  )}

                  {showToDecSteps && showFromDecSteps && <div className="h-px bg-border/50 my-6" />}

                  {showFromDecSteps && (
                    <div>
                      {showToDecSteps && <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b border-border/50 pb-2">{t("simulator.numbers.step2TempTarget", "Schritt 2: In das Zielsystem konvertieren")}</h4>}
                      {renderFromDec()}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
