import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ModuleSimulationTabProps } from "@/components/shared/ModuleTopicPage/ModuleTopicPage";
import { TopicSimulationTab } from "@/components/shared/TopicSimulationTab/TopicSimulationTab";
import { InlineTabNavigation } from "@/components/shared/InlineTabNavigation";
import {
  MooreSimulator,
  type MooreSimulatorHandle,
} from "./Simulator/MooreSimulator";
import {
  MealySimulator,
  MEALY_SIMULATOR_TASK_STORAGE_ID,
  type MealySimulatorHandle,
} from "./Simulator/MealySimulator";
import { defaultMooreProgram } from "./Simulator/config/defaultMooreProgram";
import { defaultMealyProgram } from "./Simulator/config/defaultMealyProgram";
import { getMooreExerciseScenario } from "../exercises";
import type { AutomataValidationResult } from "./Simulator/application/automataSolutionChecker";
import { MooreSolutionCheckDialog } from "./MooreSolutionCheckDialog";

export const MOORE_EXAMPLE_ID = "moore-mealy.examples.mooreDefault";
export const MEALY_EXAMPLE_ID = "moore-mealy.examples.mealyDefault";

export function SimulationTab(props: ModuleSimulationTabProps) {
  const { t } = useTranslation();
  const [machineType, setMachineType] = useState<"moore" | "mealy">(() =>
    props.selectedItem?.id === MEALY_EXAMPLE_ID ||
    props.importedTaskStorageId === MEALY_SIMULATOR_TASK_STORAGE_ID
      ? "mealy"
      : "moore",
  );
  const [checkResult, setCheckResult] =
    useState<AutomataValidationResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isMooreSimulatorReady, setIsMooreSimulatorReady] = useState(false);
  const mooreSimulatorRef = useRef<MooreSimulatorHandle | null>(null);
  const mealySimulatorRef = useRef<MealySimulatorHandle | null>(null);
  const isMooreExample = props.selectedItem?.id === MOORE_EXAMPLE_ID;
  const isMealyExample = props.selectedItem?.id === MEALY_EXAMPLE_ID;
  const exerciseScenario = useMemo(
    () =>
      props.selectedExercise
        ? getMooreExerciseScenario(props.selectedExercise.id)
        : null,
    [props.selectedExercise],
  );
  const mooreInitialProgram =
    exerciseScenario?.starterProgram ??
    (isMooreExample ? defaultMooreProgram : undefined);
  const storageEnabled =
    !isMooreExample && !isMealyExample && !exerciseScenario;
  const handleMooreSimulatorRef = useCallback(
    (handle: MooreSimulatorHandle | null) => {
      mooreSimulatorRef.current = handle;
      setIsMooreSimulatorReady(handle !== null);
    },
    [],
  );
  const handleCheckSolution = async () => {
    if (
      !exerciseScenario ||
      !mooreSimulatorRef.current ||
      !isMooreSimulatorReady
    ) {
      return;
    }
    setIsChecking(true);
    try {
      setCheckResult(await mooreSimulatorRef.current.checkSolution());
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <>
      <TopicSimulationTab
        {...props}
        selectedItem={props.selectedItem}
        selectedItemActions={
          exerciseScenario ? (
            <>
              <button
                type="button"
                onClick={() => mooreSimulatorRef.current?.loadSolution()}
                disabled={!isMooreSimulatorReady}
                data-testid="moore-load-solution"
                className="border-border bg-background text-foreground hover:bg-muted inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("moore-mealy.exercises.loadSolution")}
              </button>
              <button
                type="button"
                onClick={handleCheckSolution}
                disabled={isChecking || !isMooreSimulatorReady}
                data-testid="moore-check-solution"
                className="bg-brand text-brand-foreground inline-flex items-center rounded-md px-3 py-2 text-sm font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isChecking
                  ? t("moore-mealy.exercises.checkingSolution")
                  : t("moore-mealy.exercises.checkSolution")}
              </button>
            </>
          ) : undefined
        }
        emptyStateTextKey="common.simulation.emptyStates.moore"
        onReset={() => {
          setCheckResult(null);
          if (machineType === "moore") {
            mooreSimulatorRef.current?.resetStoredState();
          } else {
            mealySimulatorRef.current?.resetStoredState();
          }
        }}
      >
        <div className="space-y-6">
          <div className="mx-auto w-full max-w-[100rem] md:pr-24">
            <InlineTabNavigation
              activeTab={machineType}
              onTabChange={setMachineType}
              ariaLabel={t("moore-mealy.sim.machineType")}
              className="w-full"
              tabs={[
                {
                  id: "moore",
                  label: t("moore-mealy.sim.mooreTab"),
                  testId: "moore-machine-tab-moore",
                },
                {
                  id: "mealy",
                  label: t("moore-mealy.sim.mealyTab"),
                  testId: "moore-machine-tab-mealy",
                },
              ]}
            />
          </div>

          <div hidden={machineType !== "moore"}>
            <MooreSimulator
              key={
                exerciseScenario?.id ??
                (isMooreExample ? MOORE_EXAMPLE_ID : "free")
              }
              ref={handleMooreSimulatorRef}
              scenario={exerciseScenario}
              initialProgram={mooreInitialProgram}
              isExample={isMooreExample}
              transferActive={machineType === "moore"}
            />
          </div>
          <div hidden={machineType !== "mealy"}>
            <MealySimulator
              ref={mealySimulatorRef}
              initialProgram={isMealyExample ? defaultMealyProgram : undefined}
              storageEnabled={storageEnabled}
              transferActive={machineType === "mealy"}
            />
          </div>
        </div>
      </TopicSimulationTab>
      <MooreSolutionCheckDialog
        checkResult={checkResult}
        onClose={() => setCheckResult(null)}
      />
    </>
  );
}
