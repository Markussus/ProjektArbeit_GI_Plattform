import { ArrowRight, CheckCircle2, Lightbulb, Table2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ModuleExamplesTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";

const truthTableRows = [
  { assignment: "a=0, b=0, c=0", result: "0", term: null },
  { assignment: "a=0, b=0, c=1", result: "0", term: null },
  { assignment: "a=0, b=1, c=0", result: "0", term: null },
  { assignment: "a=0, b=1, c=1", result: "1", term: "¬a ∧ b ∧ c" },
  { assignment: "a=1, b=0, c=0", result: "1", term: "a ∧ ¬b ∧ ¬c" },
  { assignment: "a=1, b=0, c=1", result: "1", term: "a ∧ ¬b ∧ c" },
  { assignment: "a=1, b=1, c=0", result: "1", term: "a ∧ b ∧ ¬c" },
  { assignment: "a=1, b=1, c=1", result: "1", term: "a ∧ b ∧ c" },
];

const canonicalDnf =
  "(¬a ∧ b ∧ c) ∨ (a ∧ ¬b ∧ ¬c) ∨ (a ∧ ¬b ∧ c) ∨ (a ∧ b ∧ ¬c) ∨ (a ∧ b ∧ c)";

export function ExamplesTab(props: ModuleExamplesTabProps) {
  void props;
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
        <h3 className="text-foreground text-lg font-semibold">
          {t("dnf.examplesTitle")}
        </h3>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          {t("dnf.examplesIntro")}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
          <div className="flex items-center gap-3">
            <div className="bg-module-rose-bg text-module-rose-fg flex size-9 shrink-0 items-center justify-center rounded-md">
              <Lightbulb className="size-4" />
            </div>
            <h3 className="text-foreground text-base font-semibold">
              {t("dnf.exampleExpressionTitle")}
            </h3>
          </div>

          <code className="border-border bg-background/60 mt-4 block rounded-lg border p-3 font-mono text-sm">
            a ∨ (b ∧ c)
          </code>

          <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
            {t("dnf.exampleExpressionText")}
          </p>
        </section>

        <section className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
          <div className="flex items-center gap-3">
            <div className="bg-module-rose-bg text-module-rose-fg flex size-9 shrink-0 items-center justify-center rounded-md">
              <Table2 className="size-4" />
            </div>
            <h3 className="text-foreground text-base font-semibold">
              {t("dnf.exampleTableTitle")}
            </h3>
          </div>

          <div className="border-border mt-4 overflow-hidden rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">
                    {t("dnf.exampleAssignment")}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t("dnf.exampleResult")}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t("dnf.exampleTerm")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {truthTableRows.map((row) => (
                  <tr
                    key={row.assignment}
                    className={`border-border border-t ${
                      row.result === "0"
                        ? "text-muted-foreground bg-muted/20"
                        : "text-foreground"
                    }`}
                  >
                    <td className="px-3 py-2 font-mono">{row.assignment}</td>
                    <td className="px-3 py-2 font-mono">{row.result}</td>
                    <td className="px-3 py-2 font-mono">
                      {row.term ?? t("dnf.exampleIgnored")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
          <div className="flex items-center gap-3">
            <div className="bg-module-rose-bg text-module-rose-fg flex size-9 shrink-0 items-center justify-center rounded-md">
              <ArrowRight className="size-4" />
            </div>
            <h3 className="text-foreground text-base font-semibold">
              {t("dnf.exampleResultTitle")}
            </h3>
          </div>

          <code className="border-border bg-background/60 mt-4 block rounded-lg border p-3 font-mono text-sm leading-relaxed">
            {canonicalDnf}
          </code>
        </section>

        <section className="bg-card ring-foreground/10 rounded-xl p-6 ring-1">
          <div className="flex items-center gap-3">
            <div className="bg-module-rose-bg text-module-rose-fg flex size-9 shrink-0 items-center justify-center rounded-md">
              <CheckCircle2 className="size-4" />
            </div>
            <h3 className="text-foreground text-base font-semibold">
              {t("dnf.exampleRuleTitle")}
            </h3>
          </div>

          <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
            {t("dnf.exampleRuleText")}
          </p>
        </section>
      </div>
    </div>
  );
}
