import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { SolutionCheckDialog } from "@/components/shared/SolutionCheckDialog";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import {
  TMSimulator,
  type TMSimulatorHandle,
} from "./Simulator/TMSimulator.tsx";
import type {
  TMValidationResultRow,
  TMValidationRunResult,
} from "./Simulator/application/tmSolutionChecker";
import {
  getTuringMachineScenario,
  type TuringMachineScenario,
} from "../scenarios";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const simulatorRef = useRef<TMSimulatorHandle | null>(null);
  const [isSimulatorReady, setIsSimulatorReady] = useState(false);
  const [checkResult, setCheckResult] = useState<TMValidationRunResult | null>(
    null,
  );
  const [isChecking, setIsChecking] = useState(false);
  const scenario = useScenario(props.selectedItem);
  const isExercise = isExerciseScenario(scenario);

  const handleReset = () => {
    setCheckResult(null);
    simulatorRef.current?.resetStoredState();
  };

  const handleSimulatorRef = useCallback((handle: TMSimulatorHandle | null) => {
    simulatorRef.current = handle;
    setIsSimulatorReady(Boolean(handle));
  }, []);

  const handleCheckSolution = async () => {
    const simulator = simulatorRef.current;
    if (!simulator) {
      return;
    }

    setIsChecking(true);
    try {
      const result = await simulator.checkSolution();
      setCheckResult(result);
    } finally {
      setIsChecking(false);
    }
  };

  const headerActions = isExercise ? (
    <ExerciseHeaderActions
      isSimulatorReady={isSimulatorReady}
      isChecking={isChecking}
      onLoadSolution={() => simulatorRef.current?.loadSolution()}
      onCheckSolution={handleCheckSolution}
    />
  ) : null;

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
          key={getScenarioKey(scenario)}
          ref={handleSimulatorRef}
          scenario={scenario}
        />
      </TopicSimulationTab>

      <SimulationCheckResultDialog
        checkResult={checkResult}
        onClose={() => setCheckResult(null)}
      />
    </>
  );
}

function useScenario(selectedItem: ModuleSimulationTabProps["selectedItem"]) {
  return useMemo(() => {
    if (!selectedItem) {
      return null;
    }
    return getTuringMachineScenario(selectedItem.id);
  }, [selectedItem]);
}

function isExerciseScenario(scenario: TuringMachineScenario | null): boolean {
  return scenario !== null && scenario.kind === "exercise";
}

function getScenarioKey(scenario: TuringMachineScenario | null): string {
  return scenario?.id ?? "__turing-free-mode__";
}

interface ExerciseHeaderActionsProps {
  isSimulatorReady: boolean;
  isChecking: boolean;
  onLoadSolution: () => void;
  onCheckSolution: () => void;
}

function ExerciseHeaderActions({
  isSimulatorReady,
  isChecking,
  onLoadSolution,
  onCheckSolution,
}: ExerciseHeaderActionsProps) {
  const { t } = useTranslation();

  return (
    <>
      <button
        type="button"
        onClick={onLoadSolution}
        disabled={!isSimulatorReady}
        data-testid="tm-load-solution"
        className="border-border bg-background text-foreground hover:bg-muted inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t("turing-machine.actions.loadSolution")}
      </button>
      <button
        type="button"
        onClick={onCheckSolution}
        disabled={isChecking || !isSimulatorReady}
        data-testid="tm-check-solution"
        className="bg-brand text-brand-foreground inline-flex items-center rounded-md px-3 py-2 text-sm font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isChecking
          ? t("turing-machine.actions.checkingSolution")
          : t("turing-machine.actions.checkSolution")}
      </button>
    </>
  );
}

interface SimulationCheckResultDialogProps {
  checkResult: TMValidationRunResult | null;
  onClose: () => void;
}

function SimulationCheckResultDialog({
  checkResult,
  onClose,
}: SimulationCheckResultDialogProps) {
  const { t } = useTranslation();
  const resultRows = useMemo(() => {
    if (!checkResult) {
      return [];
    }
    return checkResult.rows.map((row) => buildValidationRowCells(row, t));
  }, [checkResult, t]);

  return (
    <SolutionCheckDialog
      open={checkResult !== null}
      title={t("turing-machine.validation.summary.popupTitle")}
      onClose={onClose}
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
      dataColumnWidthClassName="w-[11.5rem] max-w-[12rem] max-w-full"
    />
  );
}

function buildValidationRowCells(
  row: TMValidationResultRow,
  t: TFunction,
): string[] {
  const emptyWord = t("turing-machine.validation.summary.emptyWord");
  const formatWord = (word: string) => (word === "" ? emptyWord : word);

  return [
    t(
      row.passed
        ? "turing-machine.validation.summary.pass"
        : "turing-machine.validation.summary.fail",
    ),
    formatWord(row.input),
    formatWord(row.output),
    formatWord(row.expectedOutput),
    t(
      row.endedInValidHaltState
        ? "turing-machine.sim.status.yes"
        : "turing-machine.sim.status.no",
    ),
  ];
}
