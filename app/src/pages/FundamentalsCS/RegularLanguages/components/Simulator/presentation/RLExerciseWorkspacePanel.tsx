import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Eye, Lightbulb, Target, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RLExerciseDefinition } from "../../../exercises/rlExerciseDefinitions";

interface RLExerciseWorkspacePanelProps {
  exercise: RLExerciseDefinition;
  /** Load the worked input (grammar / language) into the simulator below. */
  onLoadSolution: () => void;
  /** Detach this exercise and return to freeform exploration. */
  onExit: () => void;
}

const DIFFICULTY_STYLES: Record<
  RLExerciseDefinition["difficulty"],
  { labelKey: string; className: string }
> = {
  easy: {
    labelKey: "difficulty.easy",
    className: "bg-green-500/15 text-green-700 dark:text-green-400",
  },
  medium: {
    labelKey: "difficulty.medium",
    className: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  },
  hard: {
    labelKey: "difficulty.hard",
    className: "bg-red-500/15 text-red-700 dark:text-red-400",
  },
};

export function RLExerciseWorkspacePanel({
  exercise,
  onLoadSolution,
  onExit,
}: RLExerciseWorkspacePanelProps) {
  const { t } = useTranslation();

  // Local-only progress: re-mounting the panel (key={exercise.id} on the
  // parent) resets to 0 hints with the solution hidden again.
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [solutionRevealed, setSolutionRevealed] = useState(false);
  const [confirmShowSolution, setConfirmShowSolution] = useState(false);

  const visibleHints = exercise.hintKeys.slice(0, hintsRevealed);
  const hasMoreHints = hintsRevealed < exercise.hintKeys.length;
  const difficultyStyle = DIFFICULTY_STYLES[exercise.difficulty];

  const promptLabel = t(
    exercise.category === "grammarToLanguage"
      ? "rl.exercises.givenGrammar"
      : "rl.exercises.targetLanguage",
  );

  const handleShowSolution = () => {
    setSolutionRevealed(true);
    onLoadSolution();
    setConfirmShowSolution(false);
  };

  return (
    <div className="bg-card ring-foreground/10 rounded-xl ring-1">
      {/* Header */}
      <div className="border-b px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-sm font-semibold">
              {t("rl.exerciseWorkspace.selectedExercise", "Selected exercise")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Target className="text-primary h-4 w-4 shrink-0" />
              <h3 className="text-foreground text-sm font-bold">
                {t(exercise.titleKey)}
              </h3>
              <span
                className={cn(
                  "inline-flex rounded-md px-2 py-0.5 text-xs font-bold tracking-wider uppercase",
                  difficultyStyle.className,
                )}
              >
                {t(difficultyStyle.labelKey, exercise.difficulty)}
              </span>
            </div>
            <p className="text-foreground/80 mt-2 text-sm font-medium">
              {t(exercise.goalKey)}
            </p>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {t(exercise.descriptionKey)}
            </p>
          </div>
          <button
            type="button"
            onClick={onExit}
            title={t("rl.exerciseWorkspace.exit", "Exit exercise mode")}
            className="text-muted-foreground hover:text-foreground rounded-md p-1.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Problem statement */}
        <GrammarBlock label={promptLabel} text={exercise.prompt} />

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setHintsRevealed((n) => Math.min(n + 1, exercise.hintKeys.length))
            }
            disabled={!hasMoreHints}
            className="inline-flex items-center gap-2 rounded-md bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-amber-400"
          >
            <Lightbulb className="h-4 w-4" />
            {hasMoreHints
              ? t("rl.exerciseWorkspace.showHint", "Hint")
              : t("rl.exerciseWorkspace.noMoreHints", "All hints revealed")}
          </button>

          <button
            type="button"
            onClick={() => setConfirmShowSolution(true)}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold"
          >
            <Eye className="h-4 w-4" />
            {t("rl.exerciseWorkspace.showSolution", "Show solution")}
          </button>

          <span className="text-muted-foreground ml-1 text-xs font-semibold tracking-wide uppercase">
            {t("rl.exerciseWorkspace.hintsUsed", "{{used}}/{{total}} hints", {
              used: hintsRevealed,
              total: exercise.hintKeys.length,
            })}
          </span>
        </div>
      </div>

      {/* Revealed hints */}
      {visibleHints.length > 0 && (
        <div className="border-b px-5 py-3 sm:px-6">
          <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
            <Lightbulb className="h-3.5 w-3.5" />
            {t("rl.exerciseWorkspace.hintsHeader", "Hints")}
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
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Revealed solution */}
      {solutionRevealed && (
        <div className="border-b px-5 py-3 sm:px-6">
          <GrammarBlock
            label={t("rl.exercises.solution", "Solution")}
            text={exercise.solution}
          />
          <p className="text-muted-foreground mt-2 text-xs">
            {t(
              "rl.exerciseWorkspace.solutionLoadedNote",
              "The worked solution is loaded into the simulator below — run it to see the derivation.",
            )}
          </p>
        </div>
      )}

      {/* Show-solution confirmation */}
      {confirmShowSolution && (
        <div className="px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {t(
                  "rl.exerciseWorkspace.confirmTitle",
                  "Reveal the full solution?",
                )}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {t(
                  "rl.exerciseWorkspace.confirmBody",
                  "The solution will be shown here and loaded into the simulator. You can keep trying instead.",
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleShowSolution}
                  className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                >
                  {t("rl.exerciseWorkspace.confirmYes", "Yes, show solution")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmShowSolution(false)}
                  className="text-muted-foreground hover:text-foreground rounded-md border px-3 py-1.5 text-xs font-semibold"
                >
                  {t("rl.exerciseWorkspace.confirmNo", "Keep trying")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Monospaced grammar / language block. Appends a one-line legend when the text
 * uses "ε" so the empty word is unambiguous.
 */
function GrammarBlock({ label, text }: { label: string; text: string }) {
  const { t } = useTranslation();
  const hasEpsilon = text.includes("ε");

  return (
    <div className="mt-3">
      <p className="text-muted-foreground/80 mb-1 text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <pre className="bg-muted/40 text-foreground ring-foreground/10 overflow-x-auto rounded-md p-3 font-mono text-sm leading-relaxed ring-1 ring-inset">
        {text}
      </pre>
      {hasEpsilon && (
        <p className="text-muted-foreground/80 mt-1 text-xs">
          {t("rl.exercises.epsilonHint", "ε denotes the empty word.")}
        </p>
      )}
    </div>
  );
}
