import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type {
  DnfFollowUpConfiguration,
  DnfFollowUpSolution,
} from "../application/dnfFollowUp";
import {
  deriveDnfFromTruthTable,
  formatDnfExpression,
} from "../domain/dnfDerivation";
import { DnfResultPanel } from "./DnfResultPanel";
import { DnfSimplificationPanel } from "./DnfSimplificationPanel";
import { DnfTruthTableView } from "./DnfTruthTableView";

type DnfFollowUpSectionsProps = DnfFollowUpConfiguration;

export function DnfFollowUpSections({
  solution,
  simplification,
}: DnfFollowUpSectionsProps) {
  const { t } = useTranslation();
  const [isSimplificationOpen, setIsSimplificationOpen] = useState(false);

  if (!solution && !simplification) {
    return null;
  }

  const isSimplificationEnabled = simplification?.isEnabled === true;

  return (
    <div data-testid="dnf-follow-up-sections" className="space-y-6">
      {solution && <DnfSolutionBlock solution={solution} />}

      {simplification && (
        <section className="space-y-4">
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
                isSimplificationEnabled &&
                  isSimplificationOpen &&
                  "border-brand",
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
      )}
    </div>
  );
}

function DnfSolutionBlock({ solution }: { solution: DnfFollowUpSolution }) {
  const { t } = useTranslation();

  return (
    <section data-testid="dnf-follow-up-solution" className="space-y-4">
      <h2 className="text-foreground text-lg font-semibold">
        {t("dnf.builder.solutionTitle")}
      </h2>
      <DnfResultPanel
        formattedDnf={solution.formattedDnf}
        variableCount={solution.variableCount}
        rowCount={solution.rowCount}
        trueRowCount={solution.trueRowCount}
        derivation={solution.derivation}
      />
      {solution.display && (
        <DnfTruthTableView
          display={solution.display}
          resultHeader={solution.resultHeader}
        />
      )}
    </section>
  );
}
