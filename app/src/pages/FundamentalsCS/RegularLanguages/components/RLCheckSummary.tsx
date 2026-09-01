import { useTranslation } from "react-i18next";
import type { RLCheckResult } from "./Simulator/domain/rlSolutionChecker";

function formatWords(words: string[]): string {
  return words.map((word) => (word === "" ? "ε" : word)).join(", ");
}

/**
 * The verdict shown in the solution-check dialog. The wording differs between
 * the two exercise directions, so every message key has a G2L and an L2G
 * variant picked by `isGrammarExercise`.
 */
export function RLCheckSummary({
  result,
  isGrammarExercise,
}: {
  result: RLCheckResult;
  isGrammarExercise: boolean;
}) {
  const { t } = useTranslation();

  if (result.status === "invalid") {
    const messageKey =
      result.reason === "studentParse"
        ? "regular-languages.exerciseWorkspace.checkInvalidGrammar"
        : result.reason === "reference"
          ? "regular-languages.exerciseWorkspace.checkUnavailable"
          : "regular-languages.exerciseWorkspace.checkEmpty";
    return <p className="text-muted-foreground text-sm">{t(messageKey)}</p>;
  }

  if (result.status === "match") {
    return (
      <div>
        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
          {t("regular-languages.exerciseWorkspace.checkMatch")}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {t(
            isGrammarExercise
              ? "regular-languages.exerciseWorkspace.checkMatchDetailG2L"
              : "regular-languages.exerciseWorkspace.checkMatchDetailL2G",
          )}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-destructive text-sm font-semibold">
        {t("regular-languages.exerciseWorkspace.checkMismatch")}
      </p>
      {result.wrong.length > 0 && (
        <p className="text-muted-foreground mt-1 text-sm">
          {t(
            isGrammarExercise
              ? "regular-languages.exerciseWorkspace.checkWrongG2L"
              : "regular-languages.exerciseWorkspace.checkWrongL2G",
            { words: formatWords(result.wrong) },
          )}
        </p>
      )}
      {result.missing.length > 0 && (
        <p className="text-muted-foreground mt-1 text-sm">
          {t(
            isGrammarExercise
              ? "regular-languages.exerciseWorkspace.checkMissingG2L"
              : "regular-languages.exerciseWorkspace.checkMissingL2G",
            { words: formatWords(result.missing) },
          )}
        </p>
      )}
    </div>
  );
}
