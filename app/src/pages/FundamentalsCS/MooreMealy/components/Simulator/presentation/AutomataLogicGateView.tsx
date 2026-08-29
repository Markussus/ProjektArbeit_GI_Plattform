import { useState } from "react";
import { Pencil, Play, TableProperties } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LogicGateDiagram } from "@/components/shared/LogicGateDiagram";
import { DropdownSelect } from "@/components/shared/DropdownSelect/DropdownSelect";
import type { AutomataConversion } from "../domain/automataConversion";
import { FormulaSelectorGrid } from "./FormulaSelectorGrid";
import { ViewHeader } from "./AutomataConversionView";
import { AutomataViewActions } from "./AutomataViewActions";

export interface AutomataLogicGateViewProps {
  conversion: AutomataConversion;
  onEditDefinition: () => void;
  onShowSimulator: () => void;
  onShowConversion: () => void;
  testIdPrefix?: string;
}

export function AutomataLogicGateView({
  conversion,
  onEditDefinition,
  onShowSimulator,
  onShowConversion,
  testIdPrefix = "moore-logic",
}: AutomataLogicGateViewProps) {
  const { t } = useTranslation();
  const [selectedFormula, setSelectedFormula] = useState(
    conversion.allFormulas[0]?.name ?? "",
  );
  const [binaryGates, setBinaryGates] = useState(true);
  const [formulaMode, setFormulaMode] = useState<"minimal" | "canonical">(
    "minimal",
  );

  const formula =
    conversion.allFormulas.find(
      (candidate) => candidate.name === selectedFormula,
    ) ?? conversion.allFormulas[0];

  const displayedFormula =
    formulaMode === "canonical" ? formula?.canonical : formula?.minimal;
  const displayedExpression =
    formulaMode === "canonical"
      ? formula?.canonicalExpression
      : formula?.expression;

  return (
    <div data-testid="moore-logic-gate-view" className="space-y-5">
      <ViewHeader title={t("moore-mealy.logic.title")} />

      <div className="border-border bg-card space-y-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold">
            {formulaMode === "canonical"
              ? t("moore-mealy.conversion.canonicalDnf")
              : t("moore-mealy.logic.minimalFunctions")}
          </h3>
          <DropdownSelect
            value={formulaMode}
            options={[
              {
                value: "minimal",
                label: t("moore-mealy.logic.minimalFunctions"),
              },
              {
                value: "canonical",
                label: t("moore-mealy.conversion.canonicalDnf"),
              },
            ]}
            onChange={(mode) => {
              setFormulaMode(mode);
              setSelectedFormula(conversion.allFormulas[0]?.name ?? "");
            }}
            ariaLabel={t("moore-mealy.logic.formulaMode")}
            triggerClassName="h-10 min-w-56 px-3"
            menuClassName="right-0 min-w-56"
            triggerTestId="moore-logic-formula-mode"
            optionTestIdPrefix="moore-logic-formula-mode-option"
          />
        </div>

        <FormulaSelectorGrid
          formulas={conversion.allFormulas}
          selectedFormulaName={formula?.name ?? ""}
          formulaMode={formulaMode}
          onSelectFormula={setSelectedFormula}
          testIdPrefix={testIdPrefix}
        />
      </div>

      {formula ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold">
              {formula.name} = {displayedFormula}
            </h3>
            <label className="border-border bg-card flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={binaryGates}
                onChange={(event) => setBinaryGates(event.target.checked)}
                data-testid="moore-binary-gates-toggle"
                className="accent-brand size-4"
              />
              <span>{t("moore-mealy.logic.binaryGates")}</span>
            </label>
          </div>
          <LogicGateDiagram
            key={`${formula.name}-${formulaMode}-${binaryGates}`}
            expression={displayedExpression ?? null}
            outputName={formula.name}
            ariaLabel={t("moore-mealy.logic.diagram", { output: formula.name })}
            variables={formula.variables}
            unavailableText={t("moore-mealy.logic.minimizationUnavailable")}
            binaryGates={binaryGates}
            testIdPrefix="moore-logic"
          />
        </div>
      ) : null}

      <AutomataViewActions
        actions={[
          {
            label: t("moore-mealy.navigation.editDefinition"),
            onClick: onEditDefinition,
            icon: Pencil,
            testId: `${testIdPrefix}-edit-definition`,
          },
          {
            label: t("moore-mealy.navigation.showSimulator"),
            onClick: onShowSimulator,
            icon: Play,
            testId: `${testIdPrefix}-show-simulator`,
          },
          {
            label: t("moore-mealy.navigation.showConversion"),
            onClick: onShowConversion,
            icon: TableProperties,
            testId: `${testIdPrefix}-show-conversion`,
          },
        ]}
      />
    </div>
  );
}
