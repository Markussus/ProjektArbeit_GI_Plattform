import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  booleanAlgebraRules,
  type BooleanAlgebraRule,
} from "../domain/booleanAlgebraRules";

interface BooleanAlgebraReferenceProps {
  variant?: "page" | "panel";
  className?: string;
  showIntro?: boolean;
}

export function BooleanAlgebraReference({
  variant = "page",
  className,
  showIntro = true,
}: BooleanAlgebraReferenceProps) {
  const { t } = useTranslation();
  const isPanel = variant === "panel";

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {showIntro && (
        <div className="flex items-start gap-3">
          <div className="bg-module-rose-bg text-module-rose-fg flex size-9 shrink-0 items-center justify-center rounded-md">
            <BookOpen className="size-5" />
          </div>
          <div>
            <h3
              className={cn(
                "text-foreground font-semibold",
                isPanel ? "text-base" : "text-lg",
              )}
            >
              {t("dnf.algebra.title")}
            </h3>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              {t("dnf.algebra.intro")}
            </p>
          </div>
        </div>
      )}

      <ul
        className={cn(
          "grid gap-3",
          isPanel ? "sm:grid-cols-1" : "sm:grid-cols-2",
        )}
      >
        {booleanAlgebraRules.map((rule) => (
          <BooleanAlgebraRuleCard key={rule.id} rule={rule} variant={variant} />
        ))}
      </ul>
    </div>
  );
}

interface BooleanAlgebraRuleCardProps {
  rule: BooleanAlgebraRule;
  variant: "page" | "panel";
}

function BooleanAlgebraRuleCard({ rule, variant }: BooleanAlgebraRuleCardProps) {
  const { t } = useTranslation();
  const isPanel = variant === "panel";

  return (
    <li
      data-testid={`dnf-algebra-rule-${rule.id}`}
      className={cn(
        "border-border bg-background flex flex-col gap-2 rounded-md border p-3",
        isPanel && "bg-muted/30",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-foreground text-sm font-semibold">
          {t(rule.nameKey)}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {rule.formulas.map((formula) => (
          <code
            key={formula}
            className="text-foreground font-mono text-xs leading-relaxed break-words"
          >
            {formula}
          </code>
        ))}
      </div>
      <p className="text-muted-foreground text-xs leading-relaxed">
        {t(rule.exampleKey)}
      </p>
    </li>
  );
}
