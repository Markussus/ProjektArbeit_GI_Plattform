import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatDnfTerm, type DnfDerivation } from "../domain/dnfDerivation";
import type { TruthTable } from "../domain/truthTable";

const DERIVATION_COMPACT_STEP_LIMIT = 12;

interface DnfDerivationStepsProps {
  derivation: DnfDerivation;
  truthTable?: TruthTable;
}

export function DnfDerivationSteps({
  derivation,
  truthTable,
}: DnfDerivationStepsProps) {
  const { t } = useTranslation();
  const [showFullDerivation, setShowFullDerivation] = useState(false);

  if (derivation.dnf.type === "constant") {
    return (
      <section className="border-border bg-card rounded-lg border p-4">
        <h2 className="text-foreground text-lg font-semibold">
          {t("dnf.builder.derivationTitle")}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {derivation.dnf.value
            ? t("dnf.builder.derivationTautology")
            : t("dnf.builder.derivationContradiction")}
        </p>
      </section>
    );
  }

  const isLargeDerivation =
    derivation.dnf.terms.length > DERIVATION_COMPACT_STEP_LIMIT;
  const isCompactDerivation = isLargeDerivation && !showFullDerivation;

  return (
    <section className="border-border bg-card rounded-lg border p-4">
      <h2 className="text-foreground text-lg font-semibold">
        {t("dnf.builder.derivationTitle")}
      </h2>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {t("dnf.builder.derivationHint")}
      </p>

      {isLargeDerivation && (
        <div className="border-border bg-muted/40 mt-4 rounded-md border p-3">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {showFullDerivation
              ? t("dnf.builder.derivationFull", {
                  total: derivation.dnf.terms.length,
                })
              : t("dnf.builder.derivationCompact", {
                  total: derivation.dnf.terms.length,
                })}
          </p>
          <button
            type="button"
            onClick={() => setShowFullDerivation((current) => !current)}
            className="border-border hover:bg-muted mt-3 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
          >
            {showFullDerivation ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
            {showFullDerivation
              ? t("dnf.builder.showCompactDerivation")
              : t("dnf.builder.showFullDerivation")}
          </button>
        </div>
      )}

      <ol
        className={cn(
          "mt-4 space-y-2",
          isCompactDerivation && "max-h-[32rem] overflow-y-auto pr-1",
        )}
      >
        {derivation.dnf.terms.map((term, index) => {
          const rowNumber = getDerivationRowNumber(
            derivation,
            truthTable,
            index,
          );

          return (
            <li
              key={index}
              className="border-border bg-muted/40 grid gap-2 rounded-md border px-3 py-2 text-sm sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center"
            >
              <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {t("dnf.builder.derivationRowLabel", { row: rowNumber })}
              </span>
              <code className="text-foreground font-mono">
                {formatDnfTerm(term)}
              </code>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function getDerivationRowNumber(
  derivation: DnfDerivation,
  truthTable: TruthTable | undefined,
  termIndex: number,
): number {
  const row = derivation.trueRows[termIndex];

  if (!truthTable || !row) {
    return termIndex + 1;
  }

  const rowIndex = truthTable.rows.indexOf(row);

  return rowIndex >= 0 ? rowIndex + 1 : termIndex + 1;
}
