import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { SolutionCheckDialog } from "@/components/shared/SolutionCheckDialog";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { getJavaScenario } from "../exercises";
import {
  buildValidationTableRows,
  type JavaValidationRunResult,
} from "./Simulator/domain/javaValidationRunner";
import {
  JavaSimulator,
  type JavaSimulatorHandle,
} from "./Simulator/JavaSimulator";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const { t } = useTranslation();
  const simulatorRef = useRef<JavaSimulatorHandle | null>(null);
  const [isSimulatorReady, setIsSimulatorReady] = useState(false);
  const [checkResult, setCheckResult] =
    useState<JavaValidationRunResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const scenario = useMemo(() => {
    if (!props.selectedItem) {
      return null;
    }
    return getJavaScenario(props.selectedItem.id);
  }, [props.selectedItem]);

  const handleSimulatorRef = useCallback(
    (handle: JavaSimulatorHandle | null) => {
      simulatorRef.current = handle;
      setIsSimulatorReady(handle !== null);
    },
    [],
  );

  const handleLoadSolution = () => {
    simulatorRef.current?.loadSolution();
  };

  const handleReset = () => {
    setCheckResult(null);
    simulatorRef.current?.resetStoredState();
  };

  const handleCheckSolution = async () => {
    const isExercise = scenario?.kind === "exercise";
    if (!simulatorRef.current || !isSimulatorReady || !isExercise) {
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
      <JavaSimulationHeaderActions
        isSimulatorReady={isSimulatorReady}
        isChecking={isChecking}
        onLoadSolution={handleLoadSolution}
        onCheckSolution={handleCheckSolution}
      />
    ) : null;

  const resultRows = useMemo(
    () => buildValidationTableRows(checkResult, t),
    [checkResult, t],
  );

  return (
    <>
      <TopicSimulationTab
        {...props}
        selectedItem={props.selectedItem}
        selectedItemActions={headerActions}
        emptyStateTextKey="common.simulation.emptyStates.java"
        onReset={handleReset}
        resetDisabled={!isSimulatorReady}
        overlayControls
      >
        <JavaSimulator
          key={props.selectedItem?.id ?? "__java-free-mode__"}
          ref={handleSimulatorRef}
          selectedExercise={props.selectedExercise}
          selectedItem={props.selectedItem}
          isFocused={props.isFocused}
        />
      </TopicSimulationTab>

      <SolutionCheckDialog
        open={checkResult !== null}
        title={t("java-programming.validation.popupTitle")}
        onClose={() => setCheckResult(null)}
        testId="java-solution-check-dialog"
        error={checkResult?.error}
        errorTestId="java-solution-check-error"
        tableTestIdPrefix="java-solution-check-table"
        headers={[
          t("java-programming.validation.table.passed"),
          t("java-programming.validation.table.case"),
          t("java-programming.validation.table.output"),
          t("java-programming.validation.table.expectedOutput"),
          t("java-programming.validation.table.phase"),
        ]}
        rows={resultRows}
        getRowTestAttributes={(rowIndex) => ({
          "data-passed": String(checkResult?.rows[rowIndex]?.passed),
        })}
      />
    </>
  );
}

interface JavaSimulationHeaderActionsProps {
  isSimulatorReady: boolean;
  isChecking: boolean;
  onLoadSolution: () => void;
  onCheckSolution: () => void;
}

function JavaSimulationHeaderActions({
  isSimulatorReady,
  isChecking,
  onLoadSolution,
  onCheckSolution,
}: JavaSimulationHeaderActionsProps) {
  const { t } = useTranslation();

  return (
    <>
      <button
        type="button"
        onClick={onLoadSolution}
        disabled={!isSimulatorReady}
        data-testid="java-load-solution"
        className="border-border bg-background text-foreground hover:bg-muted inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t("java-programming.actions.loadSolution")}
      </button>
      <button
        type="button"
        onClick={onCheckSolution}
        disabled={isChecking || !isSimulatorReady}
        data-testid="java-check-solution"
        className="bg-brand text-brand-foreground inline-flex items-center rounded-md px-3 py-2 text-sm font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isChecking
          ? t("java-programming.actions.checkingSolution")
          : t("java-programming.actions.checkSolution")}
      </button>
    </>
  );
}
