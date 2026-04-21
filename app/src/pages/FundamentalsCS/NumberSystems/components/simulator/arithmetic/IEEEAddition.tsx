import { useState, useMemo } from "react";
import { Info, LockKeyhole, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface IEEEAdditionProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
}

export function IEEEAddition({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
}: IEEEAdditionProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState("13.37");
  const [valB, setValB] = useState("2.5");

  const locked = !!isExerciseMode && !showSolution;

  // Float to IEEE 754 bits
  const floatToBinary = (num: number) => {
    const arr = new Float32Array(1);
    const view = new Uint32Array(arr.buffer);
    arr[0] = num;
    return view[0].toString(2).padStart(32, "0");
  };

  const { parsed, steps, result } = useMemo(() => {
    const numA = parseFloat(valA);
    const numB = parseFloat(valB);

    if (isNaN(numA) || isNaN(numB)) {
      return { parsed: null, steps: null, result: null };
    }

    const binA = floatToBinary(numA);
    const binB = floatToBinary(numB);

    const parseIEEE = (bin: string) => {
      const sign = parseInt(bin[0], 2);
      const expBits = bin.slice(1, 9);
      const exp = parseInt(expBits, 2);
      const mantissaBits = bin.slice(9);
      // Include hidden bit if normalized
      const hiddenBit = exp === 0 ? "0" : "1";
      return {
        sign,
        exp,
        expBits,
        mantissaBits,
        hiddenBit,
        isZero: exp === 0 && parseInt(mantissaBits, 2) === 0,
      };
    };

    const parsedA = parseIEEE(binA);
    const parsedB = parseIEEE(binB);

    // If either is zero, handle edge case gracefully
    if (parsedA.isZero || parsedB.isZero) {
      return {
        parsed: { A: parsedA, B: parsedB },
        steps: { msg: "Null-Addition übersprungen." },
        result: { sumDec: numA + numB, binStr: floatToBinary(numA + numB) },
      };
    }

    // Step 1: Denormalize / Align Exponents
    let larger = parsedA;
    let smaller = parsedB;
    let swapped = false;

    if (
      parsedB.exp > parsedA.exp ||
      (parsedB.exp === parsedA.exp && numB > numA)
    ) {
      larger = parsedB;
      smaller = parsedA;
      swapped = true;
    }

    const expDiff = larger.exp - smaller.exp;
    const shiftVal = Math.min(expDiff, 24); // max shift
    // Denormalized mantissa (we prepend the hidden bit and pad it safely)
    const smallerMantissaFull = smaller.hiddenBit + smaller.mantissaBits;
    const shiftedSmaller = ("0".repeat(shiftVal) + smallerMantissaFull).slice(
      0,
      24,
    );

    // Step 2: Add Mantissas (simplified for positive numbers visual only for now)
    // we do algebraic addition conceptually
    const resultNum = numA + numB;
    const resBin = floatToBinary(resultNum);
    const resParsed = parseIEEE(resBin);

    return {
      parsed: { A: parsedA, B: parsedB, swapped },
      steps: {
        denorm: {
          diff: expDiff,
          largerExpDec: larger.exp - 127,
          smallerExpDec: smaller.exp - 127,
          shiftedMantissa: shiftedSmaller,
        },
        renorm: {
          resParsed,
        },
      },
      result: { sumDec: resultNum, binStr: resBin },
    };
  }, [valA, valB]);

  return (
    <div className="animate-in fade-in zoom-in-95 grid w-full grid-cols-1 gap-6 duration-300 md:grid-cols-2">
      {/* Inputs */}
      <div className="bg-card border-border/50 space-y-6 rounded-xl border p-6 shadow-sm">
        <div>
          <h3 className="text-foreground mb-2 flex items-center gap-2 text-lg font-semibold">
            Gleitkommazahlen
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">
            {t(
              "simulator.arithmetic.ieee754.desc",
              "Addition von zwei 32-Bit Gleitkommazahlen nach IEEE 754.",
            )}
          </p>
        </div>

        <div className="space-y-4">
          <div className={locked ? "opacity-60" : ""}>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              {t("simulator.arithmetic.ieee754.inputA", "Dezimal A")}
            </label>
            <input
              type="text"
              value={valA}
              onChange={(e) => {
                if (!locked) setValA(e.target.value);
              }}
              readOnly={locked}
              className={`bg-background text-foreground w-full rounded-md border px-3 py-2 font-mono text-sm transition-colors focus:outline-none ${locked ? "bg-muted border-input pointer-events-none" : "border-input focus:border-primary focus:ring-primary/20 focus:ring-1"}`}
            />
          </div>
          <div className={locked ? "opacity-60" : ""}>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              {t("simulator.arithmetic.ieee754.inputB", "Dezimal B")}
            </label>
            <input
              type="text"
              value={valB}
              onChange={(e) => {
                if (!locked) setValB(e.target.value);
              }}
              readOnly={locked}
              className={`bg-background text-foreground w-full rounded-md border px-3 py-2 font-mono text-sm transition-colors focus:outline-none ${locked ? "bg-muted border-input pointer-events-none" : "border-input focus:border-primary focus:ring-primary/20 focus:ring-1"}`}
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
        ) : parsed && steps && result ? (
          <div className="space-y-6">
            <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
              <Info className="text-primary h-5 w-5" />
              Addition in 3 Schritten
            </h3>

            {steps.msg ? (
              <p className="text-muted-foreground text-sm">{steps.msg}</p>
            ) : (
              <div className="space-y-4 font-mono text-sm">
                {/* Denorm */}
                <div className="bg-background border-border/40 space-y-2 rounded border p-4 shadow-inner">
                  <p className="text-muted-foreground font-sans text-xs font-bold tracking-normal uppercase">
                    {t(
                      "simulator.arithmetic.ieee754.step1",
                      "1. Exponenten angleichen (Denormierung)",
                    )}
                  </p>
                  <p className="text-muted-foreground font-sans text-xs">
                    Exponentendifferenz: $\Delta = {steps.denorm?.largerExpDec}{" "}
                    - {steps.denorm?.smallerExpDec} = {steps.denorm?.diff}$
                  </p>
                  <p className="text-muted-foreground font-sans text-xs">
                    Die Mantisse der kleineren Zahl wird um {steps.denorm?.diff}{" "}
                    Stellen nach rechts verschoben.
                  </p>
                  <div className="pt-2">
                    <span className="mr-2 line-through opacity-50">
                      1.{parsed.B.mantissaBits}
                    </span>
                    <ArrowRight className="text-primary mx-2 inline-block h-4 w-4" />
                    <span className="text-primary font-bold">
                      0.{steps.denorm?.shiftedMantissa.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Mantissas Add */}
                <div className="bg-background border-border/40 space-y-2 rounded border p-4 shadow-inner">
                  <p className="text-muted-foreground font-sans text-xs font-bold tracking-normal uppercase">
                    {t(
                      "simulator.arithmetic.ieee754.step2",
                      "2. Mantisse addieren (inklusive Hidden Bit)",
                    )}
                  </p>
                  <p className="text-muted-foreground font-sans text-xs">
                    Nun weisen beide Glieder den Exponenten $2^
                    {steps.denorm?.largerExpDec}$ auf und können addiert (bzw.
                    subtrahiert) werden.
                  </p>
                </div>

                {/* Renorm */}
                <div className="bg-background border-border/40 space-y-2 rounded border p-4 shadow-inner">
                  <p className="text-muted-foreground font-sans text-xs font-bold tracking-normal uppercase">
                    {t(
                      "simulator.arithmetic.ieee754.step3",
                      "3. Ergebnis normieren",
                    )}
                  </p>
                  <p className="text-muted-foreground font-sans text-xs">
                    Das Resultat wird zurück in das Format $1.M \times 2^E$
                    verschoben.
                  </p>
                  <div className="bg-primary/5 border-primary/20 mt-2 flex flex-col gap-1 rounded border p-2">
                    <span className="text-muted-foreground text-xs">
                      {t(
                        "simulator.arithmetic.ieee754.signExpMant",
                        "Sign | Exponent | Mantissa",
                      )}
                    </span>
                    <div>
                      <span className="font-bold">
                        {steps.renorm?.resParsed.sign}
                      </span>
                      <span className="text-primary mx-2">
                        {steps.renorm?.resParsed.expBits}
                      </span>
                      <span className="text-foreground">
                        {steps.renorm?.resParsed.mantissaBits}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="border-border/50 flex justify-start border-t pt-4 text-sm font-semibold">
              <span className="bg-primary/10 text-primary flex items-center gap-2 rounded-md px-3 py-1">
                Dezimal: {result.sumDec}
              </span>
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
    </div>
  );
}
