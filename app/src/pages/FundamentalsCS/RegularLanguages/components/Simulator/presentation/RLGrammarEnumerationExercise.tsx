import { useTranslation } from "react-i18next";
import { ListOrdered } from "lucide-react";
import type { RLExerciseDefinition } from "../../../exercises/rlExerciseDefinitions";

interface RLGrammarEnumerationExerciseProps {
  exercise: RLExerciseDefinition;
  value: string;
  onChange: (value: string) => void;
}

/** Exercise view: the given grammar beside the word list the learner writes. */
export function RLGrammarEnumerationExercise({
  exercise,
  value,
  onChange,
}: RLGrammarEnumerationExerciseProps) {
  const { t } = useTranslation();
  const givenGrammar = exercise.seed.grammarSource ?? "";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="border-border bg-card flex flex-col gap-3 rounded-xl border p-5">
        <h4 className="text-foreground flex items-center gap-2 text-sm font-bold">
          <ListOrdered className="text-primary h-4 w-4" />
          {t(
            "regular-languages.exerciseWorkspace.g2lGivenGrammar",
            "Given Grammar",
          )}
        </h4>
        <pre className="bg-muted/40 text-foreground/90 overflow-x-auto rounded-md p-3 font-mono text-sm leading-relaxed whitespace-pre">
          {givenGrammar || "—"}
        </pre>
      </div>

      <div className="border-border bg-card flex flex-col gap-3 rounded-xl border p-5">
        <h4 className="text-foreground flex items-center gap-2 text-sm font-bold">
          {t(
            "regular-languages.exerciseWorkspace.g2lYourEnumeration",
            "Your Enumeration",
          )}
        </h4>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          data-testid="rl-g2l-enumeration-input"
          placeholder={t(
            "regular-languages.exerciseWorkspace.g2lPlaceholder",
            "e.g. 100, 101, 110",
          )}
          className="border-input bg-background focus:ring-primary min-h-[140px] w-full rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
        />
        <p className="text-muted-foreground text-xs leading-relaxed">
          {t(
            "regular-languages.exerciseWorkspace.g2lHelp",
            "List the words the grammar generates, separated by commas or new lines. Use ε or epsilon for the empty word, then press Check Solution.",
          )}
        </p>
      </div>
    </div>
  );
}
