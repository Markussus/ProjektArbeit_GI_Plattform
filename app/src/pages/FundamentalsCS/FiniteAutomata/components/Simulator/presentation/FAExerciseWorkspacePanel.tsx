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
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FAProgram } from "../domain/faTypes";
import {
  validateAgainstSolution,
  type ValidationResult,
} from "../domain/faExerciseValidation";
import { type FAExerciseDefinition } from "../../../exercises/faExerciseDefinitions";

interface FAExerciseWorkspacePanelProps {
  exercise: FAExerciseDefinition;
  /** The program currently in the editor (may be invalid). */
  studentProgram: FAProgram;
  /** Replace the editor program with the reference solution. */
  onLoadSolution: (program: FAProgram) => void;
  /** Load the given word into the simulator input field. */
  onLoadExampleWord: (word: string) => void;
  /** Detach this exercise and return to freeform editing. */
  onExit: () => void;
}

type CheckFeedback =
  | { kind: "unbuilt" }
  | { kind: "validation"; result: ValidationResult };

function isUnbuilt(program: FAProgram): boolean {
  // A "fresh starter" automaton has no accept states and no transitions.
  // Either signal alone is enough — both is an unmistakable empty editor.
  const noAccept = program.acceptStates.length === 0;
  const noTransitions = Object.values(program.transitions).every(
    (row) => Object.keys(row).length === 0,
  );
  return noAccept && noTransitions;
}

const DIFFICULTY_STYLES: Record<
  FAExerciseDefinition["difficulty"],
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

