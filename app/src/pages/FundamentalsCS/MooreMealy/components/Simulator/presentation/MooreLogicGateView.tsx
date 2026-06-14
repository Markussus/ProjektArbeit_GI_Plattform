import { useState } from "react";
import { Pencil, Play, TableProperties } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { MooreConversion } from "../domain/mooreConversion";
import { LogicGateDiagram } from "./LogicGateDiagram";
import { ViewHeader } from "./MooreConversionView";
import { MooreViewActions } from "./MooreViewActions";

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
  const [binaryGates, setBinaryGates] = useState(true);
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold">
              {formula.name} = {formula.minimal}
            </h3>
            <label className="border-border bg-card flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={binaryGates}
                onChange={(event) => setBinaryGates(event.target.checked)}
                data-testid="moore-binary-gates-toggle"
                className="accent-brand size-4"
              />
              <span>{t("moore.logic.binaryGates")}</span>
            </label>
          </div>
          <LogicGateDiagram
            key={`${formula.name}-${binaryGates}`}
            expression={formula.expression}
            outputName={formula.name}
            variables={formula.variables}
            unavailableText={t("moore.logic.minimizationUnavailable")}
            binaryGates={binaryGates}
          />
        </div>
      ) : null}

      <MooreViewActions
        actions={[
          {
            label: t("moore.navigation.editDefinition"),
            onClick: onEditDefinition,
            icon: Pencil,
            testId: "moore-logic-edit-definition",
          },
          {
            label: t("moore.navigation.showSimulator"),
            onClick: onShowSimulator,
            icon: Play,
            testId: "moore-logic-show-simulator",
          },
          {
            label: t("moore.navigation.showConversion"),
            onClick: onShowConversion,
            icon: TableProperties,
            testId: "moore-logic-show-conversion",
          },
        ]}
      />

      <p className="text-muted-foreground text-xs">
        {t("moore.logic.iecHint")}
      </p>
    </div>
  );
}
