import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { DnfSimulator, type DnfSimulatorHandle } from "./DnfSimulator";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const { t } = useTranslation();
  const simulatorRef = useRef<DnfSimulatorHandle | null>(null);
  const [isSimulatorReady, setIsSimulatorReady] = useState(false);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const selectedExercise = props.selectedExercise;
  const selectedExample =
    props.selectedItem?.kind === "example" ? props.selectedItem : null;
  const handleSimulatorRef = useCallback(
    (handle: DnfSimulatorHandle | null) => {
      simulatorRef.current = handle;
      setIsSimulatorReady(handle !== null);
    },
    [],
  );

  // Exercises get a header "Load solution" action (like the other modules).
  // The two Checks (DNF + simplification) stay inline because DNF is a
  // two-stage flow and a single header "Check" would be ambiguous.
  const headerActions = selectedExercise ? (
    <button
      type="button"
      data-testid="dnf-load-solution"
      onClick={() => simulatorRef.current?.loadSolution()}
      disabled={!isSimulatorReady || !isStorageReady}
      className="border-border bg-background text-foreground hover:bg-muted inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
    >
      {t("dnf.simulator.loadSolution")}
    </button>
  ) : null;

  return (
    <TopicSimulationTab
      {...props}
      emptyStateTextKey="common.simulation.emptyStates.dnf"
      selectedItemActions={headerActions}
      onReset={() => simulatorRef.current?.resetStoredState()}
      resetDisabled={!isSimulatorReady}
    >
      <DnfSimulator
        key={selectedExercise?.id ?? selectedExample?.id ?? "free-mode"}
        ref={handleSimulatorRef}
        selectedExercise={selectedExercise}
        selectedExample={selectedExample}
        onExitExercise={props.onExitExercise}
        onExitExample={props.onExitExample}
        onStorageReadyChange={setIsStorageReady}
      />
    </TopicSimulationTab>
  );
}
