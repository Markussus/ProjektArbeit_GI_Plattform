import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { Popup } from "@/components/shared/Popup/Popup";
import { TableView } from "@/components/shared/TableVisual/TableView";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import {
  TMSimulator,
  type TMSimulatorHandle,
} from "./Simulator/TMSimulator.tsx";
import type { TMValidationRunResult } from "./Simulator/application/tmSolutionChecker";
import { getTuringMachineScenario } from "../scenarios";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const { t } = useTranslation();
  const simulatorRef = useRef<TMSimulatorHandle | null>(null);
  const [checkResult, setCheckResult] = useState<TMValidationRunResult | null>(
    null,
  );
  const [isChecking, setIsChecking] = useState(false);
  const scenario = useMemo(() => {
    if (!props.selectedItem) {
      return null;
    }

    return getTuringMachineScenario(props.selectedItem.id);
  }, [props.selectedItem]);

  const handleLoadSolution = () => {
    simulatorRef.current?.loadSolution();
  };

  const handleCheckSolution = async () => {
    if (!simulatorRef.current || !scenario || scenario.kind !== "exercise") {
      return;
    }

    setIsChecking(true);

    try {
      const result = await simulatorRef.current.checkSolution();
      setCheckResult(result);
    } finally {
      setIsChecking(false);
    }
  };

  const headerActions =
    scenario?.kind === "exercise" ? (
      <>
        <button
          type="button"
          onClick={handleLoadSolution}
          className="border-border bg-background text-foreground hover:bg-muted inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium"
        >
          {t("tm.actions.loadSolution")}
        </button>
        <button
          type="button"
          onClick={handleCheckSolution}
          disabled={isChecking}
          className="bg-brand text-brand-foreground inline-flex items-center rounded-md px-3 py-2 text-sm font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isChecking
            ? t("tm.actions.checkingSolution")
            : t("tm.actions.checkSolution")}
        </button>
      </>
    ) : null;

  const resultRows = checkResult
    ? checkResult.rows.map((row) => [
        row.passed ? t("tm.validation.pass") : t("tm.validation.fail"),
        row.input === "" ? t("tm.validation.emptyWord") : row.input,
        row.output === "" ? t("tm.validation.emptyWord") : row.output,
        row.expectedOutput === ""
          ? t("tm.validation.emptyWord")
          : row.expectedOutput,
        row.endedInValidHaltState ? t("tm.sim.yes") : t("tm.sim.no"),
      ])
    : [];

  return (
    <>
      <TopicSimulationTab
        {...props}
        selectedItem={props.selectedItem}
        selectedItemActions={headerActions}
        emptyStateTextKey="simulation.emptyStates.turing"
      >
        <TMSimulator
          key={scenario?.id ?? "__turing-free-mode__"}
          ref={simulatorRef}
          scenario={scenario}
        />
      </TopicSimulationTab>

      <Popup
        open={checkResult !== null}
        title={t("tm.validation.popupTitle")}
        onClose={() => setCheckResult(null)}
      >
        <div className="space-y-4">
          {checkResult?.error && (
            <p className="text-sm text-red-600">{checkResult.error}</p>
          )}

          {checkResult && checkResult.rows.length > 0 && (
            <TableView
              headers={[
                t("tm.validation.table.passed"),
                t("tm.validation.table.input"),
                t("tm.validation.table.output"),
                t("tm.validation.table.expectedOutput"),
                t("tm.validation.table.validHaltState"),
              ]}
              rows={resultRows}
              firstColumnWidthClassName="w-[6rem] max-w-[8rem]"
              dataColumnWidthClassName="w-[11.5rem] max-w-[12rem]"
            />
          )}
        </div>
      </Popup>
    </>
  );
}
