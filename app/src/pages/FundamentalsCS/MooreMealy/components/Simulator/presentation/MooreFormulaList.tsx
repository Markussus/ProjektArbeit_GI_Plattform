import { useTranslation } from "react-i18next";
import type { MooreFormula } from "../domain/mooreConversion";

interface MooreFormulaListProps {
  formulas: MooreFormula[];
}

export function MooreFormulaList({ formulas }: MooreFormulaListProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <h3 className="font-semibold">{t("moore.conversion.canonicalDnf")}</h3>
        {formulas.map((formula) => (
          <FormulaRow
            key={`canonical-${formula.name}`}
            name={formula.name}
            value={formula.canonical}
          />
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">{t("moore.conversion.minimalDnf")}</h3>
        {formulas.map((formula) => (
          <div key={`minimal-${formula.name}`}>
            <FormulaRow name={formula.name} value={formula.minimal} />
            {!formula.minimizationAvailable && (
              <p className="text-muted-foreground mt-1 text-xs">
                {t("moore.conversion.minimizationLimit")}
              </p>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

function FormulaRow({ name, value }: { name: string; value: string }) {
  return (
    <div className="border-border bg-card grid grid-cols-[3rem_minmax(0,1fr)] gap-3 rounded-lg border p-3">
      <span className="text-brand font-mono font-bold">{name} =</span>
      <code className="overflow-x-auto font-mono text-sm whitespace-nowrap">
        {value}
      </code>
    </div>
  );
}
