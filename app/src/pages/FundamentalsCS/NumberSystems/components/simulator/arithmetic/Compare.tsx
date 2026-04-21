import { useState, useMemo } from "react";
import { LockKeyhole, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CompareProps {
  isExerciseMode?: boolean;
  showSolution?: boolean;
  onShowSolution?: () => void;
  initialA?: string;
  initialB?: string;
}

export function Compare({
  isExerciseMode,
  showSolution = true,
  onShowSolution,
  initialA,
  initialB,
}: CompareProps) {
  const { t } = useTranslation("translation");
  const [valA, setValA] = useState(initialA || "10110");
  const [valB, setValB] = useState(initialB || "10011");

  const locked = !!isExerciseMode && !showSolution;

  const handleInputA = (val: string) => {
    if (locked) return;
    setValA(val.replace(/[^01]/g, "").slice(0, 16));
  };
  const handleInputB = (val: string) => {
    if (locked) return;
    setValB(val.replace(/[^01]/g, "").slice(0, 16));
  };

  const { padA, padB, diffIndex, result } = useMemo(() => {
    if (!valA || !valB)
      return { padA: "", padB: "", diffIndex: -1, result: "eq" };

    const maxLen = Math.max(valA.length, valB.length);
    const pA = valA.padStart(maxLen, "0");
    const pB = valB.padStart(maxLen, "0");

    let dIndex = -1;
    let res = "eq";

    for (let i = 0; i < maxLen; i++) {
      if (pA[i] !== pB[i]) {
        dIndex = i;
        res = pA[i] === "1" ? "greater" : "less";
        break;
      }
    }

    return { padA: pA, padB: pB, diffIndex: dIndex, result: res };
  }, [valA, valB]);

  return (
    <div className="animate-in fade-in zoom-in-95 grid w-full grid-cols-1 gap-6 duration-300 md:grid-cols-2">
      {/* Inputs */}
      <div className="bg-card border-border/50 space-y-6 rounded-xl border p-6 shadow-sm">
        <div>
          <h3 className="text-foreground mb-2 flex items-center gap-2 text-lg font-semibold">
            {t("simulator.arithmetic.common.operands", "Operanden")}
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">
            {t(
              "simulator.arithmetic.compare.desc",
              "Vergleicht zwei Binärzahlen Bit für Bit von links nach rechts.",
            )}
          </p>
        </div>

        <div className="space-y-4">
          <div className={locked ? "opacity-60" : ""}>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              {t("simulator.arithmetic.common.operandA", "Zahl A")}
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
              {t("simulator.arithmetic.common.operandB", "Zahl B")}
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
              <Search className="text-primary h-5 w-5" />
              {t(
                "simulator.arithmetic.compare.visualCompare",
                "Visueller Vergleich",
              )}
            </h3>

            {valA && valB ? (
              <div className="space-y-6">
                <p className="text-muted-foreground bg-background border-border/50 rounded border p-3 text-sm">
                  {t(
                    "simulator.arithmetic.compare.pad",
                    "Die Zahlen werden auf die gleiche Länge (mit Nullen links) aufgefüllt.",
                  )}
                </p>

                <div className="flex justify-center p-4">
                  <div className="bg-background border-border/40 flex min-w-fit flex-col items-center overflow-x-auto rounded-lg border p-6 font-mono text-xl leading-loose font-medium tracking-widest shadow-inner select-none md:text-2xl">
                    <div className="flex gap-2">
                      <span className="text-muted-foreground my-auto mr-4 w-8 text-right font-sans text-sm tracking-normal uppercase">
                        A
                      </span>
                      {padA.split("").map((bit, i) => (
                        <span
                          key={`a-${i}`}
                          className={`w-6 text-center ${i === diffIndex ? "text-primary border-primary rounded border-2 font-bold" : "opacity-80"}`}
                        >
                          {bit}
                        </span>
                      ))}
                    </div>

                    <div className="my-2 flex gap-2">
                      <span className="mr-4 w-8" />
                      {padA.split("").map((_, i) => (
                        <span
                          key={`op-${i}`}
                          className={`flex w-6 items-center justify-center text-sm ${i === diffIndex ? "text-primary" : diffIndex !== -1 && i > diffIndex ? "opacity-0" : "text-muted-foreground"}`}
                        >
                          {i === diffIndex
                            ? result === "greater"
                              ? ">"
                              : "<"
                            : "="}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <span className="text-muted-foreground my-auto mr-4 w-8 text-right font-sans text-sm tracking-normal uppercase">
                        B
                      </span>
                      {padB.split("").map((bit, i) => (
                        <span
                          key={`b-${i}`}
                          className={`w-6 text-center ${i === diffIndex ? "text-primary border-primary rounded border-2 font-bold" : "opacity-80"}`}
                        >
                          {bit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 border-primary w-full rounded-r-md border-l-4 p-4">
                  <p className="text-foreground text-sm font-semibold">
                    {result === "eq"
                      ? t(
                          "simulator.arithmetic.compare.resultEq",
                          "Die Zahlen sind gleich groß.",
                        )
                      : result === "greater"
                        ? t(
                            "simulator.arithmetic.compare.resultGreater",
                            "Zahl A ist größer als Zahl B.",
                          )
                        : t(
                            "simulator.arithmetic.compare.resultLess",
                            "Zahl A ist kleiner als Zahl B.",
                          )}
                  </p>
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
