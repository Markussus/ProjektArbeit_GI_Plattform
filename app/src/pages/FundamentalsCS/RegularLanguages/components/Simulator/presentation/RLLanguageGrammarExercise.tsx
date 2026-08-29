import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Target } from "lucide-react";
import type { RLExerciseDefinition } from "../../../exercises/rlExerciseDefinitions";
import { useRLSimulatorStore } from "../../../store/rlSimulatorStore";
import { RLGrammarInputCard } from "./RLGrammarInputCard";

interface RLLanguageGrammarExerciseProps {
  exercise: RLExerciseDefinition;
}

/**
 * Language → Grammar exercise workspace: the target language is given
 * (read-only) and the learner writes a right-linear grammar for it. The answer
 * lives in the store (keyed by exercise id) so it survives leaving exercise
 * mode. "Check solution" validates the grammar; "Load solution" reveals a
 * reference grammar.
 */
export function RLLanguageGrammarExercise({
  exercise,
}: RLLanguageGrammarExerciseProps) {
  const { t } = useTranslation();
  const grammar = useRLSimulatorStore(
    (s) => s.exerciseDrafts[exercise.id] ?? "",
  );
  const setExerciseDraft = useRLSimulatorStore((s) => s.setExerciseDraft);
  const revealedGrammar = useRLSimulatorStore((s) => s.revealedGrammar);
  const consumeRevealedGrammar = useRLSimulatorStore(
    (s) => s.consumeRevealedGrammar,
  );

  // "Load solution" drops the reference grammar into the editor.
  useEffect(() => {
    if (revealedGrammar === null) {
      return;
    }
    setExerciseDraft(exercise.id, revealedGrammar);
    consumeRevealedGrammar();
  }, [revealedGrammar, exercise.id, setExerciseDraft, consumeRevealedGrammar]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-xl p-5 ring-1">
        <h4 className="text-foreground flex items-center gap-2 text-sm font-bold">
          <FileText className="text-primary h-4 w-4" />
          {t(
            "regular-languages.exerciseWorkspace.l2gTargetLanguage",
            "Target Language",
          )}
        </h4>
        <pre className="bg-muted/40 text-foreground/90 overflow-x-auto rounded-md p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap">
          {exercise.prompt}
        </pre>
        <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <Target className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{t(exercise.goalKey)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <RLGrammarInputCard
          value={grammar}
          onChange={(value) => setExerciseDraft(exercise.id, value)}
          titleKey="regular-languages.exerciseWorkspace.l2gYourGrammar"
          titleFallback="Your Grammar"
        >
          <p className="text-muted-foreground text-xs leading-relaxed">
            {t(
              "regular-languages.exerciseWorkspace.l2gHelp",
              "Write a right-linear grammar that generates the target language, then press Check Solution.",
            )}
          </p>
        </RLGrammarInputCard>
      </div>
    </div>
  );
}
