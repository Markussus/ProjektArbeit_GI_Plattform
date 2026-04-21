import { useTranslation } from "react-i18next";
import {
  formatDnfTerm,
  type DnfDerivation,
} from "../domain/dnfDerivation";

interface DnfDerivationStepsProps {
  derivation: DnfDerivation;
}

export function DnfDerivationSteps({
  derivation,
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
        {derivation.dnf.terms.map((term, index) => (
          <li
            key={index}
            className="border-border bg-card rounded-md border px-3 py-2 font-mono text-sm"
          >
            {formatDnfTerm(term)}
          </li>
        ))}
      </ol>
    </section>
  );
}
