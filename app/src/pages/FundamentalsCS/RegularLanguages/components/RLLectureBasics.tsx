import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import {
  rlLectureExamples,
  type RLLectureExample,
} from "./Simulator/config/rlLectureExamples";

/**
 * "Lecture Basics" — introductory worked examples on the Examples tab. Each card
 * shows a grammar/language prompt and hides its solution behind a toggle, so
 * these stand apart from the simulator-launching predefined examples above.
 */
export function RLLectureBasics() {
  const { t } = useTranslation();

  return (
    <section>
      <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-foreground text-base font-bold">
              {t("rl.lectureBasics.sectionTitle", "Lecture Basics")}
            </h3>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {t(
                "rl.lectureBasics.sectionDescription",
                "Introductory worked examples from the lecture. Try each one, then reveal the solution.",
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {rlLectureExamples.map((example) => (
          <LectureCard key={example.id} example={example} />
        ))}
      </div>
    </section>
  );
}

function LectureCard({ example }: { example: RLLectureExample }) {
  const { t } = useTranslation();
  const [showSolution, setShowSolution] = useState(false);
  const isG2L = example.category === "grammarToLanguage";

  const promptLabel = t(
    isG2L ? "rl.exercises.givenGrammar" : "rl.exercises.targetLanguage",
  );
  const categoryLabel = t(
    isG2L
      ? "rl.exercises.categories.grammarToLanguage.title"
      : "rl.exercises.categories.languageToGrammar.title",
  );

  return (
    <div className="bg-card ring-foreground/10 rounded-xl p-5 ring-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-foreground text-sm font-semibold">
          {t(example.titleKey)}
        </p>
        <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs font-medium">
          {categoryLabel}
        </span>
      </div>

      <NotationBlock
        label={promptLabel}
        text={example.prompt}
        note={example.promptNoteKey ? t(example.promptNoteKey) : undefined}
      />

      <button
        type="button"
        onClick={() => setShowSolution((v) => !v)}
        aria-expanded={showSolution}
        data-testid={`rl-lecture-${example.id}-toggle`}
        className="border-border hover:bg-muted/50 focus-visible:ring-ring mt-3 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        {showSolution ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
        {showSolution
          ? t("rl.lectureBasics.hideSolution", "Hide Solution")
          : t("rl.lectureBasics.showSolution", "Show Solution")}
      </button>

      {showSolution && (
        <NotationBlock
          label={t("rl.exercises.solution", "Solution")}
          text={example.solution}
          note={
            example.solutionNoteKey ? t(example.solutionNoteKey) : undefined
          }
        />
      )}
    </div>
  );
}

/**
 * A monospaced grammar / language block. Appends a one-line legend when the
 * text uses "ε" so the empty word is unambiguous.
 */
function NotationBlock({
  label,
  text,
  note,
}: {
  label: string;
  text: string;
  note?: string;
}) {
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
      {note && (
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          {note}
        </p>
      )}
      {hasEpsilon && (
        <p className="text-muted-foreground/80 mt-1 text-xs">
          {t("rl.exercises.epsilonHint", "ε denotes the empty word.")}
        </p>
      )}
    </div>
  );
}
