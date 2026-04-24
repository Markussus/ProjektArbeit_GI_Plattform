import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  Lightbulb,
  Eye,
  Target,
  X,
  AlertTriangle,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FAProgram } from "../domain/faTypes";
import {
  validateAgainstSolution,
  type ValidationResult,
} from "../domain/faExerciseValidation";
import { type FAExerciseDefinition } from "../../../exercises/faExerciseDefinitions";
import { useFAExerciseStore } from "../../../store/faExerciseStore";

interface FAExerciseWorkspacePanelProps {
  exercise: FAExerciseDefinition;
  /** The program currently in the editor (may be invalid). */
  studentProgram: FAProgram;
  /** Replace the editor program with the reference solution. */
  onLoadSolution: (program: FAProgram) => void;
  /** Detach this exercise and return to freeform editing. */
  onExit: () => void;
}

export function FAExerciseWorkspacePanel({
  exercise,
  studentProgram,
  onLoadSolution,
  onExit,
}: FAExerciseWorkspacePanelProps) {
  const { t } = useTranslation();
  const progress = useFAExerciseStore((s) => s.getProgress(exercise.id));
  const revealNextHint = useFAExerciseStore((s) => s.revealNextHint);
  const revealSolution = useFAExerciseStore((s) => s.revealSolution);
  const markCompleted = useFAExerciseStore((s) => s.markCompleted);
  const setActiveExercise = useFAExerciseStore((s) => s.setActiveExercise);

  const [result, setResult] = useState<ValidationResult | null>(null);
  const [confirmShowSolution, setConfirmShowSolution] = useState(false);

  const visibleHints = exercise.hintKeys.slice(0, progress.hintsRevealed);
  const hasMoreHints = progress.hintsRevealed < exercise.hintKeys.length;

  const handleCheck = () => {
    const r = validateAgainstSolution(studentProgram, exercise.solution, {
      maxLen: exercise.maxTestLen ?? 4,
    });
    setResult(r);
    if (r.passed) markCompleted(exercise.id);
  };

  const handleShowSolution = () => {
    revealSolution(exercise.id);
    onLoadSolution(exercise.solution);
    setConfirmShowSolution(false);
  };

  const handleExit = () => {
    setActiveExercise(null);
    onExit();
  };

  return (
    <div className="bg-card ring-foreground/10 rounded-xl ring-1">
      {/* Header */}
      <div className="border-b px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {t("fa.exerciseWorkspace.label", "Exercise")}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Target className="text-primary h-4 w-4 shrink-0" />
              <h3 className="text-foreground text-sm font-bold">
                {t(exercise.titleKey, exercise.id)}
              </h3>
              {progress.status === "completed" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-green-500/15 px-2 py-0.5 text-xs font-bold text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("fa.exerciseWorkspace.completed", "Completed")}
                </span>
              )}
            </div>
            <p className="text-foreground/80 mt-2 text-sm">
              {t(exercise.goalKey, "")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleExit}
            title={t("fa.exerciseWorkspace.exit", "Exit exercise mode")}
            className="text-muted-foreground hover:text-foreground rounded-md p-1.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex flex-wrap gap-2 border-b px-5 py-3">
        <button
          type="button"
          onClick={handleCheck}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold"
        >
          <CheckCircle2 className="h-4 w-4" />
          {t("fa.exerciseWorkspace.check", "Check Solution")}
        </button>

        <button
          type="button"
          onClick={() => revealNextHint(exercise.id)}
          disabled={!hasMoreHints}
          className="inline-flex items-center gap-2 rounded-md bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-amber-400"
        >
          <Lightbulb className="h-4 w-4" />
          {hasMoreHints
            ? t(
                "fa.exerciseWorkspace.showHint",
                "Show hint ({{n}}/{{total}})",
                {
                  n: progress.hintsRevealed + 1,
                  total: exercise.hintKeys.length,
                },
              )
            : t("fa.exerciseWorkspace.noMoreHints", "All hints revealed")}
        </button>

        <button
          type="button"
          onClick={() => setConfirmShowSolution(true)}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold"
        >
          <Eye className="h-4 w-4" />
          {t("fa.exerciseWorkspace.showSolution", "Show solution")}
        </button>
      </div>

      {/* Revealed hints */}
      {visibleHints.length > 0 && (
        <div className="border-b px-5 py-3">
          <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
            <Lightbulb className="h-3.5 w-3.5" />
            {t("fa.exerciseWorkspace.hintsHeader", "Hints")}
          </div>
          <ul className="space-y-2">
            {visibleHints.map((key, idx) => (
              <li
                key={key}
                className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm"
              >
                <span className="mr-2 font-bold text-amber-700 dark:text-amber-400">
                  {idx + 1}.
                </span>
                {t(key, "")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation result */}
      {result && (
        <div className="border-b px-5 py-3">
          <ValidationFeedback result={result} />
        </div>
      )}

      {/* Show-solution confirmation */}
      {confirmShowSolution && (
        <div className="border-t px-5 py-4">
          <div className="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {t(
                  "fa.exerciseWorkspace.confirmTitle",
                  "Reveal the full solution?",
                )}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {t(
                  "fa.exerciseWorkspace.confirmBody",
                  "Your current automaton will be replaced with the reference solution. You can still reset the exercise from the Exercises tab.",
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleShowSolution}
                  className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                >
                  {t("fa.exerciseWorkspace.confirmYes", "Yes, show solution")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmShowSolution(false)}
                  className="text-muted-foreground hover:text-foreground rounded-md border px-3 py-1.5 text-xs font-semibold"
                >
                  {t("fa.exerciseWorkspace.confirmNo", "Keep trying")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Feedback for the latest validation run
   ────────────────────────────────────────────────────────── */

function ValidationFeedback({ result }: { result: ValidationResult }) {
  const { t } = useTranslation();

  if (result.structuralIssues.length > 0) {
    return (
      <div className="bg-destructive/10 text-destructive rounded-md border border-current/30 p-3 text-sm">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4" />
          {t(
            "fa.exerciseWorkspace.structuralFail",
            "Your automaton isn't valid yet",
          )}
        </div>
        <p className="mt-1 text-xs">
          {t(
            "fa.exerciseWorkspace.structuralHint",
            "Fix the highlighted configuration issues before we can compare against the solution.",
          )}
        </p>
        <ul className="mt-2 list-inside list-disc font-mono text-xs">
          {result.structuralIssues.map((code, i) => (
            <li key={i}>{code}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (result.passed) {
    return (
      <div className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm">
        <div className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-400">
          <Trophy className="h-4 w-4" />
          {t("fa.exerciseWorkspace.passed", "All checks passed!")}
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {t(
            "fa.exerciseWorkspace.passedDetail",
            "{{n}} of {{total}} test strings accepted/rejected correctly.",
            { n: result.passedCount, total: result.total },
          )}
        </p>
      </div>
    );
  }

  const cex = result.firstFailure;
  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
      <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4" />
        {t("fa.exerciseWorkspace.failed", "Not matching the expected language")}
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        {t(
          "fa.exerciseWorkspace.failedDetail",
          "{{passed}} of {{total}} test strings agreed, {{failed}} disagreed.",
          {
            passed: result.passedCount,
            total: result.total,
            failed: result.failedCount,
          },
        )}
      </p>
      {cex && (
        <div className="mt-2 font-mono text-xs">
          <span className="font-bold">
            {t("fa.exerciseWorkspace.counterexample", "Counterexample:")}
          </span>{" "}
          <code
            className={cn(
              "bg-background rounded px-1.5 py-0.5",
              cex.word.length === 0 && "italic",
            )}
          >
            {cex.word.length === 0 ? "ε" : cex.word}
          </code>{" "}
          — {t("fa.exerciseWorkspace.expected", "expected")}{" "}
          <strong>
            {cex.expected
              ? t("fa.exerciseWorkspace.accept", "accept")
              : t("fa.exerciseWorkspace.reject", "reject")}
          </strong>
          , {t("fa.exerciseWorkspace.got", "got")}{" "}
          <strong>
            {cex.got
              ? t("fa.exerciseWorkspace.accept", "accept")
              : t("fa.exerciseWorkspace.reject", "reject")}
          </strong>
          .
        </div>
      )}
    </div>
  );
}
