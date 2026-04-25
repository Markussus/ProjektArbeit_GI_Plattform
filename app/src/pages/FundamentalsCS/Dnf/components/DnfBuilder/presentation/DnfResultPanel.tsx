import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDnfTerm, type DnfDerivation } from "../domain/dnfDerivation";

interface DnfResultPanelProps {
  formattedDnf: string;
  variableCount: number;
  rowCount: number;
  trueRowCount: number;
  derivation?: DnfDerivation;
}

export function DnfResultPanel({
  formattedDnf,
  variableCount,
  rowCount,
  trueRowCount,
  derivation,
}: DnfResultPanelProps) {
  const { t } = useTranslation();
  const terms =
    derivation?.dnf.type === "terms"
      ? derivation.dnf.terms.map(formatDnfTerm)
      : null;
  const stats = [
    { label: t("dnf.builder.variables"), value: variableCount },
    { label: t("dnf.builder.rows"), value: rowCount },
    { label: t("dnf.builder.oneRows"), value: trueRowCount },
  ];

  return (
    <section className="border-border bg-background/40 rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className="bg-module-rose-bg text-module-rose-fg flex size-9 shrink-0 items-center justify-center rounded-md">
          <CheckCircle2 className="size-5" />
        </div>
        <div>
          <h2 className="text-foreground text-lg font-semibold">
            {t("dnf.builder.resultTitle")}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t("dnf.builder.resultHint")}
          </p>
        </div>
      </div>

      {terms && terms.length > 1 ? (
        <div className="border-border bg-card mt-4 rounded-md border p-3">
          <div className="flex flex-wrap items-center gap-2">
            {terms.map((term, index) => (
              <span
                key={`${term}-${index}`}
                className="inline-flex items-center gap-2"
              >
                <span className="border-border bg-background rounded-md border px-2.5 py-1 font-mono text-sm">
                  {term}
                </span>
                {index < terms.length - 1 && (
                  <span className="text-muted-foreground font-mono text-sm">
                    ∨
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <code className="border-border bg-card text-foreground mt-4 block rounded-md border p-3 font-mono text-sm leading-relaxed break-words">
          {formattedDnf}
        </code>
      )}

      <div className="border-border text-muted-foreground mt-4 border-l-2 py-1 pl-3 text-xs leading-relaxed">
        {t("dnf.builder.resultRuleHint")}
      </div>

      <dl className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-3 text-sm">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-md border p-3">
            <dt className="text-muted-foreground text-xs leading-snug font-medium sm:text-sm">
              {stat.label}
            </dt>
            <dd className="text-foreground mt-1 font-semibold">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
