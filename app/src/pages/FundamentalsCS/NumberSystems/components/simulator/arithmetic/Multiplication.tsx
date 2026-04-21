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

export function Multiplication({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
  initialA,
  initialB,
}: MultiplicationProps) {
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
    const reversedB = valB.split("").reverse().join("");

    for (let i = 0; i < reversedB.length; i++) {
      const bit = reversedB[i];
      let termStr = "";
      let termVal = 0n;

      if (bit === "1") {
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
        isZero: bit === "0",
      });
    }

    return {
      steps: stepsArr.reverse(), // MSB to LSB for traditional written math display
      finalSum: sum.toString(2),
      finalSumDec: sum.toString(10),
    };
  }, [valA, valB]);

  return (
    <div className="animate-in fade-in zoom-in-95 grid w-full grid-cols-1 gap-6 duration-300 md:grid-cols-2">
      {/* Inputs */}
      <div className="bg-card border-border/50 space-y-6 rounded-xl border p-6 shadow-sm">
        <div>
          <h3 className="text-foreground mb-2 flex items-center gap-2 text-lg font-semibold">
            Operanden
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">
            {t(
              "simulator.arithmetic.multiplication.desc",
              "Binäre schriftliche Multiplikation (Shift and Add).",
            )}
          </p>
        </div>

        <div className="space-y-4">
          <div className={locked ? "opacity-60" : ""}>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              {t(
                "simulator.arithmetic.multiplication.multiplier",
                "Multiplikator (Zahl A)",
              )}
            </label>
            <input
              type="text"
              value={valA}
              onChange={(e) => handleInputA(e.target.value)}
              readOnly={locked}
              className={`bg-background text-foreground w-full rounded-md border px-3 py-2 font-mono text-sm tracking-widest transition-colors focus:outline-none ${locked ? "bg-muted border-input pointer-events-none" : "border-input focus:border-primary focus:ring-primary/20 focus:ring-1"}`}
            />
          </div>
          <div className={locked ? "opacity-60" : ""}>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              {t(
                "simulator.arithmetic.multiplication.multiplicand",
                "Multiplikand (Zahl B)",
              )}
            </label>
            <input
              type="text"
              value={valB}
              onChange={(e) => handleInputB(e.target.value)}
              readOnly={locked}
              className={`bg-background text-foreground w-full rounded-md border px-3 py-2 font-mono text-sm tracking-widest transition-colors focus:outline-none ${locked ? "bg-muted border-input pointer-events-none" : "border-input focus:border-primary focus:ring-primary/20 focus:ring-1"}`}
            />
          </div>
        </div>
      </div>

      {/* Logic / Dashboard Panel */}
      <div className="bg-muted/30 border-border/50 overflow-auto rounded-xl border p-6 shadow-sm">
        {locked ? (
          <div className="flex h-full flex-col items-center justify-center space-y-4 py-12 text-center">
            <LockKeyhole className="text-muted-foreground h-12 w-12 opacity-50" />
            <div>
              <p className="text-foreground mb-1 font-medium">
                {t("simulator.numbers.lockedTitle", "Lösung gesperrt")}
              </p>
              <p className="text-muted-foreground mb-4 text-sm">
                {t(
                  "simulator.numbers.lockedDesc",
                  "Klicke auf den Button, um das Ergebnis und den Rechenweg anzuzeigen.",
                )}
              </p>
            </div>
            <button
              onClick={onShowSolution}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md px-4 py-2 font-medium shadow-sm transition-colors"
            >
              {t("simulator.numbers.showSolution", "Lösung anzeigen")}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
              <Info className="text-primary h-5 w-5" />
              Rechenweg & Ergebnis
            </h3>

            {valA && valB ? (
              <div className="flex justify-center overflow-x-auto p-4">
                <div className="bg-background border-border/40 min-w-fit rounded-lg border p-6 font-mono text-lg leading-loose font-medium tracking-widest shadow-inner select-none">
                  {/* Header: A * B */}
                  <div className="border-foreground/30 mb-2 flex justify-end gap-2 border-b-2 pb-2 whitespace-nowrap">
                    <span>{valA}</span>
                    <span className="text-primary mx-2">×</span>
                    <span>{valB}</span>
                  </div>

                  {/* Steps */}
                  <div className="flex w-full flex-col items-end">
                    {steps.map((step, idx) => (
                      <div
                        key={idx}
                        className={`flex w-full items-center justify-end gap-4 ${step.isZero ? "opacity-30" : "opacity-100"}`}
                      >
                        {idx < steps.length - 1 && (
                          <span className="opacity-0">+</span>
                        )}
                        {idx === steps.length - 1 && (
                          <span className="text-primary">+</span>
                        )}
                        <span className="text-right">{step.termStr}</span>
                      </div>
                    ))}
                  </div>

                  {/* Result */}
                  <div className="border-foreground/30 mt-2 flex justify-end gap-2 border-t-2 pt-2">
                    <span className="text-primary font-bold">{finalSum}</span>
                  </div>

                  <div className="text-muted-foreground mt-4 text-right font-sans text-xs tracking-normal">
                    In Dezimal: {parseInt(valA, 2)} × {parseInt(valB, 2)} ={" "}
                    {finalSumDec}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {t(
                  "simulator.arithmetic.common.enterValidOperands",
                  "Bitte gebe gültige Operanden ein.",
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
