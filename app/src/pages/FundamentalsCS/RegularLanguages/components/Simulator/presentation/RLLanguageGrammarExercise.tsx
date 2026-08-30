import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";
import type { RLExerciseDefinition } from "../../../exercises/rlExerciseDefinitions";
import { RLGrammarInputCard } from "./RLGrammarInputCard";

interface RLLanguageGrammarExerciseProps {
  exercise: RLExerciseDefinition;
  value: string;
  onChange: (value: string) => void;
}

export function RLLanguageGrammarExercise({
  exercise,
  value,
  onChange,
}: RLLanguageGrammarExerciseProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="border-border bg-card flex flex-col gap-3 rounded-xl border p-5">
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
      </div>

      <div className="flex flex-col gap-3">
        <RLGrammarInputCard
          value={value}
          onChange={onChange}
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
