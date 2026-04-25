import { useTranslation } from "react-i18next";
import { formatDnfTerm, type DnfDerivation } from "../domain/dnfDerivation";
import type { TruthTable } from "../domain/truthTable";

interface DnfDerivationStepsProps {
  derivation: DnfDerivation;
  truthTable?: TruthTable;
}

export function DnfDerivationSteps({
  derivation,
  truthTable,
}: DnfDerivationStepsProps) {
  const { t } = useTranslation();

  if (derivation.dnf.type === "constant") {
    return (
      <section className="border-border bg-background/40 rounded-lg border p-4">
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

  return (
    <section className="border-border bg-background/40 rounded-lg border p-4">
      <h2 className="text-foreground text-lg font-semibold">
        {t("dnf.builder.derivationTitle")}
      </h2>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {t("dnf.builder.derivationHint")}
      </p>

      <ol className="mt-4 space-y-2">
        {derivation.dnf.terms.map((term, index) => {
          const rowNumber = getDerivationRowNumber(
            derivation,
            truthTable,
            index,
          );

          return (
            <li
              key={index}
              className="border-border bg-card grid gap-2 rounded-md border px-3 py-2 text-sm sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center"
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
