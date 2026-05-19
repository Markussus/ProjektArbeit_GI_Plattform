import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle, KeyRound, Eye, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog/ConfirmDialog";

/**
 * Bestimmt welche Zeichen im Lösungseingabefeld erlaubt sind.
 *
 * | Wert           | Erlaubte Zeichen                                  | Einsatz                            |
 * |----------------|---------------------------------------------------|------------------------------------|
 * | "binary"       | 0, 1                                              | Alle Binär-Arithmetik, NegNumbers  |
 * | "octal"        | 0-7                                               | Oktal-Konverter                    |
 * | "decimal"      | 0-9                                               | Dezimal-Konverter                  |
 * | "hex"          | 0-9, A-F (Groß/Klein)                             | Hex-Konverter                      |
 * | "float"        | 0-9, ., -, (für IEEE754-Dezimalergebnis)          | IEEEToDec-Ergebnis                 |
 * | "ieee-binary"  | 0, 1, Leerzeichen                                 | IEEE-Binary-String-Eingabe         |
 * | "compare"      | <, >, =                                           | Compare-Modul                      |
 * | "text"         | keine Einschränkung                               | Division (gemischtes Format)       |
 */
export type ValidationInputMode =
  | "binary"
  | "octal"
  | "decimal"
  | "hex"
  | "float"
  | "ieee-binary"
  | "compare"
  | "text";

/** Filtert eine Zeichenkette basierend auf dem erlaubten `mode`. */
function filterInput(value: string, mode: ValidationInputMode): string {
  switch (mode) {
    case "binary":
      return value.replace(/[^01]/g, "");
    case "octal":
      return value.replace(/[^0-7]/g, "");
    case "decimal":
      return value.replace(/[^0-9]/g, "");
    case "hex":
      return value.replace(/[^0-9A-Fa-f]/g, "");
    case "float":
      // Dezimalzahl mit optionalem Vorzeichen und Komma/Punkt
      return value.replace(/[^0-9.-]/g, "");
    case "ieee-binary":
      // Binäre Bits und Leerzeichen (für "0 10000010 10100000...")
      return value.replace(/[^01 ]/g, "");
    case "compare":
      // Nur Vergleichssymbole
      return value.replace(/[^<>=]/g, "");
    case "text":
    default:
      return value;
  }
}

interface ExerciseValidationPanelProps {
  expectedResult: string | string[];
  onShowSolution: () => void;
  /** Callback für "Übungsmodus verlassen" – wenn nicht angegeben, wird der Button nicht gezeigt */
  onExitExercise?: () => void;
  /**
   * Einschränkung der erlaubten Eingabezeichen.
   * Entspricht dem Zahlenformat der gesuchten Antwort (z. B. "binary", "hex").
   * @default "text"
   */
  inputMode?: ValidationInputMode;
  inputType?: "text" | "number";
  placeholder?: string;
  className?: string;
}

export function ExerciseValidationPanel({
  expectedResult,
  onShowSolution,
  onExitExercise,
  inputMode = "text",
  inputType = "text",
  placeholder,
  className,
}: ExerciseValidationPanelProps) {
  const { t } = useTranslation("translation");
  const [inputValue, setInputValue] = useState("");
  const [validationState, setValidationState] = useState<
    "idle" | "correct" | "incorrect"
  >("idle");
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleVerify = () => {
    const cleanUser = inputValue.replace(/\s/g, "").toLowerCase().trim();

    const expectedArray = Array.isArray(expectedResult)
      ? expectedResult
      : [expectedResult];

    const isCorrect = expectedArray.some(
      (exp) => exp.replace(/\s/g, "").toLowerCase().trim() === cleanUser,
    );

    if (isCorrect) {
      setValidationState("correct");
      setTimeout(() => {
        onShowSolution();
      }, 1500);
    } else {
      setValidationState("incorrect");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filtered = filterInput(e.target.value, inputMode);
    setInputValue(filtered);
    if (validationState === "incorrect") {
      setValidationState("idle");
    }
  };

  return (
    <>
      <div
        className={cn(
          "bg-card border-border/50 overflow-hidden rounded-xl border shadow-sm",
          className,
        )}
      >
        <div className="bg-muted/30 border-border/50 border-b p-4">
          <h3 className="text-foreground flex items-center gap-2 font-semibold">
            <KeyRound className="text-primary h-5 w-5" />
            {t("simulator.validation.title", "Ergebnis überprüfen")}
          </h3>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <label className="text-muted-foreground mb-2 block text-sm font-medium">
              {t(
                "simulator.validation.enterSolution",
                "Geben Sie hier Ihr Endergebnis ein...",
              )}
            </label>
            <input
              type={inputType}
              value={inputValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || "z.B. 10110010"}
              className={cn(
                "bg-background w-full rounded-md border px-4 py-3 font-mono text-sm focus:outline-none",
                validationState === "incorrect"
                  ? "border-destructive focus:border-destructive focus:ring-destructive/20 focus:ring-1"
                  : validationState === "correct"
                    ? "border-green-500 bg-green-50/50 text-green-600 focus:border-green-500 dark:bg-green-500/10"
                    : "border-input focus:border-primary focus:ring-primary/20 focus:ring-1",
              )}
              disabled={validationState === "correct"}
            />
          </div>

          {validationState === "incorrect" && (
            <div className="text-destructive bg-destructive/10 animate-in fade-in zoom-in-95 flex items-start gap-2 rounded-md p-3 text-sm">
              <XCircle className="h-5 w-5 shrink-0" />
              <p>
                {t(
                  "simulator.validation.incorrect",
                  "Das Ergebnis ist leider nicht richtig. Versuchen Sie es nochmal!",
                )}
              </p>
            </div>
          )}

          {validationState === "correct" && (
            <div className="animate-in fade-in zoom-in-95 flex items-start gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p>
                {t(
                  "simulator.validation.correct",
                  "Korrekt! Die Lösung wurde freigeschaltet.",
                )}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              onClick={handleVerify}
              disabled={!inputValue.trim() || validationState === "correct"}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 rounded-md px-4 py-2.5 font-medium disabled:pointer-events-none disabled:opacity-50"
            >
              {t("simulator.validation.verify", "Lösung überprüfen")}
            </button>

            <button
              onClick={onShowSolution}
              className="bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 font-medium sm:flex-none"
            >
              <Eye className="h-4 w-4" />
              {t("simulator.validation.showSolution", "Lösung anzeigen")}
            </button>
          </div>

          {/* "Übungsmodus verlassen" Button */}
          {onExitExercise && (
            <div className="border-border/40 border-t pt-4">
              <button
                onClick={() => setShowExitConfirm(true)}
                className="text-muted-foreground hover:text-destructive hover:border-destructive/30 flex w-full items-center justify-center gap-2 rounded-md border border-transparent px-4 py-2 text-sm font-medium"
              >
                <LogOut className="h-4 w-4" />
                {t("simulator.validation.exitExerciseButton")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      {onExitExercise && (
        <ConfirmDialog
          isOpen={showExitConfirm}
          title={t("simulator.validation.exitExerciseTitle")}
          description={t("simulator.validation.exitExerciseDesc")}
          confirmLabel={t("simulator.validation.exitExerciseConfirm")}
          onConfirm={() => {
            setShowExitConfirm(false);
            onExitExercise();
          }}
          onCancel={() => setShowExitConfirm(false)}
          variant="warning"
        />
      )}
    </>
  );
}
