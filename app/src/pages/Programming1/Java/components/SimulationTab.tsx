import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { getJavaScenario } from "../exercises";
import { JavaSolutionCheckDialog } from "./JavaSolutionCheckDialog";
import type { JavaValidationRunResult } from "./Simulator/domain/javaValidationRunner";
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
    if (!props.selectedItem) return null;
    return getJavaScenario(props.selectedItem.id);
  }, [props.selectedItem]);

  const handleSimulatorRef = useCallback(
    (handle: JavaSimulatorHandle | null) => {
      simulatorRef.current = handle;
      setIsSimulatorReady(handle !== null);
    },
    [],
  );

  const handleCheckSolution = async () => {
    if (
      !simulatorRef.current ||
      !isSimulatorReady ||
      scenario?.kind !== "exercise"
    ) {
      return;
    }
    setIsChecking(true);
    try {
      setCheckResult(await simulatorRef.current.checkSolution());
    } finally {
      setIsChecking(false);
    }
  };

  const headerActions =
    scenario?.kind === "exercise" ? (
      <>
        <button
          type="button"
          onClick={() => simulatorRef.current?.loadSolution()}
          disabled={!isSimulatorReady}
          data-testid="java-load-solution"
          className="border-border bg-background text-foreground hover:bg-muted inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("java-programming.actions.loadSolution")}
        </button>
        <button
          type="button"
          onClick={handleCheckSolution}
          disabled={isChecking || !isSimulatorReady}
          data-testid="java-check-solution"
          className="bg-brand text-brand-foreground inline-flex items-center rounded-md px-3 py-2 text-sm font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isChecking
            ? t("java-programming.actions.checkingSolution")
            : t("java-programming.actions.checkSolution")}
        </button>
      </>
    ) : null;

  return (
    <>
      <TopicSimulationTab
        {...props}
        selectedItem={props.selectedItem}
        selectedItemActions={headerActions}
        emptyStateTextKey="common.simulation.emptyStates.java"
        onReset={() => {
          setCheckResult(null);
          simulatorRef.current?.resetStoredState();
        }}
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

      <JavaSolutionCheckDialog
        checkResult={checkResult}
        onClose={() => setCheckResult(null)}
      />
    </>
  );
}
