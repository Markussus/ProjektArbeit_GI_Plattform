import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { MooreConversion } from "../domain/mooreConversion";
import { LogicGateDiagram } from "./LogicGateDiagram";
import { ViewHeader } from "./MooreConversionView";

interface MooreLogicGateViewProps {
  conversion: MooreConversion;
  onEditDefinition: () => void;
  onShowSimulator: () => void;
  onShowConversion: () => void;
}

export function MooreLogicGateView({
  conversion,
  onEditDefinition,
  onShowSimulator,
  onShowConversion,
}: MooreLogicGateViewProps) {
  const { t } = useTranslation();
  const [selectedFormula, setSelectedFormula] = useState(
    conversion.allFormulas[0]?.name ?? "",
  );
  const formula =
    conversion.allFormulas.find(
      (candidate) => candidate.name === selectedFormula,
    ) ?? conversion.allFormulas[0];

  return (
    <div data-testid="moore-logic-gate-view" className="space-y-5">
      <ViewHeader
        title={t("moore.logic.title")}
        onBack={onEditDefinition}
        backLabel={t("moore.navigation.editDefinition")}
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
              }}
              data-testid={`moore-logic-formula-${candidate.name}`}
              className={cn(
                "border-border rounded-lg border p-3 text-left font-mono text-sm",
                formula?.name === candidate.name
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

      {formula ? (
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

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onShowSimulator}
          data-testid="moore-logic-show-simulator"
          className="border-border bg-background hover:bg-muted rounded-md border px-4 py-2 font-semibold"
        >
          {t("moore.navigation.showSimulator")}
        </button>
        <button
          type="button"
          onClick={onShowConversion}
          data-testid="moore-logic-show-conversion"
          className="bg-brand text-brand-foreground rounded-md px-4 py-2 font-semibold hover:opacity-90"
        >
          {t("moore.navigation.showConversion")}
        </button>
      </div>

      <p className="text-muted-foreground text-xs">
        {t("moore.logic.iecHint")}
      </p>
    </div>
  );
}
