import { Lightbulb, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DnfExample, DnfExampleId } from "../application/useDnfBuilder";

interface DnfInputPanelProps {
  source: string;
  examples: DnfExample[];
  isExerciseMode: boolean;
  onSourceChange: (source: string) => void;
  onLoadExample: (source: string) => void;
  onReset: () => void;
}

const exampleLabelKeyById: Record<DnfExampleId, string> = {
  lectureExample: "dnf.builder.examples.lectureExample",
  alreadyDnf: "dnf.builder.examples.alreadyDnf",
  xorExample: "dnf.builder.examples.xorExample",
};

export function DnfInputPanel({
  source,
  examples,
  isExerciseMode,
  onSourceChange,
  onLoadExample,
  onReset,
}: DnfInputPanelProps) {
  const { t } = useTranslation();

  return (
    <section className="border-border bg-background/40 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-foreground text-lg font-semibold">
            {t("dnf.builder.inputTitle")}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("dnf.builder.inputHint")}
          </p>
        </div>

        {!isExerciseMode && (
          <button
            type="button"
            onClick={onReset}
            className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
          >
            <RotateCcw className="size-4" />
            {t("dnf.builder.reset")}
          </button>
        )}
      </div>

      <label className="sr-only" htmlFor="dnf-expression-input">
        {t("dnf.builder.inputLabel")}
      </label>
      <textarea
        id="dnf-expression-input"
        value={source}
        onChange={(event) => onSourceChange(event.target.value)}
        readOnly={isExerciseMode}
        spellCheck="false"
        className="border-border bg-card text-foreground focus:ring-ring mt-4 min-h-28 w-full resize-y rounded-md border p-3 font-mono text-sm leading-relaxed read-only:cursor-default read-only:opacity-80 focus:ring-2 focus:outline-none"
      />

      {!isExerciseMode && (
        <div className="mt-4 flex flex-wrap gap-2">
          {examples.map((example) => (
            <button
              key={example.id}
              type="button"
              onClick={() => onLoadExample(example.expression)}
              className="border-border hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <Lightbulb className="size-4" />
              {t(exampleLabelKeyById[example.id] as never)}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
