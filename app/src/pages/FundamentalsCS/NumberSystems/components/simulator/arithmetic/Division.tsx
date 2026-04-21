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

export function Division({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
  initialA,
  initialB,
}: DivisionProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "11010"); // Dividend 26
  const [valB, setValB] = useState(initialB || "101"); // Divisor 5

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
    if (!valA || !valB)
      return { steps: [], quotient: "", remainder: "", isZeroDiv: false };

    if (BigInt("0b" + valB || "0") === 0n)
      return { steps: [], quotient: "", remainder: "", isZeroDiv: true };

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
          currentStr: currentStr.replace(/^0+/, "") || "0",
          subtracted: valB,
          isOne: true,
        });
        qStr += "1";
        currentStr = (currentVal - divisor).toString(2);
      } else {
        stepsArr.push({
          droppedBitIndex: i,
          currentStr: currentStr.replace(/^0+/, "") || "0",
          subtracted: "0",
          isOne: false,
        });
        qStr += "0";
      }
    }

    return {
      steps: stepsArr,
      quotient: qStr.replace(/^0+/, "") || "0",
      remainder: currentStr.replace(/^0+/, "") || "0",
      isZeroDiv: false,
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
              "simulator.arithmetic.division.desc",
              "Schriftliche Division durch Probieren (gehe von links nach rechts).",
            )}
          </p>
        </div>

        <div className="space-y-4">
          <div className={locked ? "opacity-60" : ""}>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              {t(
                "simulator.arithmetic.division.dividend",
                "Dividend (Zahl A, die geteilt wird)",
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
              {t("simulator.arithmetic.division.divisor", "Divisor (Zahl B)")}
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

            {isZeroDiv ? (
              <p className="text-destructive py-4 text-sm font-semibold">
                {t(
                  "simulator.arithmetic.division.divByZero",
                  "Division durch 0 ist nicht definiert.",
                )}
              </p>
            ) : valA && valB ? (
              <div className="flex justify-center overflow-x-auto p-4">
                <div className="bg-background border-border/40 min-w-fit rounded-lg border p-6 font-mono text-lg leading-loose font-medium tracking-widest shadow-inner select-none">
                  {/* Header */}
                  <div className="border-foreground/30 mb-4 flex justify-start gap-2 border-b-2 pb-2 whitespace-nowrap">
                    <span>{valA}</span>
                    <span className="text-primary mx-2">:</span>
                    <span>{valB}</span>
                    <span className="text-primary mx-2">=</span>
                    <span className="text-primary font-bold">{quotient}</span>
                  </div>

                  {/* Steps Dropdown logic roughly visualized */}
                  <div className="flex w-full flex-col items-start space-y-1 whitespace-nowrap">
                    {steps.map((step, idx) => (
                      <div key={idx} className="flex w-full gap-4">
                        {/* Shift padding manually could be tricky, using simple visual blocks instead */}
                        <div className="border-muted/50 flex flex-col items-end border-l-2 pl-2">
                          <span className="text-foreground">
                            {step.currentStr}
                          </span>
                          <span
                            className={`${step.isOne ? "text-destructive" : "text-muted-foreground opacity-50"}`}
                          >
                            - {step.subtracted}
                          </span>
                        </div>
                        <div className="text-muted-foreground flex h-full items-center pt-4 text-sm">
                          → ergänze {step.isOne ? "1" : "0"} am Ende d.
                          Quotienten
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Result */}
                  <div className="border-foreground/30 mt-6 flex justify-start gap-2 border-t-2 pt-4">
                    <span className="text-muted-foreground">
                      {t("simulator.arithmetic.division.remainder", "Rest:")}
                    </span>
                    <span className="font-bold">{remainder}</span>
                  </div>

                  <div className="text-muted-foreground mt-4 text-left font-sans text-xs tracking-normal">
                    In Dezimal: {parseInt(valA, 2)} : {parseInt(valB, 2)} ={" "}
                    {parseInt(quotient, 2)} Rest {parseInt(remainder, 2)}
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
