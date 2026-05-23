import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { TruthTableDisplay } from "../adapters/truthTableAdapter";
import {
  deriveDnfFromTruthTable,
  formatDnfExpression,
  type DnfDerivation,
} from "../domain/dnfDerivation";
import type { DnfSimplificationCheckResult } from "../domain/dnfSimplificationCheck";
import type { TruthTable } from "../domain/truthTable";
import { DnfResultPanel } from "./DnfResultPanel";
import { DnfSimplificationPanel } from "./DnfSimplificationPanel";
import { DnfTruthTableView } from "./DnfTruthTableView";

type FollowUpSectionId = "result" | "truthTable" | "simplification";

export interface DnfFollowUpSolution {
  formattedDnf: string;
  variableCount: number;
  rowCount: number;
  trueRowCount: number;
  derivation: DnfDerivation;
  display: TruthTableDisplay | null;
  resultHeader: string;
  truthTable: TruthTable;
}

interface DnfSimplificationControls {
  answer: string;
  feedback: DnfSimplificationCheckResult | null;
  showSolution: boolean;
  showWalkthrough: boolean;
  onAnswerChange: (value: string) => void;
  onCheck: () => void;
  onToggleSolution: () => void;
  onToggleWalkthrough: () => void;
}

interface DnfFollowUpSectionsProps {
  solution?: DnfFollowUpSolution;
  simplification?: {
    truthTable: TruthTable;
    controls: DnfSimplificationControls;
  };
}

interface FollowUpSection {
  id: FollowUpSectionId;
  label: string;
  content: ReactNode;
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
      nextSections.push({
        id: "simplification",
        label: t("dnf.builder.exercise.simplificationTitle"),
        content: (
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
        ),
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
    <section className="space-y-4">
      <h2 className="text-foreground text-lg font-semibold">
        {t("dnf.builder.followUpTitle")}
      </h2>

      <div className="space-y-3">
        {sections.map((section) => {
          const isOpen = effectiveOpenSectionIds.includes(section.id);
          const panelId = `dnf-follow-up-${section.id}`;

          return (
            <div key={section.id} className="space-y-3">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleSection(section.id)}
                className={cn(
                  "border-border bg-card hover:bg-muted/40 flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                  isOpen && "border-brand/60",
                )}
              >
                <span className="text-foreground text-sm font-semibold">
                  {section.label}
                </span>
                {isOpen ? (
                  <ChevronUp className="text-muted-foreground size-4 shrink-0" />
                ) : (
                  <ChevronDown className="text-muted-foreground size-4 shrink-0" />
                )}
              </button>

              {isOpen && <div id={panelId}>{section.content}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
