import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ListOrdered, Target } from "lucide-react";
import type { RLExerciseDefinition } from "../../../exercises/rlExerciseDefinitions";
import { useRLSimulatorStore } from "../../../store/rlSimulatorStore";

interface RLGrammarEnumerationExerciseProps {
  exercise: RLExerciseDefinition;
}

/**
 * Grammar → Language exercise workspace: the grammar is given (read-only) and
 * the learner lists the words it generates. The answer lives in the store
 * (keyed by exercise id) so it survives leaving exercise mode. "Check solution"
 * validates the enumeration; "Load solution" reveals it.
 */
export function RLGrammarEnumerationExercise({
  exercise,
}: RLGrammarEnumerationExerciseProps) {
  const { t } = useTranslation();
  const studentWords = useRLSimulatorStore(
    (s) => s.exerciseDrafts[exercise.id] ?? "",
  );
  const setExerciseDraft = useRLSimulatorStore((s) => s.setExerciseDraft);
  const revealedEnumeration = useRLSimulatorStore(
    (s) => s.revealedEnumeration,
  );
  const consumeRevealedEnumeration = useRLSimulatorStore(
    (s) => s.consumeRevealedEnumeration,
  );

  // "Load solution" drops the revealed word list into the answer.
  useEffect(() => {
    if (revealedEnumeration === null) {
      return;
    }
    setExerciseDraft(exercise.id, revealedEnumeration);
    consumeRevealedEnumeration();
  }, [
    revealedEnumeration,
    exercise.id,
    setExerciseDraft,
    consumeRevealedEnumeration,
  ]);

  const givenGrammar = exercise.seed.grammarSource ?? "";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-xl p-5 ring-1">
        <h4 className="text-foreground flex items-center gap-2 text-sm font-bold">
          <ListOrdered className="text-primary h-4 w-4" />
          {t("rl.exerciseWorkspace.g2lGivenGrammar", "Given Grammar")}
        </h4>
        <pre className="bg-muted/40 text-foreground/90 overflow-x-auto rounded-md p-3 font-mono text-sm leading-relaxed whitespace-pre">
          {givenGrammar || "—"}
        </pre>
        <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <Target className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{t(exercise.goalKey)}</span>
        </div>
      </div>

      <div className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-xl p-5 ring-1">
        <h4 className="text-foreground flex items-center gap-2 text-sm font-bold">
          {t("rl.exerciseWorkspace.g2lYourEnumeration", "Your Enumeration")}
        </h4>
        <textarea
          value={studentWords}
          onChange={(e) => setExerciseDraft(exercise.id, e.target.value)}
          spellCheck={false}
          data-testid="rl-g2l-enumeration-input"
          placeholder={t(
            "rl.exerciseWorkspace.g2lPlaceholder",
            "e.g. 100, 101, 110",
          )}
          className="border-input bg-background focus:ring-primary min-h-[140px] w-full rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
        />
        <p className="text-muted-foreground text-xs leading-relaxed">
          {t(
            "rl.exerciseWorkspace.g2lHelp",
            "List the words the grammar generates, separated by commas or new lines. Use ε for the empty word, then press Check Solution.",
          )}
        </p>
      </div>
    </div>
  );
}
