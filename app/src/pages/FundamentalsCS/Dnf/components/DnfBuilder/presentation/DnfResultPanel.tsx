import { useLayoutEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatDnfTerm, type DnfDerivation } from "../domain/dnfDerivation";

const RESULT_COMPACT_TERM_LIMIT = 12;

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
  const [showFullResult, setShowFullResult] = useState(false);
  const resultContainerRef = useRef<HTMLDivElement>(null);
  const [isResultOverflowing, setIsResultOverflowing] = useState(false);
  const terms =
    derivation?.dnf.type === "terms"
      ? derivation.dnf.terms.map(formatDnfTerm)
      : null;
  const isLargeResult = Boolean(
    terms && terms.length > RESULT_COMPACT_TERM_LIMIT,
  );
  const isCompactResult = isLargeResult && !showFullResult;
  const canToggleResult =
    isLargeResult && (isResultOverflowing || showFullResult);
  const stats = [
    { label: t("dnf.builder.variables"), value: variableCount },
    { label: t("dnf.builder.rows"), value: rowCount },
    { label: t("dnf.builder.oneRows"), value: trueRowCount },
  ];

  useLayoutEffect(() => {
    if (!isLargeResult || showFullResult) return;

    const element = resultContainerRef.current;
    if (!element) return;

    const updateOverflow = () => {
      setIsResultOverflowing(element.scrollHeight > element.clientHeight + 1);
    };

    const frameId = window.requestAnimationFrame(updateOverflow);

    const resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(element);
    window.addEventListener("resize", updateOverflow);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateOverflow);
    };
  }, [isLargeResult, showFullResult, terms]);

  return (
    <section
      data-testid="dnf-result-panel"
      className="border-border bg-card rounded-lg border p-4"
    >
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

      {canToggleResult && terms && (
        <div className="border-border bg-muted/40 mt-4 rounded-md border p-3">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {showFullResult
              ? t("dnf.builder.resultFull", { total: terms.length })
              : t("dnf.builder.resultCompact", { total: terms.length })}
          </p>
          <button
            type="button"
            data-testid="dnf-result-toggle"
            onClick={() => setShowFullResult((current) => !current)}
            className="border-border hover:bg-muted mt-3 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
          >
            {showFullResult ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
            {showFullResult
              ? t("dnf.builder.showCompactResult")
              : t("dnf.builder.showFullResult")}
          </button>
        </div>
      )}

      {terms && terms.length > 1 ? (
        <div
          ref={resultContainerRef}
          className={cn(
            "border-border bg-muted/40 mt-4 rounded-md border p-3",
            isCompactResult && "max-h-[32rem] overflow-y-auto pr-1",
          )}
        >
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
        <code className="border-border bg-muted/40 text-foreground mt-4 block rounded-md border p-3 font-mono text-sm leading-relaxed break-words">
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
