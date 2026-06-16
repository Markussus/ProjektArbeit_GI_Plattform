import { useTranslation } from "react-i18next";
import type { DnfFollowUpSolution } from "../application/dnfFollowUp";
import { DnfResultPanel } from "./DnfResultPanel";
import { DnfTruthTableView } from "./DnfTruthTableView";

// Renders the revealed solution (DNF + truth table) nested inside the DNF
// answer card, mirroring how the simplification panel keeps its own solution
// inline — so attempt and solution sit together in one card.
export function DnfSolutionBlock({
  solution,
}: {
  solution: DnfFollowUpSolution;
}) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="dnf-follow-up-solution"
      className="border-border mt-4 space-y-4 border-t pt-4"
    >
      <h3 className="text-foreground text-base font-semibold">
        {t("dnf.builder.solutionTitle")}
      </h3>
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
    </div>
  );
}
