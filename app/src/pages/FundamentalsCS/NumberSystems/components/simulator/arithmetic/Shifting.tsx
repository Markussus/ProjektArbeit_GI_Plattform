import { useState, useMemo } from "react";
import { Info, LockKeyhole, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ShiftingProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialA?: string;
}

export function Shifting({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
  initialA,
}: ShiftingProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "1101");
  const [shiftAmount, setShiftAmount] = useState<number>(2);
  const [direction, setDirection] = useState<"left" | "right">("left");

  const locked = !!isExerciseMode && !showSolution;

  const handleInputA = (val: string) => {
    if (locked) return;
    setValA(val.replace(/[^01]/g, "").slice(0, 16));
  };

  const { resultStr, decimalBefore, decimalAfter, explanation } =
    useMemo(() => {
      if (!valA)
        return {
          resultStr: "",
          decimalBefore: 0,
          decimalAfter: 0,
          explanation: "",
        };

      const beforeDec = parseInt(valA, 2);
      let afterDec = 0;
      let resStr = "";
      let expl = "";

      if (direction === "left") {
        resStr = valA + "0".repeat(shiftAmount);
        afterDec = beforeDec * Math.pow(2, shiftAmount);
        expl = t(
          "simulator.arithmetic.shifting.shiftLeftExpl",
          "Ein Linksshift um n Stellen entspricht einer Multiplikation mit 2^n.",
        );
      } else {
        if (shiftAmount >= valA.length) {
          resStr = "0";
        } else {
          resStr = valA.slice(0, valA.length - shiftAmount);
        }
        afterDec = Math.floor(beforeDec / Math.pow(2, shiftAmount));
        expl = t(
          "simulator.arithmetic.shifting.shiftRightExpl",
          "Ein Rechtsshift um n Stellen entspricht einer Division durch 2^n (ohne Rest).",
        );
      }

      return {
        resultStr: resStr || "0",
        decimalBefore: beforeDec,
        decimalAfter: afterDec,
        explanation: expl,
      };
    }, [valA, shiftAmount, direction, t]);

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
              "simulator.arithmetic.shifting.desc",
              "Hier kannst du Binärzahlen nach links oder rechts verschieben.",
            )}
          </p>
        </div>

        <div className="space-y-4">
          <div className={locked ? "opacity-60" : ""}>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              {t("simulator.arithmetic.shifting.binaryNumber", "Binärzahl")}
            </label>
            <input
              type="text"
              value={valA}
              onChange={(e) => handleInputA(e.target.value)}
              readOnly={locked}
              className={`bg-background text-foreground w-full rounded-md border px-3 py-2 font-mono text-sm tracking-widest transition-colors focus:outline-none ${locked ? "bg-muted border-input pointer-events-none" : "border-input focus:border-primary focus:ring-primary/20 focus:ring-1"}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={locked ? "opacity-60" : ""}>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                {t(
                  "simulator.arithmetic.shifting.amount",
                  "Verschiebung um (n Bits)",
                )}
              </label>
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
                className={`bg-background text-foreground w-full rounded-md border px-3 py-2 font-mono text-sm transition-colors focus:outline-none ${locked ? "bg-muted border-input pointer-events-none" : "border-input focus:border-primary focus:ring-primary/20 focus:ring-1"}`}
              />
            </div>

            <div className={locked ? "pointer-events-none opacity-60" : ""}>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                {t("simulator.arithmetic.shifting.direction", "Richtung")}
              </label>
              <div className="bg-muted flex rounded-md p-1">
                <button
                  onClick={() => setDirection("left")}
                  className={`flex flex-1 items-center justify-center rounded p-1 transition-colors ${direction === "left" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <ChevronsLeft className="mr-1 h-4 w-4" />
                </button>
                <button
                  onClick={() => setDirection("right")}
                  className={`flex flex-1 items-center justify-center rounded p-1 transition-colors ${direction === "right" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <ChevronsRight className="mr-1 h-4 w-4" />
                </button>
              </div>
            </div>
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
              Ergebnis
            </h3>

            {valA && shiftAmount >= 0 ? (
              <div className="flex flex-col items-center justify-center p-4">
                <div className="bg-background border-border/40 w-full rounded-lg border px-6 py-8 text-center font-mono text-xl leading-loose font-medium tracking-widest shadow-inner select-none md:text-2xl">
                  <div className="text-muted-foreground mb-4 flex items-center justify-center gap-4 opacity-50">
                    <span>{valA}</span>
                    <span>{direction === "left" ? "<<" : ">>"}</span>
                    <span>{shiftAmount}</span>
                  </div>

                  <div className="text-primary font-bold">{resultStr}</div>
                </div>

                <div className="bg-primary/10 border-primary mt-6 w-full rounded-r-md border-l-4 p-4">
                  <p className="text-foreground mb-2 text-sm">
                    <strong className="mb-1 block">
                      {t(
                        "simulator.arithmetic.shifting.mathMeaning",
                        "Mathematische Bedeutung:",
                      )}
                    </strong>
                    {explanation}
                  </p>

                  <div className="text-muted-foreground border-primary/20 mt-2 border-t pt-2 font-mono text-xs">
                    {direction === "left" ? (
                      <span>
                        {decimalBefore} × 2^{shiftAmount} = {decimalAfter}
                      </span>
                    ) : (
                      <span>
                        {decimalBefore} : 2^{shiftAmount} = {decimalAfter}{" "}
                        (Ganzzahlig)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {t(
                  "simulator.arithmetic.shifting.enterBinary",
                  "Bitte gebe eine Binärzahl ein.",
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
