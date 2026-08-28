import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { SolutionCheckDialog } from "@/components/shared/SolutionCheckDialog";
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
  const [isSimulatorReady, setIsSimulatorReady] = useState(false);
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

  const handleReset = () => {
    setCheckResult(null);
    simulatorRef.current?.resetStoredState();
  };

  const handleSimulatorRef = useCallback((handle: TMSimulatorHandle | null) => {
    simulatorRef.current = handle;
    setIsSimulatorReady(handle !== null);
  }, []);

  const handleCheckSolution = async () => {
    if (
      !simulatorRef.current ||
      !isSimulatorReady ||
      !scenario ||
      scenario.kind !== "exercise"
    ) {
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
          disabled={!isSimulatorReady}
          data-testid="tm-load-solution"
          className="border-border bg-background text-foreground hover:bg-muted inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("turing-machine.actions.loadSolution")}
        </button>
        <button
          type="button"
          onClick={handleCheckSolution}
          disabled={isChecking || !isSimulatorReady}
          data-testid="tm-check-solution"
          className="bg-brand text-brand-foreground inline-flex items-center rounded-md px-3 py-2 text-sm font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isChecking
            ? t("turing-machine.actions.checkingSolution")
            : t("turing-machine.actions.checkSolution")}
        </button>
      </>
    ) : null;

  const resultRows = checkResult
    ? checkResult.rows.map((row) => [
        row.passed
          ? t("turing-machine.validation.summary.pass")
          : t("turing-machine.validation.summary.fail"),
        row.input === "" ? t("turing-machine.validation.summary.emptyWord") : row.input,
        row.output === "" ? t("turing-machine.validation.summary.emptyWord") : row.output,
        row.expectedOutput === ""
          ? t("turing-machine.validation.summary.emptyWord")
          : row.expectedOutput,
        row.endedInValidHaltState
          ? t("turing-machine.sim.status.yes")
          : t("turing-machine.sim.status.no"),
      ])
    : [];

  return (
    <>
      <TopicSimulationTab
        {...props}
        selectedItem={props.selectedItem}
        selectedItemActions={headerActions}
        emptyStateTextKey="common.simulation.emptyStates.turing"
        onReset={handleReset}
        resetDisabled={!isSimulatorReady}
      >
        <TMSimulator
          key={scenario?.id ?? "__turing-free-mode__"}
          ref={handleSimulatorRef}
          scenario={scenario}
        />
      </TopicSimulationTab>

      <SolutionCheckDialog
        open={checkResult !== null}
        title={t("turing-machine.validation.summary.popupTitle")}
        onClose={() => setCheckResult(null)}
        testId="tm-solution-check-dialog"
        error={checkResult?.error}
        errorTestId="tm-solution-check-error"
        tableTestIdPrefix="tm-solution-check-table"
        headers={[
          t("turing-machine.validation.table.passed"),
          t("turing-machine.validation.table.input"),
          t("turing-machine.validation.table.output"),
          t("turing-machine.validation.table.expectedOutput"),
          t("turing-machine.validation.table.validHaltState"),
        ]}
        rows={resultRows}
        getRowTestAttributes={(rowIndex) => ({
          "data-passed": String(checkResult?.rows[rowIndex]?.passed),
          "data-valid-halt-state": String(
            checkResult?.rows[rowIndex]?.endedInValidHaltState,
          ),
        })}
        dataColumnWidthClassName="w-[11.5rem] max-w-[12rem]"
      />
    </>
  );
}
