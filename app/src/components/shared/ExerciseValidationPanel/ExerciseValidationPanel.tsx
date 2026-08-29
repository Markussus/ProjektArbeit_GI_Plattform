import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle, KeyRound, Eye, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog/ConfirmDialog";

/**
 * Determines which characters are allowed in the solution input field.
 *
 * | Value          | Allowed characters                                | Used by                            |
 * |----------------|---------------------------------------------------|------------------------------------|
 * | "binary"       | 0, 1                                              | All binary arithmetic, NegNumbers  |
 * | "octal"        | 0-7                                               | Octal converter                    |
 * | "decimal"      | 0-9                                               | Decimal converter                  |
 * | "hex"          | 0-9, A-F (case-insensitive)                       | Hex converter                      |
 * | "float"        | 0-9, ., - (for IEEE754 decimal result)            | IEEEToDec result                   |
 * | "ieee-binary"  | 0, 1, whitespace                                  | IEEE binary string input           |
 * | "compare"      | <, >, =                                           | Compare module                     |
 * | "text"         | no restriction                                    | Division (mixed format)            |
 */
export type ValidationInputMode =
  | "binary"
  | "octal"
  | "decimal"
  | "hex"
  | "float"
  | "ieee-binary"
  | "compare"
  | "text"
  | "base64"
  | "hex-bytes";

/** Filters a string based on the allowed `mode`. */
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
      // Decimal number with optional sign and comma/dot
      return value.replace(/[^0-9.-]/g, "");
    case "ieee-binary":
      // Binary bits and whitespace (for "0 10000010 10100000...")
      return value.replace(/[^01 ]/g, "");
    case "compare":
      // Only comparison symbols
      return value.replace(/[^<>=]/g, "");
    case "text":
    case "base64":
    case "hex-bytes":
    default:
      return value;
  }
}

interface ExerciseValidationPanelProps {
  expectedResult: string | string[];
  onShowSolution: () => void;
  /** Callback for "exit exercise mode" — if not provided, the button is hidden */
  onExitExercise?: () => void;
  /**
   * Restricts the allowed input characters.
   * Matches the number format of the expected answer (e.g. "binary", "hex").
   * @default "text"
   */
  inputMode?: ValidationInputMode;
  inputType?: "text" | "number";
  placeholder?: string;
  className?: string;
  testIdPrefix?: string;
}

export function ExerciseValidationPanel({
  expectedResult,
  onShowSolution,
  onExitExercise,
  inputMode = "text",
  inputType = "text",
  placeholder,
  className,
  testIdPrefix,
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
        data-testid={testIdPrefix}
        className={cn(
          "bg-card border-border/50 overflow-hidden rounded-xl border shadow-sm",
          className,
        )}
      >
        <div className="bg-muted/30 border-border/50 border-b p-4">
          <h3 className="text-foreground flex items-center gap-2 font-semibold">
            <KeyRound className="text-primary h-5 w-5" />
            {t("simulator.validation.title", "Check result")}
          </h3>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <label className="text-muted-foreground mb-2 block text-sm font-medium">
              {t(
                "simulator.validation.enterSolution",
                "Enter your final result here...",
              )}
            </label>
            <input
              type={inputType}
              value={inputValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              data-testid={testIdPrefix ? `${testIdPrefix}-input` : undefined}
              placeholder={placeholder || "e.g. 10110010"}
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
                  "The result is not correct. Please try again!",
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
                  "Correct! The solution has been unlocked.",
                )}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              onClick={handleVerify}
              disabled={!inputValue.trim() || validationState === "correct"}
              data-testid={testIdPrefix ? `${testIdPrefix}-verify` : undefined}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 rounded-md px-4 py-2.5 font-medium disabled:pointer-events-none disabled:opacity-50"
            >
              {t("simulator.validation.verify", "Check solution")}
            </button>

            <button
              onClick={onShowSolution}
              data-testid={
                testIdPrefix ? `${testIdPrefix}-show-solution` : undefined
              }
              className="bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 font-medium sm:flex-none"
            >
              <Eye className="h-4 w-4" />
              {t("simulator.validation.showSolution", "Show solution")}
            </button>
          </div>

          {/* "Exit exercise mode" button */}
          {onExitExercise && (
            <div className="border-border/40 border-t pt-4">
              <button
                onClick={() => setShowExitConfirm(true)}
                data-testid={
                  testIdPrefix ? `${testIdPrefix}-exit-exercise` : undefined
                }
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
          testId={testIdPrefix ? `${testIdPrefix}-exit-confirm` : undefined}
        />
      )}
    </>
  );
}
