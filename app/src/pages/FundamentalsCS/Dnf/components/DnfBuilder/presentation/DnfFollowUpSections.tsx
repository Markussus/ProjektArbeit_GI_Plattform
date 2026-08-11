import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { DnfFollowUpConfiguration } from "../application/dnfFollowUp";
import {
  deriveDnfFromTruthTable,
  formatDnfExpression,
} from "../domain/dnfDerivation";
import { DnfSimplificationPanel } from "./DnfSimplificationPanel";

type DnfFollowUpSectionsProps = Pick<
  DnfFollowUpConfiguration,
  "simplification"
> & {
  initiallyOpenSimplification?: boolean;
};

export function DnfFollowUpSections({
  simplification,
  initiallyOpenSimplification = false,
}: DnfFollowUpSectionsProps) {
  const { t } = useTranslation();
  const isSimplificationEnabled = simplification.isEnabled === true;
  const [isSimplificationOpen, setIsSimplificationOpen] = useState(
    initiallyOpenSimplification && isSimplificationEnabled,
  );

  return (
    <section data-testid="dnf-follow-up-sections" className="space-y-4">
      <h2 className="text-foreground text-lg font-semibold">
        {t("dnf.builder.followUpTitle")}
      </h2>

      <div className="space-y-3">
        <button
          type="button"
          data-testid="dnf-follow-up-simplification-toggle"
          disabled={!isSimplificationEnabled}
          aria-expanded={isSimplificationEnabled && isSimplificationOpen}
          aria-controls="dnf-follow-up-simplification"
          onClick={() => setIsSimplificationOpen((current) => !current)}
          className={cn(
            "border-border bg-card hover:bg-muted/40 flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
            isSimplificationEnabled && isSimplificationOpen && "border-brand",
            !isSimplificationEnabled &&
              "hover:bg-card cursor-not-allowed opacity-50",
          )}
        >
          <span className="text-foreground text-sm font-semibold">
            {t("dnf.builder.exercise.simplificationTitle")}
          </span>
          {isSimplificationOpen ? (
            <ChevronUp className="text-muted-foreground size-4 shrink-0" />
          ) : (
            <ChevronDown className="text-muted-foreground size-4 shrink-0" />
          )}
        </button>

        {isSimplificationOpen && isSimplificationEnabled && (
          <div
            id="dnf-follow-up-simplification"
            data-testid="dnf-follow-up-simplification"
          >
            <DnfSimplificationPanel
              canonicalDnf={formatDnfExpression(
                deriveDnfFromTruthTable(simplification.truthTable).dnf,
              )}
              truthTable={simplification.truthTable}
              simplificationAnswer={simplification.controls.answer}
              feedback={simplification.controls.feedback}
              showSolution={simplification.controls.showSolution}
              onAnswerChange={simplification.controls.onAnswerChange}
              onCheck={simplification.controls.onCheck}
              onToggleSolution={simplification.controls.onToggleSolution}
            />
          </div>
        )}
      </div>
    </section>
  );
}
