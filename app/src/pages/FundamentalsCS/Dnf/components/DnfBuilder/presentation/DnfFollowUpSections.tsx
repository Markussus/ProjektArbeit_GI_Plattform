import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { DnfFollowUpConfiguration } from "../application/dnfFollowUp";
import {
  deriveDnfFromTruthTable,
  formatDnfExpression,
} from "../domain/dnfDerivation";
import { DnfResultPanel } from "./DnfResultPanel";
import { DnfSimplificationPanel } from "./DnfSimplificationPanel";
import { DnfTruthTableView } from "./DnfTruthTableView";

type FollowUpSectionId = "result" | "truthTable" | "simplification";

type DnfFollowUpSectionsProps = DnfFollowUpConfiguration;

interface FollowUpSection {
  id: FollowUpSectionId;
  label: string;
  content?: ReactNode;
  disabled?: boolean;
  isSolution?: boolean;
}

export function DnfFollowUpSections({
  solution,
  simplification,
}: DnfFollowUpSectionsProps) {
  const { t } = useTranslation();
  const [hasUserChangedSections, setHasUserChangedSections] = useState(false);
  const [openSectionIds, setOpenSectionIds] = useState<FollowUpSectionId[]>([]);

  const sections = useMemo<FollowUpSection[]>(() => {
    const nextSections: FollowUpSection[] = [];

    if (solution) {
      nextSections.push({
        id: "result",
        label: t("dnf.builder.resultTitle"),
        isSolution: true,
        content: (
          <DnfResultPanel
            formattedDnf={solution.formattedDnf}
            variableCount={solution.variableCount}
            rowCount={solution.rowCount}
            trueRowCount={solution.trueRowCount}
            derivation={solution.derivation}
          />
        ),
      });
      if (solution.display) {
        nextSections.push({
          id: "truthTable",
          label: t("dnf.builder.truthTableTitle"),
          isSolution: true,
          content: (
            <DnfTruthTableView
              display={solution.display}
              resultHeader={solution.resultHeader}
            />
          ),
        });
      }
    }

    if (simplification) {
      const isSimplificationEnabled = simplification.isEnabled;

      nextSections.push({
        id: "simplification",
        label: t("dnf.builder.exercise.simplificationTitle"),
        disabled: !isSimplificationEnabled,
        content: isSimplificationEnabled ? (
          <DnfSimplificationPanel
            canonicalDnf={formatDnfExpression(
              deriveDnfFromTruthTable(simplification.truthTable).dnf,
            )}
            truthTable={simplification.truthTable}
            simplificationAnswer={simplification.controls.answer}
            feedback={simplification.controls.feedback}
            showSolution={simplification.controls.showSolution}
            showWalkthrough={simplification.controls.showWalkthrough}
            onAnswerChange={simplification.controls.onAnswerChange}
            onCheck={simplification.controls.onCheck}
            onToggleSolution={simplification.controls.onToggleSolution}
            onToggleWalkthrough={simplification.controls.onToggleWalkthrough}
          />
        ) : null,
      });
    }

    return nextSections;
  }, [solution, simplification, t]);

  if (sections.length === 0) {
    return null;
  }

  const defaultOpenId: FollowUpSectionId | null = solution ? "result" : null;
  const effectiveOpenSectionIds: FollowUpSectionId[] =
    hasUserChangedSections || defaultOpenId === null
      ? openSectionIds
      : [defaultOpenId];

  const toggleSection = (sectionId: FollowUpSectionId) => {
    setHasUserChangedSections(true);
    setOpenSectionIds((currentOpenSections) => {
      const baseOpenSections = hasUserChangedSections
        ? currentOpenSections
        : effectiveOpenSectionIds;

      return baseOpenSections.includes(sectionId)
        ? baseOpenSections.filter((id) => id !== sectionId)
        : [...baseOpenSections, sectionId];
    });
  };

  return (
    <section data-testid="dnf-follow-up-sections" className="space-y-4">
      <h2 className="text-foreground text-lg font-semibold">
        {t("dnf.builder.followUpTitle")}
      </h2>

      <div className="space-y-3">
        {sections.map((section) => {
          const isOpen =
            !section.disabled && effectiveOpenSectionIds.includes(section.id);
          const panelId = `dnf-follow-up-${section.id}`;

          return (
            <div key={section.id} className="space-y-3">
              <button
                type="button"
                data-testid={`dnf-follow-up-${section.id}-toggle`}
                disabled={section.disabled}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleSection(section.id)}
                className={cn(
                  "border-border bg-card hover:bg-muted/40 flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                  isOpen && "border-brand",
                  section.disabled &&
                    "hover:bg-card cursor-not-allowed opacity-50",
                )}
              >
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="text-foreground text-sm font-semibold">
                    {section.label}
                  </span>
                  {section.isSolution && (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      {t("dnf.builder.solutionBadge")}
                    </span>
                  )}
                </span>
                {isOpen ? (
                  <ChevronUp className="text-muted-foreground size-4 shrink-0" />
                ) : (
                  <ChevronDown className="text-muted-foreground size-4 shrink-0" />
                )}
              </button>

              {isOpen && section.content && (
                <div id={panelId} data-testid={`dnf-follow-up-${section.id}`}>
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