export function FAExerciseWorkspacePanel({
  exercise,
  studentProgram,
  onLoadSolution,
  onLoadExampleWord,
  onExit,
}: FAExerciseWorkspacePanelProps) {
  const { t } = useTranslation();

  // All exercise state is component-local — nothing about the user is stored
  // anywhere. Re-mounting the panel (key={exercise.id} on the parent) wipes
  // everything, so each open starts at 0/N hints with no revealed solution.
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [solutionRevealed, setSolutionRevealed] = useState(false);
  const [feedback, setFeedback] = useState<CheckFeedback | null>(null);
  const [confirmShowSolution, setConfirmShowSolution] = useState(false);

  const visibleHints = exercise.hintKeys.slice(0, hintsRevealed);
  const hasMoreHints = hintsRevealed < exercise.hintKeys.length;
  const difficultyStyle = DIFFICULTY_STYLES[exercise.difficulty];
  const isCompleted = feedback?.kind === "validation" && feedback.result.passed;

  const handleCheck = () => {
    // Bail out early when nothing has been built yet — the validator would
    // otherwise enumerate every word the solution accepts and report each
    // one as a counterexample, which is noise, not feedback.
    if (isUnbuilt(studentProgram)) {
      setFeedback({ kind: "unbuilt" });
      return;
    }
    const result = validateAgainstSolution(studentProgram, exercise.solution, {
      maxLen: exercise.maxTestLen ?? 4,
    });
    setFeedback({ kind: "validation", result });
  };

  const handleRevealHint = () => {
    setHintsRevealed((n) => Math.min(n + 1, exercise.hintKeys.length));
  };

  const handleShowSolution = () => {
    setSolutionRevealed(true);
    onLoadSolution(exercise.solution);
    setConfirmShowSolution(false);
  };

  return (
    <div className="bg-card ring-foreground/10 rounded-xl ring-1">
      {/* Header */}
      <div className="border-b px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-sm font-semibold">
              {t("simulation.selectedExercise")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Target className="text-primary h-4 w-4 shrink-0" />
              <h3 className="text-foreground text-sm font-bold">
                {t(exercise.titleKey, exercise.id)}
              </h3>
              <span
                className={cn(
                  "inline-flex rounded-md px-2 py-0.5 text-xs font-bold tracking-wider uppercase",
                  difficultyStyle.className,
                )}
              >
                {t(difficultyStyle.labelKey, exercise.difficulty)}
              </span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 rounded-md bg-green-500/15 px-2 py-0.5 text-xs font-bold text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("fa.exerciseWorkspace.completed", "Completed")}
                </span>
              )}
            </div>
            <p className="text-foreground/80 mt-2 text-sm font-medium">
              {t(exercise.goalKey, "")}
            </p>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {t(exercise.descriptionKey, "")}
            </p>
          </div>
          <button
            type="button"
            onClick={onExit}
            title={t("fa.exerciseWorkspace.exit", "Exit exercise mode")}
            className="text-muted-foreground hover:text-foreground rounded-md p-1.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Grammar prompt — for "construct an automaton from a grammar" tasks */}
        {exercise.grammar && (
          <div className="mt-4">
            <p className="text-muted-foreground/80 mb-1 text-xs font-medium tracking-wide uppercase">
              {t("fa.exerciseWorkspace.grammarLabel", "Grammar")}
            </p>
            <pre className="bg-muted/40 text-foreground ring-foreground/10 overflow-x-auto rounded-md p-3 font-mono text-sm leading-relaxed ring-1 ring-inset">
              {exercise.grammar}
            </pre>
            {exercise.grammar.includes("ε") && (
              <p className="text-muted-foreground/80 mt-1 text-xs">
                {t(
                  "fa.exerciseWorkspace.grammarEpsilonNote",
                  "ε denotes the empty word, which marks an accepting (final) state.",
                )}
              </p>
            )}
          </div>
        )}

        {/* Actions row — integrated directly into the exercise card */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCheck}
            className="bg-brand text-brand-foreground inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold hover:opacity-90"
          >
            <CheckCircle2 className="h-4 w-4" />
            {t("fa.exerciseWorkspace.check", "Check Solution")}
          </button>

          <button
            type="button"
            onClick={handleRevealHint}
            disabled={!hasMoreHints}
            className="inline-flex items-center gap-2 rounded-md bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-amber-400"
          >
            <Lightbulb className="h-4 w-4" />
            {hasMoreHints
              ? t("fa.exerciseWorkspace.showHint", "Hint")
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

          <span className="text-muted-foreground ml-1 text-xs font-semibold tracking-wide uppercase">
            {t(
              "fa.exerciseWorkspace.hintsUsed",
              "{{used}}/{{total}} Hints Used",
              {
                used: hintsRevealed,
                total: exercise.hintKeys.length,
              },
            )}
          </span>
        </div>
      </div>

      {/* Revealed hints */}
      {visibleHints.length > 0 && (
        <div className="border-b px-5 py-3 sm:px-6">
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

      {/* Check Solution feedback */}
      {feedback && (
        <div className="border-b px-5 py-3 sm:px-6">
          {feedback.kind === "unbuilt" ? (
            <UnbuiltFeedback />
          ) : (
            <ValidationFeedback result={feedback.result} />
          )}
        </div>
      )}

      {/* Example words shown after the solution is revealed */}
      {solutionRevealed && exercise.exampleWords && (
        <div className="border-b px-5 py-3 sm:px-6">
          <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
            <PlayCircle className="h-3.5 w-3.5" />
            {t("fa.exerciseWorkspace.exampleWordsHeader", "Try these words")}
          </div>
          <p className="text-muted-foreground mb-2 text-xs">
            {t(
              "fa.exerciseWorkspace.exampleWordsHint",
              "Click a word to load it as the input and run it through the automaton.",
            )}
          </p>
          <ExampleWordsRow
            label={t("fa.exerciseWorkspace.exampleAccept", "Accepted")}
            words={exercise.exampleWords.accept}
            onSelect={onLoadExampleWord}
            tone="accept"
          />
          <ExampleWordsRow
            label={t("fa.exerciseWorkspace.exampleReject", "Rejected")}
            words={exercise.exampleWords.reject}
            onSelect={onLoadExampleWord}
            tone="reject"
          />
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
   Example words row used when the solution is revealed
   ────────────────────────────────────────────────────────── */

function ExampleWordsRow({
  label,
  words,
  onSelect,
  tone,
}: {
  label: string;
  words: string[];
  onSelect: (word: string) => void;
  tone: "accept" | "reject";
}) {
  // Strip empty words — the simulator does not show epsilon as a test input.
  const visibleWords = words.filter((w) => w.length > 0);
  if (visibleWords.length === 0) return null;
  const toneClass =
    tone === "accept"
      ? "border-green-500/30 bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:text-green-400"
      : "border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-400";

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-xs font-semibold">
        {label}:
      </span>
      {visibleWords.map((word) => (
        <button
          key={word}
          type="button"
          onClick={() => onSelect(word)}
          className={cn(
            "rounded-md border px-2 py-0.5 font-mono text-xs font-medium transition-colors",
            toneClass,
          )}
        >
          {word}
        </button>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Empty-editor feedback — shown when the student hasn't built
   anything yet, so the per-word counterexamples would be noise.
   ────────────────────────────────────────────────────────── */

function UnbuiltFeedback() {
  const { t } = useTranslation();
  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
      <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4" />
        {t("fa.exerciseWorkspace.unbuiltTitle", "Build your automaton first")}
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        {t(
          "fa.exerciseWorkspace.unbuiltBody",
          "Add states, transitions, and at least one accept state, then run Check Solution again.",
        )}
      </p>
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
