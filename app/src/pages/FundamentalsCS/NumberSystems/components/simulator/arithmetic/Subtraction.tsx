import { useState, useMemo } from "react";
import { Info, LockKeyhole, ArrowRight, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SubtractionProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialA?: string;
  initialB?: string;
}

export function Subtraction({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
  initialA,
  initialB,
}: SubtractionProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "00101010"); // 42
  const [valB, setValB] = useState(initialB || "00001010"); // 10

  const locked = !!isExerciseMode && !showSolution;

  const handleInputA = (val: string) => {
    if (locked) return;
    setValA(val.replace(/[^01]/g, "").slice(0, 8));
  };
  const handleInputB = (val: string) => {
    if (locked) return;
    setValB(val.replace(/[^01]/g, "").slice(0, 8));
  };

  const { padA, padB, onesComp, twosComp, sum, carries, overflow, carryOut } =
    useMemo(() => {
      const padA = valA.padStart(8, "0");
      const padB = valB.padStart(8, "0");

      // Ones complement
      const onesComp = padB
        .split("")
        .map((b) => (b === "1" ? "0" : "1"))
        .join("");

      // Twos complement (+1)
      const twosCompArr = Array(8).fill(0);
      let c = 1; // add 1
      for (let i = 7; i >= 0; i--) {
        const bit = parseInt(onesComp[i]);
        const s = bit + c;
        twosCompArr[i] = s % 2;
        c = Math.floor(s / 2);
      }
      const twosComp = twosCompArr.join("");

      // Addition: A + twosComp
      const carriesArr = Array(9).fill(0);
      const sumArr = Array(8).fill(0);

      for (let i = 7; i >= 0; i--) {
        const bitA = parseInt(padA[i] || "0");
        const bitB = parseInt(twosComp[i] || "0");
        const cIn = carriesArr[7 - i];
        const s = bitA + bitB + cIn;
        sumArr[i] = s % 2;
        carriesArr[7 - i + 1] = Math.floor(s / 2);
      }

      const overflow = carriesArr[7] !== carriesArr[8];
      const carryOut = carriesArr[8] === 1;

      const visCarries = [...carriesArr].reverse();

      return {
        padA,
        padB,
        onesComp,
        twosComp,
        sum: sumArr.join(""),
        carries: visCarries,
        overflow,
        carryOut,
      };
    }, [valA, valB]);

  return (
    <div className="animate-in fade-in zoom-in-95 grid w-full grid-cols-1 gap-6 duration-300 md:grid-cols-2">
      {/* Inputs */}
      <div className="bg-card border-border/50 space-y-6 rounded-xl border p-6 shadow-sm">
        <div>
          <h3 className="text-foreground mb-2 flex items-center gap-2 text-lg font-semibold">
            {t(
              "simulator.arithmetic.common.operands8bit",
              "Operanden (max 8-Bit)",
            )}
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">
            {t(
              "simulator.arithmetic.subtraction.desc",
              "Die binäre Subtraktion wird üblicherweise als Addition mit der negativen Zahl (im Zweierkomplement) ausgeführt.",
            )}
          </p>
        </div>

        <div className="space-y-4">
          <div className={locked ? "opacity-60" : ""}>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              {t(
                "simulator.arithmetic.subtraction.minuend",
                "Minuend (Zahl A)",
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
                "simulator.arithmetic.subtraction.subtrahend",
                "Subtrahend (Zahl B, die abgezogen wird)",
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
              {t(
                "simulator.arithmetic.common.stepsResult",
                "Rechenweg & Ergebnis",
              )}
            </h3>

            {/* Twos Comp Steps */}
            <div className="bg-background border-border/40 space-y-4 rounded-lg border p-4 font-mono text-sm tracking-widest shadow-inner">
              <div className="space-y-1">
                <p className="text-muted-foreground font-sans text-xs font-bold tracking-normal uppercase">
                  {t(
                    "simulator.arithmetic.subtraction.step1",
                    "1. Einerkomplement bilden",
                  )}
                </p>
                <div className="flex gap-4">
                  <span className="opacity-50">{padB}</span>
                  <ArrowRight className="h-4 w-4 opacity-50" />
                  <span className="text-destructive font-semibold">
                    {onesComp}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground mt-2 font-sans text-xs font-bold tracking-normal uppercase">
                  {t(
                    "simulator.arithmetic.subtraction.step2",
                    "2. +1 addieren (Zweierkomplement)",
                  )}
                </p>
                <div className="flex gap-4">
                  <span className="text-destructive opacity-50">
                    {onesComp}
                  </span>
                  <span className="text-primary opacity-50">+ 00000001</span>
                  <ArrowRight className="h-4 w-4 opacity-50" />
                  <span className="text-primary font-bold">{twosComp}</span>
                </div>
              </div>
            </div>

            {/* Addition Grid */}
            <p className="text-muted-foreground border-border/50 mt-6 border-b pb-2 font-sans text-xs font-bold tracking-normal uppercase">
              {t(
                "simulator.arithmetic.subtraction.step3",
                "3. Addiere das Zweierkomplement zur Zahl A",
              )}
            </p>

            <div className="flex justify-center p-4">
              <div className="bg-background border-border/40 rounded-lg border p-6 font-mono text-lg leading-loose font-medium tracking-widest shadow-inner select-none md:text-xl">
                {/* Carries */}
                <div className="text-destructive flex gap-2 text-sm">
                  <span className="w-4" />
                  <span className="mr-2 w-4" />
                  {carries.slice(0, 8).map((c, i) => (
                    <span
                      key={i}
                      className={`w-4 text-center ${c ? "font-bold opacity-100" : "opacity-20"}`}
                    >
                      {c}
                    </span>
                  ))}
                </div>

                {/* Pad A */}
                <div className="flex gap-2">
                  <span className="w-4 text-center" />
                  <span className="mr-2 w-4 text-center" />
                  {padA.split("").map((b, i) => (
                    <span key={`a-${i}`} className="w-4 text-center">
                      {b}
                    </span>
                  ))}
                </div>

                {/* Twos Comp of B */}
                <div className="border-foreground/30 mb-2 flex gap-2 border-b-2 pb-2">
                  <span className="text-primary mr-2 w-4 text-center">+</span>
                  <span className="w-4 text-center" />
                  {twosComp.split("").map((b, i) => (
                    <span key={`b-${i}`} className="w-4 text-center">
                      {b}
                    </span>
                  ))}
                </div>

                {/* Subtraction Sum */}
                <div className="flex gap-2">
                  <span className="w-4 text-center" />
                  <span
                    className={`mr-2 w-4 text-center ${carryOut ? "text-destructive font-bold" : "text-muted-foreground opacity-20"}`}
                  >
                    {carries[0]}
                  </span>
                  {sum.split("").map((b, i) => (
                    <span
                      key={`s-${i}`}
                      className="text-primary w-4 text-center font-bold"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Warnings (in Subtraction via addition, carryout is actually expected if A >= B, so it is ignored typically, but overflow is relevant) */}
            <div className="space-y-3">
              {carryOut && (
                <div className="bg-muted border-muted-foreground flex items-start gap-3 rounded-r-md border-l-4 p-4">
                  <Info className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
                  <p className="text-foreground text-sm">
                    <strong className="mb-1 block">
                      {t(
                        "simulator.arithmetic.subtraction.carryOutTitle",
                        "Übertrag (Carry Out):",
                      )}
                    </strong>
                    {t(
                      "simulator.arithmetic.subtraction.carryOutInfo",
                      "Da wir via Zweierkomplement subtrahieren, bedeutet ein Carry-Out in der Regel, dass das Ergebnis positiv ist. Den Übertrag werfen wir in diesem Fixpunkt-System einfach weg.",
                    )}
                  </p>
                </div>
              )}
              {overflow && (
                <div className="flex items-start gap-3 rounded-r-md border-l-4 border-orange-500 bg-orange-500/10 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                  <p className="text-sm text-orange-700 dark:text-orange-400">
                    <strong className="mb-1 block">
                      {t(
                        "simulator.arithmetic.addition.overflowTitle",
                        "Overflow Error (2s Complement):",
                      )}
                    </strong>
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
