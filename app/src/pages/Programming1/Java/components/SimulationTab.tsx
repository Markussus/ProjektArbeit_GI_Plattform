import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { Popup } from "@/components/shared/Popup/Popup";
import { TableView } from "@/components/shared/TableVisual/TableView";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { getJavaScenario } from "../exercises";
import {
  JavaSimulator,
  type JavaSimulatorHandle,
  type JavaValidationRunResult,
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
          data-testid="java-load-solution"
          className="border-border bg-background text-foreground hover:bg-muted inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("java.actions.loadSolution")}
        </button>
        <button
          type="button"
          onClick={handleCheckSolution}
          disabled={isChecking || !isSimulatorReady}
          data-testid="java-check-solution"
          className="bg-brand text-brand-foreground inline-flex items-center rounded-md px-3 py-2 text-sm font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isChecking
            ? t("java.actions.checkingSolution")
            : t("java.actions.checkSolution")}
        </button>
      </>
    ) : null;

  const resultRows = checkResult
    ? checkResult.rows.map((row) => [
        row.passed ? t("java.validation.pass") : t("java.validation.fail"),
        row.id,
        formatOutput(row.output, t("java.validation.emptyOutput")),
        formatOutput(row.expectedOutput, t("java.validation.emptyOutput")),
        row.phase,
      ])
    : [];

  return (
    <>
      <TopicSimulationTab
        {...props}
        selectedItem={props.selectedItem}
        selectedItemActions={headerActions}
        emptyStateTextKey="simulation.emptyStates.java"
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

      <Popup
        open={checkResult !== null}
        title={t("java.validation.popupTitle")}
        onClose={() => setCheckResult(null)}
        testId="java-solution-check-dialog"
      >
        <div className="space-y-4">
          {checkResult?.error && (
            <p
              data-testid="java-solution-check-error"
              className="text-sm text-red-600"
            >
              {checkResult.error}
            </p>
          )}

          {checkResult && checkResult.rows.length > 0 && (
            <TableView
              testIdPrefix="java-solution-check-table"
              headers={[
                t("java.validation.table.passed"),
                t("java.validation.table.case"),
                t("java.validation.table.output"),
                t("java.validation.table.expectedOutput"),
                t("java.validation.table.phase"),
              ]}
              rows={resultRows}
              getRowTestAttributes={(rowIndex) => ({
                "data-passed": String(checkResult.rows[rowIndex]?.passed),
              })}
              firstColumnWidthClassName="w-[6rem] max-w-[8rem]"
              dataColumnWidthClassName="w-[12rem] max-w-[16rem]"
            />
          )}
        </div>
      </Popup>
    </>
  );
}

function formatOutput(output: string, emptyOutput: string) {
  const normalized = output.replace(/\r\n/g, "\n").trimEnd();
  return normalized === "" ? emptyOutput : normalized;
}
