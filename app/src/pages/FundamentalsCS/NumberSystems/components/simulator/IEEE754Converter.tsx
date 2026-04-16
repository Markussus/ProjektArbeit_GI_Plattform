import { useState, useEffect } from "react";
import { Info, AlertTriangle, LockKeyhole } from "lucide-react";
import { useTranslation } from "react-i18next";

interface IEEE754ConverterProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialValue?: string;
}

export function IEEE754Converter({ isExerciseMode, showSolution = true, onShowSolution, initialValue = "" }: IEEE754ConverterProps) {
  const { t } = useTranslation("translation");
  const [inputValue, setInputValue] = useState<string>("12.5");
  const [converterMode, setConverterMode] = useState<"decToIeee" | "ieeeToDec">("decToIeee");

  useEffect(() => {
    if (isExerciseMode && initialValue) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputValue(initialValue);
    }
  }, [isExerciseMode, initialValue]);

  // PARSE LOGIC
  const cleanBinary = inputValue.replace(/[^01]/g, "");
  const isIeeeToDecValid = converterMode === "ieeeToDec" && cleanBinary.length === 32;

  let isValid: boolean;
  let floatVal = 0;
  let isNaNVal = false;
  let isSpecial = false;

  let sign = "0";
  let exponent = "00000000";
  let mantissa = "00000000000000000000000";
  let expVal = 0;

  if (converterMode === "decToIeee") {
    floatVal = parseFloat(inputValue.replace(",", "."));
    isValid = inputValue.trim() !== "" && !isNaN(floatVal) && inputValue.toLowerCase() !== "nan";
    isNaNVal = inputValue.toLowerCase() === "nan" || (inputValue.trim() !== "" && isNaN(floatVal) && !isValid);
    isSpecial = isValid && (!isFinite(floatVal) || floatVal === 0);

    if (isValid) {
      const buffer = new ArrayBuffer(4);
      const floatView = new Float32Array(buffer);
      const intView = new Uint32Array(buffer);

      floatView[0] = floatVal;
      const bits = intView[0].toString(2).padStart(32, "0");

      sign = bits[0];
      exponent = bits.slice(1, 9);
      mantissa = bits.slice(9);
      expVal = parseInt(exponent, 2);
    }
  } else {
    isValid = isIeeeToDecValid;
    if (isValid) {
      sign = cleanBinary[0];
      exponent = cleanBinary.slice(1, 9);
      mantissa = cleanBinary.slice(9);
      expVal = parseInt(exponent, 2);

      const buffer = new ArrayBuffer(4);
      const floatView = new Float32Array(buffer);
      const intView = new Uint32Array(buffer);

      intView[0] = parseInt(cleanBinary, 2);
      floatVal = floatView[0];

      isNaNVal = isNaN(floatVal);
      isSpecial = !isFinite(floatVal) || floatVal === 0;
    }
  }

  const isZero = isValid && floatVal === 0;
  const isInf = isValid && !isFinite(floatVal) && !isNaNVal;
  const locked = !!isExerciseMode && !showSolution;

  // Fraction Math for Explanation
  let sumOfFractions = 0;
  const fractionSteps: number[] = [];
  if (converterMode === "ieeeToDec" && isValid && !isSpecial && !isNaNVal) {
    for (let i = 0; i < mantissa.length; i++) {
        if (mantissa[i] === "1") {
            const pow = Math.pow(2, -(i+1));
            sumOfFractions += pow;
            fractionSteps.push(i+1);
        }
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Converter Inputs */}
        <div className="flex flex-col gap-6">
          <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h3 className="text-lg font-semibold text-foreground">{t("simulator.numbers.ieeeTitle", "IEEE 754 (Single Precision, 32-bit)")}</h3>

                <div className="flex bg-muted p-1 rounded-md mb-2 sm:mb-0 shrink-0">
                    <button
                        onClick={() => { setConverterMode("decToIeee"); setInputValue("12.5"); }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${converterMode === "decToIeee" ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t("simulator.numbers.modeDecToIeee", "Dezimal zu IEEE")}
                    </button>
                    <button
                        onClick={() => { setConverterMode("ieeeToDec"); setInputValue("0 10000010 10010000000000000000000"); }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${converterMode === "ieeeToDec" ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t("simulator.numbers.modeIeeeToDec", "IEEE zu Dezimal")}
                    </button>
                </div>
            </div>

            <div className="space-y-6">
              <div className={locked ? "opacity-60" : ""}>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                   {converterMode === "decToIeee" ? t("simulator.numbers.decInputFloat", "Dezimalzahl (z.B. 12.5, Infinity, -0)") : t("simulator.numbers.ieeeInputFormat", "32-Bit Binärstring (0en und 1en)")}
                </label>
                <div className={`relative flex items-center bg-background border ${locked ? 'border-input bg-muted pointer-events-none' : 'border-input focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20'} rounded-md overflow-hidden`}>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    readOnly={locked}
                    className="w-full bg-transparent border-none py-2 px-3 focus:outline-none font-mono text-sm text-foreground"
                    placeholder={converterMode === "decToIeee" ? "12.5" : "01000001010010000000000000000000"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                 <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
                    {converterMode === "decToIeee" ? t("simulator.numbers.resultUpper", "ERGEBNIS") : t("simulator.numbers.decResultUpper", "DEZIMALWERT")}
                 </div>

                 {converterMode === "decToIeee" ? (
                     // DEC TO IEEE RESULT BLOCKS
                     !locked && (isValid || isNaNVal) ? (
                       <div className="flex bg-background border border-border/40 rounded-lg overflow-hidden shrink-0">
                          <div className="flex flex-col items-center bg-blue-500/10 px-3 py-3 border-r border-border/40">
                             <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mb-1">SIGN</span>
                             <span className="font-mono text-blue-700 dark:text-blue-300">{isNaNVal ? "0" : sign}</span>
                          </div>
                          <div className="flex flex-col items-center bg-green-500/10 px-3 py-3 border-r border-border/40">
                             <span className="text-[10px] text-green-600 dark:text-green-400 font-bold mb-1">EXPONENT</span>
                             <span className="font-mono text-green-700 dark:text-green-300 tracking-widest">{isNaNVal ? "11111111" : exponent}</span>
                          </div>
                          <div className="flex flex-col items-center bg-orange-500/10 px-3 py-3 flex-1 overflow-hidden">
                             <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold mb-1">MANTISSA</span>
                             <span className="font-mono text-orange-700 dark:text-orange-300 tracking-widest truncate w-full text-center">{isNaNVal ? "10000000000000000000000".slice(0, 23) : mantissa}</span>
                          </div>
                       </div>
                     ) : (
                       <div className="text-muted-foreground text-sm py-4">{locked ? "--------" : t("simulator.numbers.enterValidNumber", "Bitte eine gültige Zahl eingeben.")}</div>
                     )
                 ) : (
                     // IEEE TO DEC RESULT DISPLAY
                     !locked && isValid ? (
                       <div className="flex items-center justify-center bg-background border border-border/40 rounded-lg overflow-hidden p-6 font-mono text-2xl font-bold tracking-wider">
                           {isNaNVal ? "NaN" : Object.is(floatVal, -0) ? "-0" : floatVal}
                       </div>
                     ) : (
                       <div className="text-muted-foreground text-sm py-4">{locked ? "--------" : t("simulator.numbers.enterValid32Bit", "Bitte genau 32 Bits (0 oder 1) eingeben.")}</div>
                     )
                 )}
              </div>
            </div>
          </div>

          {!locked && (isZero || isInf || isNaNVal) && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold mb-2 text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  {t("simulator.numbers.specialCase", "Sonderfall / Special Case")}
                </h3>
                <div className="text-sm text-amber-800 dark:text-amber-300/80">
                  {isZero && <p><strong>{t("simulator.numbers.zero", "Null (Zero):")}</strong> {t("simulator.numbers.zeroDesc", "Exponent und Mantisse sind logisch 0. Es gibt eine +0 und -0, je nach Vorzeichen-Bit.")}</p>}
                  {isInf && <p><strong>{t("simulator.numbers.infinity", "Unendlich (Infinity):")}</strong> {t("simulator.numbers.infDesc", "Exponent besteht nur aus Einsen (255), Mantisse ist 0. Vorzeichen entscheidet über +Inf oder -Inf.")}</p>}
                  {isNaNVal && <p><strong>{t("simulator.numbers.nan", "Not a Number (NaN):")}</strong> {t("simulator.numbers.nanDesc", "Exponent besteht nur aus Einsen (255), Mantisse ist ungleich 0. Repräsentiert ungültige Operationen wie 0/0.")}</p>}
                </div>
            </div>
          )}

        </div>

        {/* Dynamic Explanation Panel */}
        <div className="bg-muted/30 border border-border/50 rounded-xl p-6 shadow-sm overflow-auto max-h-200 xl:max-h-150">
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
                {t("simulator.numbers.conceptPath", "Rechenweg & Konzept")}
              </h3>

              {(!isValid && !isNaNVal) ? (
                <p className="text-muted-foreground text-sm">{t("simulator.numbers.enterValueForExp", "Gültige Zahl eingeben für Erklärung.")}</p>
              ) : isSpecial || isNaNVal ? (
                 <p className="text-muted-foreground text-sm">{t("simulator.numbers.specialCaseNoMath", "Für Sonderfälle gibt es keinen regulären Rechenweg durch Normierung. Die Repräsentation ist im Standard fest definiert (siehe Sonderfall-Box links).")}</p>
              ) : converterMode === "decToIeee" ? (
                // EXISTING DEC TO IEEE EXPLANATION
                <div className="space-y-6">

                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">{t("simulator.numbers.step1Sign", "1. Vorzeichen (Sign)")}</div>
                    <div className="bg-background p-4 rounded-lg border border-blue-500/20 shadow-inner flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("simulator.numbers.isNegative", "Ist die Zahl negativ?")} {floatVal < 0 ? t("simulator.numbers.yes", "Ja") : t("simulator.numbers.no", "Nein")}</span>
                      <span className="text-xl font-mono font-bold text-blue-600 dark:text-blue-400">{sign}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 mt-4">{t("simulator.numbers.step2Norm", "2. Binäre Basis-Konvertierung & Normierung")}</div>
                    <div className="bg-background p-4 rounded-lg border border-border/40 shadow-inner text-sm space-y-2 text-muted-foreground">
                      <p>{t("simulator.numbers.normDesc", "Umwandlung der Zahl in Binärform und Verschiebung des Kommas, bis genau eine 1 vor dem Komma steht.")}</p>
                      <div className="bg-muted/50 p-2 rounded border border-border/40 mt-2 font-mono text-center text-foreground">
                        X.X &rarr; <span className="text-primary font-bold">1</span>.XXX &times; 2<sup className="text-green-600 dark:text-green-400 text-[10px]">Y</sup>
                      </div>
                      <p className="text-xs mt-2 text-primary font-medium border-l-2 border-primary pl-2">{t("simulator.numbers.normSubDesc", "Das Komma wurde so verschoben, dass der Exponent y = {{val}} beträgt.", { val: expVal - 127 })}</p>
                    </div>
                  </div>

                  <div className="space-y-1 mt-4">
                     <div className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-2">{t("simulator.numbers.step3Exp", "3. Exponent (Bias)")}</div>
                     <div className="bg-background p-4 rounded-lg border border-green-500/20 shadow-inner space-y-2 text-sm text-muted-foreground">
                       <p>{t("simulator.numbers.biasDesc", "Der IEEE 754 Standard fügt einen Bias von 127 zum tatsächlichen Exponenten hinzu, um negative Exponenten ohne Vorzeichen speichern zu können.")}</p>
                       <div className="flex items-center gap-4 bg-muted/50 p-2 rounded justify-center font-mono">
                          <span>{expVal - 127}</span>
                          <span>+</span>
                          <span>127</span>
                          <span>=</span>
                          <span className="font-bold text-foreground">{expVal}</span>
                       </div>
                       <p className="text-center">{t("simulator.numbers.binaryMode", "Binär:")} <strong className="text-green-600 dark:text-green-400 tracking-widest">{exponent}</strong></p>
                     </div>
                  </div>

                  <div className="space-y-1 mt-4">
                     <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-2">{t("simulator.numbers.step4Mantissa", "4. Mantisse & Hidden Bit")}</div>
                     <div className="bg-background p-4 rounded-lg border border-orange-500/20 shadow-inner space-y-2 text-sm text-muted-foreground">
                       <p>{t("simulator.numbers.mantissaDesc", "Die Mantisse speichert die Nachkommastellen nach der Normierung.")}</p>
                       <p className="border-l-2 border-orange-500/50 pl-2 text-xs"><strong>{t("simulator.numbers.hiddenBitTitle", "Das Hidden Bit:")}</strong> {t("simulator.numbers.hiddenBitDesc", "Da durch die Normierung immer eine 1 vor dem Komma steht (außer bei 0), wird diese 1 nicht abgespeichert, um 1 Bit Platz zu sparen.")}</p>
                       <p className="text-center break-all text-orange-600 dark:text-orange-400 font-mono tracking-widest bg-muted/50 p-2 rounded mt-2">{mantissa}</p>
                     </div>
                  </div>

                </div>
              ) : (
                // NEW IEEE TO DEC EXPLANATION
                <div className="space-y-6">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">{t("simulator.numbers.step1Sign", "1. Vorzeichen (Sign)")}</div>
                    <div className="bg-background p-4 rounded-lg border border-blue-500/20 shadow-inner flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("simulator.numbers.isNegative", "Ist die Zahl negativ?")} {sign === "1" ? t("simulator.numbers.yes", "Ja") : t("simulator.numbers.no", "Nein")}</span>
                      <span className="text-xl font-mono font-bold text-blue-600 dark:text-blue-400">{sign}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                     <div className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-2 mt-4">{t("simulator.numbers.step2ExpExtract", "2. Exponenten-Wert extrahieren")}</div>
                     <div className="bg-background p-4 rounded-lg border border-green-500/20 shadow-inner text-sm text-muted-foreground">
                       <p>{t("simulator.numbers.expBinToDecDesc", "Der 8-Bit Exponent wird als positive ganze Zahl (Unsigned) gelesen und die Bias (127) abgezogen:")}</p>
                       <div className="bg-muted/50 p-2 rounded justify-center font-mono text-center flex flex-col gap-2 mt-2">
                          <span className="font-bold text-green-600 dark:text-green-400 tracking-widest">{exponent}₂</span>
                          <span>&darr;</span>
                          <div className="flex items-center justify-center gap-4">
                              <span>{expVal}</span><span>-</span><span>127</span><span>=</span><span className="font-bold text-foreground">{expVal - 127}</span>
                          </div>
                       </div>
                     </div>
                  </div>

                  <div className="space-y-1">
                     <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-2 mt-4">{t("simulator.numbers.step3MantExtract", "3. Mantisse (Nachkommastellen) auflösen")}</div>
                     <div className="bg-background p-4 rounded-lg border border-orange-500/20 shadow-inner space-y-2 text-sm text-muted-foreground">
                       <p>{t("simulator.numbers.mantissaBinToDecDesc", "Der reale Mantissen-Wert errechnet sich aus dem impliziten 'Hidden Bit' (1 + Bruchwert). Jedes Bit n nach dem Komma wird mit 2^(-n) multipliziert:")}</p>
                       <div className="text-center font-mono tracking-widest text-orange-600 dark:text-orange-400 bg-muted/50 p-2 rounded mt-2 truncate w-full">
                           1.{mantissa}
                       </div>

                       {fractionSteps.length > 0 && (
                          <div className="text-xs flex flex-wrap gap-2 items-center justify-center pt-2">
                             <span>= 1 + (</span>
                             {fractionSteps.map((powValue, idx) => (
                                <span key={idx} className="flex gap-2">
                                  <span>2<sup>-{powValue}</sup></span>
                                  {idx < fractionSteps.length - 1 && "+"}
                                </span>
                             ))}
                             <span>)</span>
                          </div>
                       )}

                       <div className="flex justify-center flex-col items-center gap-1 border-t border-border/40 pt-2 mt-2">
                          <span className="text-xs">{t("simulator.numbers.fractionSum", "Summe der gebrochenen Potenzen")}: {sumOfFractions}</span>
                          <span className="font-bold text-foreground">= 1.0 + {sumOfFractions} = {1 + sumOfFractions}</span>
                       </div>
                     </div>
                  </div>

                  <div className="space-y-1 mt-4">
                     <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">{t("simulator.numbers.step4FinalCalc", "4. Finale Verrechnung aller Komponenten")}</div>
                     <div className="bg-background p-4 rounded-lg border border-primary/20 shadow-inner space-y-2 text-sm text-muted-foreground">
                       <p>{t("simulator.numbers.finalFormulaDesc", "Für die finale Dezimalzahl werden Vorzeichen, echte Mantisse und der Faktor aus Exponent multipliziert:")}</p>
                       <div className="flex items-center gap-4 bg-muted/50 p-3 rounded justify-center font-mono mt-2 flex-wrap">
                          <span>(-1)<sup className="text-blue-600 dark:text-blue-400">{sign}</sup></span>
                          <span>&times;</span>
                          <span className="text-orange-600 dark:text-orange-400">{1 + sumOfFractions}</span>
                          <span>&times;</span>
                          <span>2<sup className="text-green-600 dark:text-green-400">{expVal - 127}</sup></span>
                          <span>=</span>
                          <span className="font-bold text-foreground px-2 py-1 bg-primary/10 rounded">{floatVal}</span>
                       </div>
                     </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
