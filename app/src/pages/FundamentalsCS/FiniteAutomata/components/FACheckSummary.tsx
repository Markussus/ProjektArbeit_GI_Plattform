import { useTranslation } from "react-i18next";
import type { FACheckResult } from "./Simulator/FASimulator";

/**
 * The verdict shown in the solution-check dialog. Four outcomes, in the order
 * they matter to the student: nothing built yet, a structurally broken
 * automaton, a passing one, and a failing one with its counterexample.
 */
export function FACheckSummary({ result }: { result: FACheckResult }) {
  const { t } = useTranslation();

  if (result === "unbuilt") {
    return (
      <div>
        <p className="text-foreground text-sm font-semibold">
          {t("finite-automata.exerciseWorkspace.unbuiltTitle")}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("finite-automata.exerciseWorkspace.unbuiltBody")}
        </p>
      </div>
    );
  }

  if (result.structuralIssues.length > 0) {
    return (
      <div>
        <p className="text-destructive text-sm font-semibold">
          {t("finite-automata.exerciseWorkspace.structuralFail")}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("finite-automata.exerciseWorkspace.structuralHint")}
        </p>
      </div>
    );
  }

  if (result.passed) {
    return (
      <div>
        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
          {t("finite-automata.exerciseWorkspace.passed")}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("finite-automata.exerciseWorkspace.passedDetail", {
            n: result.passedCount,
            total: result.total,
          })}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-destructive text-sm font-semibold">
        {t("finite-automata.exerciseWorkspace.failed")}
      </p>
      <p className="text-muted-foreground mt-1 text-sm">
        {t("finite-automata.exerciseWorkspace.failedDetail", {
          passed: result.passedCount,
          total: result.total,
          failed: result.failedCount,
        })}
      </p>
      {result.firstFailure && (
        <p className="text-muted-foreground mt-2 text-sm">
          {t("finite-automata.exerciseWorkspace.counterexample")}{" "}
          <span className="text-foreground font-mono">
            {result.firstFailure.word === "" ? "ε" : result.firstFailure.word}
          </span>{" "}
          ({t("finite-automata.exerciseWorkspace.expected")}{" "}
          {result.firstFailure.expected
            ? t("finite-automata.exerciseWorkspace.accept")
            : t("finite-automata.exerciseWorkspace.reject")}
          , {t("finite-automata.exerciseWorkspace.got")}{" "}
          {result.firstFailure.got
            ? t("finite-automata.exerciseWorkspace.accept")
            : t("finite-automata.exerciseWorkspace.reject")}
          )
        </p>
      )}
    </div>
  );
}
