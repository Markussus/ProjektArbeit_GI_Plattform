import { ArrowRight, Ban, BookOpen, Table2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  dnfWalkthroughExamples,
  type DnfWalkthroughExample,
  type DnfWalkthroughExampleId,
} from "../examples/walkthroughExamples";

const iconByExampleId: Record<DnfWalkthroughExampleId, typeof BookOpen> = {
  "lecture-expression": BookOpen,
  parentheses: Table2,
  negation: Ban,
  xor: ArrowRight,
};

export function ExamplesTab() {
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

      <div className="grid gap-4 xl:grid-cols-2">
        {dnfWalkthroughExamples.map((example) => (
          <WalkthroughCard key={example.id} example={example} />
        ))}
      </div>
    </div>
  );
}

function WalkthroughCard({ example }: { example: DnfWalkthroughExample }) {
  const { t } = useTranslation();
  const Icon = iconByExampleId[example.id];

  return (
    <article className="bg-card ring-foreground/10 flex flex-col rounded-xl p-5 ring-1">
      <div className="flex items-start gap-3">
        <div className="bg-module-rose-bg text-module-rose-fg flex size-9 shrink-0 items-center justify-center rounded-md">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-foreground text-base font-semibold">
            {t(example.titleKey)}
          </h3>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t(example.explanationKey)}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <LabeledCode
          label={t(example.expressionLabelKey)}
          value={example.expression}
        />

        <ExampleList
          title={t("dnf.examples.labels.oneRows")}
          items={example.oneRows}
        />

        <ExampleList
          title={t("dnf.examples.labels.terms")}
          items={example.terms}
          tone="muted"
        />

        <LabeledCode
          label={t("dnf.examples.labels.canonicalDnf")}
          value={example.canonicalDnf}
          variant="result"
        />
      </div>
    </article>
  );
}

function LabeledCode({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string;
  variant?: "default" | "result";
}) {
  return (
    <div>
      <p
        className={cn(
          "text-xs font-semibold tracking-wide uppercase",
          variant === "result" ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <code
        className={cn(
          "text-foreground mt-2 block overflow-x-auto rounded-md border p-3 font-mono text-sm leading-relaxed [overflow-wrap:anywhere] break-words whitespace-pre-wrap",
          variant === "result"
            ? "border-module-rose-fg/20 bg-module-rose-bg/40"
            : "border-border bg-background/60",
        )}
      >
        {value}
      </code>
    </div>
  );
}

function ExampleList({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "muted";
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className={cn(
              "border-border rounded-md border px-2.5 py-1 font-mono text-sm",
              tone === "muted"
                ? "bg-muted/30 text-muted-foreground"
                : "bg-background/60 text-foreground",
            )}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
