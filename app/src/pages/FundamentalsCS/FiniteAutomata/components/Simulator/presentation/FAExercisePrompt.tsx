import { useTranslation } from "react-i18next";
import type { FAExerciseDefinition } from "../../../exercises/faExerciseDefinitions";

interface FAExercisePromptProps {
  exercise: FAExerciseDefinition;
}

/**
 * The regular grammar for the "build an automaton from this grammar" exercise
 * family, whose task text reads "the grammar below". Every other exercise is
 * already stated in full by the selected-exercise card above the workspace, so
 * this renders nothing rather than repeating it.
 */
export function FAExercisePrompt({ exercise }: FAExercisePromptProps) {
  const { t } = useTranslation();

  if (!exercise.grammar) {
    return null;
  }

  return (
    <div
      data-testid="fa-exercise-prompt"
      className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-xl p-5 ring-1 md:mr-24"
    >
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
    </div>
  );
}
