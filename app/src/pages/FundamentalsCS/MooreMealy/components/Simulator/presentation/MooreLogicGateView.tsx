import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { MooreConversion } from "../domain/mooreConversion";
import { LogicGateDiagram } from "./LogicGateDiagram";
import { MooreCircuitDiagram } from "./MooreCircuitDiagram";
import { ViewHeader } from "./MooreConversionView";

interface MooreLogicGateViewProps {
  conversion: MooreConversion;
  onBack: () => void;
}

export function MooreLogicGateView({
  conversion,
  onBack,
}: MooreLogicGateViewProps) {
  const { t } = useTranslation();
  const [selectedFormula, setSelectedFormula] = useState(
    conversion.allFormulas[0]?.name ?? "",
  );
  const [showCompleteCircuit, setShowCompleteCircuit] = useState(false);
  const formula =
    conversion.allFormulas.find(
      (candidate) => candidate.name === selectedFormula,
    ) ?? conversion.allFormulas[0];

  return (
    <div data-testid="moore-logic-gate-view" className="space-y-5">
      <ViewHeader
        title={t("moore.logic.title")}
        onBack={onBack}
        backLabel={t("moore.conversion.back")}
      />

      <div className="border-border bg-card space-y-3 rounded-xl border p-4">
        <h3 className="font-semibold">{t("moore.logic.minimalFunctions")}</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {conversion.allFormulas.map((candidate) => (
            <button
              key={candidate.name}
              type="button"
              onClick={() => {
                setSelectedFormula(candidate.name);
                setShowCompleteCircuit(false);
              }}
              data-testid={`moore-logic-formula-${candidate.name}`}
              className={cn(
                "border-border rounded-lg border p-3 text-left font-mono text-sm",
                !showCompleteCircuit && formula?.name === candidate.name
                  ? "border-brand bg-brand/10"
                  : "hover:bg-muted",
              )}
            >
              <strong>{candidate.name} = </strong>
              {candidate.minimal}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowCompleteCircuit(true)}
        data-testid="moore-show-complete-circuit"
        className={cn(
          "border-border rounded-md border px-4 py-2 text-sm font-semibold",
          showCompleteCircuit
            ? "bg-brand text-brand-foreground"
            : "bg-background hover:bg-muted",
        )}
      >
        {t("moore.logic.completeCircuit")}
      </button>

      {showCompleteCircuit ? (
        <div className="space-y-3">
          <h3 className="font-semibold">{t("moore.logic.completeCircuit")}</h3>
          <MooreCircuitDiagram conversion={conversion} />
        </div>
      ) : formula ? (
        <div className="space-y-3">
          <h3 className="font-semibold">
            {formula.name} = {formula.minimal}
          </h3>
          <LogicGateDiagram
            expression={formula.expression}
            outputName={formula.name}
            variables={formula.variables}
            unavailableText={t("moore.logic.minimizationUnavailable")}
          />
        </div>
      ) : null}

      <p className="text-muted-foreground text-xs">
        {t("moore.logic.iecHint")}
      </p>
    </div>
  );
}
