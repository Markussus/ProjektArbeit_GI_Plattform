import { useTranslation } from "react-i18next";

interface DnfExerciseTaskCardProps {
  source: string;
  requiresTruthTableAnswers: boolean;
  canEditTruthTableResults: boolean;
}

export function DnfExerciseTaskCard({
  source,
  requiresTruthTableAnswers,
  canEditTruthTableResults,
}: DnfExerciseTaskCardProps) {
  const { t } = useTranslation();

  return (
    <section
      data-testid="dnf-exercise-task"
      className="border-border bg-card rounded-lg border p-5"
    >
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {t("dnf.builder.exercise.taskTitle")}
      </p>
      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.65fr)]">
        <div>
          <p className="text-muted-foreground text-sm">
            {requiresTruthTableAnswers
              ? t("dnf.builder.exercise.given")
              : canEditTruthTableResults
                ? t("dnf.builder.exercise.buildTruthTable")
                : t("dnf.builder.exercise.givenTruthTable")}
          </p>
          {requiresTruthTableAnswers ? (
            <code className="border-border bg-muted/40 text-foreground mt-2 block rounded-md border p-3 font-mono text-sm">
              {source}
            </code>
          ) : canEditTruthTableResults ? (
            <div className="border-border bg-muted/40 text-foreground mt-2 rounded-md border p-3 text-sm leading-relaxed">
              {t("dnf.builder.exercise.chooseResultColumn")}
            </div>
          ) : (
            <div className="border-border bg-muted/40 text-foreground mt-2 rounded-md border p-3 text-sm leading-relaxed">
              {t("dnf.builder.exercise.findExpressionFromTable")}
            </div>
          )}
        </div>
        <div className="border-border bg-muted/40 rounded-md border p-3">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {t("dnf.builder.exercise.stepsTitle")}
          </p>
          <ol className="mt-3 space-y-2 text-sm leading-relaxed">
            <li className="flex gap-2">
              <span className="bg-brand text-brand-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                1
              </span>
              <span className="text-foreground">
                {requiresTruthTableAnswers
                  ? t("dnf.builder.exercise.instructionStepTable")
                  : canEditTruthTableResults
                    ? t("dnf.builder.exercise.instructionStepEditableTable")
                    : t("dnf.builder.exercise.instructionStepOneRows")}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="bg-brand text-brand-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                2
              </span>
              <span className="text-foreground">
                {requiresTruthTableAnswers
                  ? t("dnf.builder.exercise.instructionStepDnf")
                  : t("dnf.builder.exercise.instructionStepDnfFromTable")}
              </span>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
