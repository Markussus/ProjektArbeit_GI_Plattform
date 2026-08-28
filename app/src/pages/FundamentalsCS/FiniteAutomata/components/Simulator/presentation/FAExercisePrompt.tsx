import { useTranslation } from "react-i18next";
import { Target } from "lucide-react";
import type { FAExerciseDefinition } from "../../../exercises/faExerciseDefinitions";

interface FAExercisePromptProps {
  exercise: FAExerciseDefinition;
}

/**
 * The problem statement for an open Finite Automata exercise: the goal, plus
 * the regular grammar for the "build an automaton from this grammar" family.
 * Without it those exercises say "the grammar below" with nothing below.
 */
export function FAExercisePrompt({ exercise }: FAExercisePromptProps) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="fa-exercise-prompt"
      className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-xl p-5 ring-1"
    >
      {/* The goal comes first: several goals read "…the grammar below". */}
      <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
        <Target className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>{t(exercise.goalKey)}</span>
      </div>

      {exercise.grammar && (
        <>
          <h4 className="text-foreground text-sm font-bold">
            {t("finite-automata.exerciseWorkspace.grammarLabel", "Grammar")}
          </h4>
          <pre
            data-testid="fa-exercise-grammar"
            className="bg-muted/40 text-foreground/90 overflow-x-auto rounded-md p-3 font-mono text-sm leading-relaxed whitespace-pre"
          >
            {exercise.grammar}
          </pre>
          <p className="text-muted-foreground text-xs">
            {t(
              "finite-automata.exerciseWorkspace.grammarEpsilonNote",
              "ε represents the empty word and marks an accepting (final) state.",
            )}
          </p>
        </>
      )}
    </div>
  );
}
