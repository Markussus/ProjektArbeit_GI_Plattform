import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DnfResultPanelProps {
  formattedDnf: string;
  variableCount: number;
  rowCount: number;
  trueRowCount: number;
}

export function DnfResultPanel({
  formattedDnf,
  variableCount,
  rowCount,
  trueRowCount,
}: DnfResultPanelProps) {
  const { t } = useTranslation();

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

      <code className="border-border bg-card text-foreground mt-4 block rounded-md border p-3 font-mono text-sm leading-relaxed break-words">
        {formattedDnf}
      </code>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-md border p-3">
          <dt className="text-muted-foreground">
            {t("dnf.builder.variables")}
          </dt>
          <dd className="text-foreground mt-1 font-semibold">
            {variableCount}
          </dd>
        </div>
        <div className="rounded-md border p-3">
          <dt className="text-muted-foreground">{t("dnf.builder.rows")}</dt>
          <dd className="text-foreground mt-1 font-semibold">{rowCount}</dd>
        </div>
        <div className="rounded-md border p-3">
          <dt className="text-muted-foreground">
            {t("dnf.builder.oneRows")}
          </dt>
          <dd className="text-foreground mt-1 font-semibold">
            {trueRowCount}
          </dd>
        </div>
      </dl>
    </section>
  );
}
