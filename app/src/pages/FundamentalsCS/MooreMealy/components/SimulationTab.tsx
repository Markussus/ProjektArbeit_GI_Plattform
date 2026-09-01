import { useCallback, useMemo, useRef, useState, type RefObject } from "react";
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
  type MealySimulatorHandle,
} from "./Simulator/MealySimulator";
import { defaultMooreProgram } from "./Simulator/config/defaultMooreProgram";
import { defaultMealyProgram } from "./Simulator/config/defaultMealyProgram";
import { getAutomataExerciseScenario } from "../exercises";
import type { AutomataValidationResult } from "./Simulator/application/automataSolutionChecker";
import { AutomataSolutionCheckDialog } from "./AutomataSolutionCheckDialog";
import {
  MEALY_EXAMPLE_ID,
  MOORE_EXAMPLE_ID,
  resolveAutomataSimulationContext,
  resolveInitialMachineType,
  type MachineType,
} from "./automataSimulationContext";

export {
  MEALY_EXAMPLE_ID,
  MOORE_EXAMPLE_ID,
} from "./automataSimulationContext";

type ExerciseScenario = ReturnType<typeof getAutomataExerciseScenario>;

function useAutomataSolutionActions({
  exerciseScenario,
  activeSimulatorReady,
  mooreSimulatorRef,
  mealySimulatorRef,
}: {
  exerciseScenario: ExerciseScenario;
  activeSimulatorReady: boolean;
  mooreSimulatorRef: RefObject<MooreSimulatorHandle | null>;
  mealySimulatorRef: RefObject<MealySimulatorHandle | null>;
}) {
  const [checkResult, setCheckResult] =
    useState<AutomataValidationResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const getActiveSimulator = useCallback(
    () =>
      exerciseScenario?.machineType === "moore"
        ? mooreSimulatorRef.current
        : mealySimulatorRef.current,
    [exerciseScenario, mealySimulatorRef, mooreSimulatorRef],
  );

  const checkSolution = useCallback(async () => {
    if (!exerciseScenario || !activeSimulatorReady) return;
    setIsChecking(true);
    try {
      const result = await getActiveSimulator()?.checkSolution();
      if (result) setCheckResult(result);
    } finally {
      setIsChecking(false);
    }
  }, [activeSimulatorReady, exerciseScenario, getActiveSimulator]);

  const loadSolution = useCallback(() => {
    getActiveSimulator()?.loadSolution();
  }, [getActiveSimulator]);

  return {
    checkResult,
    isChecking,
    checkSolution,
    loadSolution,
    clearCheckResult: () => setCheckResult(null),
  };
}

function AutomataExerciseActions({
  isChecking,
  simulatorReady,
  onCheckSolution,
  onLoadSolution,
}: {
  isChecking: boolean;
  simulatorReady: boolean;
  onCheckSolution: () => void;
  onLoadSolution: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <button
        type="button"
        onClick={onLoadSolution}
        disabled={!simulatorReady}
        data-testid="automata-load-solution"
        className="border-border bg-background text-foreground hover:bg-muted inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t("moore-mealy.exercises.loadSolution")}
      </button>
      <button
        type="button"
        onClick={onCheckSolution}
        disabled={isChecking || !simulatorReady}
        data-testid="automata-check-solution"
        className="bg-brand text-brand-foreground inline-flex items-center rounded-md px-3 py-2 text-sm font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isChecking
          ? t("moore-mealy.exercises.checkingSolution")
          : t("moore-mealy.exercises.checkSolution")}
      </button>
    </>
  );
}

function AutomataSimulatorPanels({
  activeMachineType,
  mooreExerciseScenario,
  mealyExerciseScenario,
  mooreInitialProgram,
  isMooreExample,
  isMealyExample,
  storageEnabled,
  onMooreSimulatorReady,
  onMealySimulatorReady,
}: {
  activeMachineType: MachineType;
  mooreExerciseScenario: Extract<
    ExerciseScenario,
    { machineType: "moore" }
  > | null;
  mealyExerciseScenario: Extract<
    ExerciseScenario,
    { machineType: "mealy" }
  > | null;
  mooreInitialProgram: typeof defaultMooreProgram | undefined;
  isMooreExample: boolean;
  isMealyExample: boolean;
  storageEnabled: boolean;
  onMooreSimulatorReady: (handle: MooreSimulatorHandle | null) => void;
  onMealySimulatorReady: (handle: MealySimulatorHandle | null) => void;
}) {
  return (
    <>
      <div hidden={activeMachineType !== "moore"}>
        <MooreSimulator
          key={
            mooreExerciseScenario?.id ??
            (isMooreExample ? MOORE_EXAMPLE_ID : "free")
          }
          ref={onMooreSimulatorReady}
          scenario={mooreExerciseScenario}
          initialProgram={mooreInitialProgram}
          isExample={isMooreExample}
          transferActive={activeMachineType === "moore"}
        />
      </div>
      <div hidden={activeMachineType !== "mealy"}>
        <MealySimulator
          key={
            mealyExerciseScenario?.id ??
            (isMealyExample ? MEALY_EXAMPLE_ID : "free")
          }
          ref={onMealySimulatorReady}
          scenario={mealyExerciseScenario}
          initialProgram={isMealyExample ? defaultMealyProgram : undefined}
          storageEnabled={storageEnabled}
          isExample={isMealyExample}
          transferActive={activeMachineType === "mealy"}
        />
      </div>
    </>
  );
}

function useAutomataSimulatorRefs() {
  const [isMooreSimulatorReady, setIsMooreSimulatorReady] = useState(false);
  const [isMealySimulatorReady, setIsMealySimulatorReady] = useState(false);
  const mooreSimulatorRef = useRef<MooreSimulatorHandle | null>(null);
  const mealySimulatorRef = useRef<MealySimulatorHandle | null>(null);
  const handleMooreSimulatorRef = useCallback(
    (handle: MooreSimulatorHandle | null) => {
      mooreSimulatorRef.current = handle;
      setIsMooreSimulatorReady(handle !== null);
    },
    [],
  );
  const handleMealySimulatorRef = useCallback(
    (handle: MealySimulatorHandle | null) => {
      mealySimulatorRef.current = handle;
      setIsMealySimulatorReady(handle !== null);
    },
    [],
  );

  return {
    isMooreSimulatorReady,
    isMealySimulatorReady,
    mooreSimulatorRef,
    mealySimulatorRef,
    handleMooreSimulatorRef,
    handleMealySimulatorRef,
  };
}

function AutomataSimulationBody({
  simulationContext,
  onMachineTypeChange,
  onMooreSimulatorReady,
  onMealySimulatorReady,
}: {
  simulationContext: ReturnType<typeof resolveAutomataSimulationContext>;
  onMachineTypeChange: (machineType: MachineType) => void;
  onMooreSimulatorReady: (handle: MooreSimulatorHandle | null) => void;
  onMealySimulatorReady: (handle: MealySimulatorHandle | null) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="mx-auto w-full max-w-[100rem] md:pr-24">
        <InlineTabNavigation
          activeTab={simulationContext.activeMachineType}
          onTabChange={onMachineTypeChange}
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
      <AutomataSimulatorPanels
        activeMachineType={simulationContext.activeMachineType}
        mooreExerciseScenario={simulationContext.mooreExerciseScenario}
        mealyExerciseScenario={simulationContext.mealyExerciseScenario}
        mooreInitialProgram={simulationContext.mooreInitialProgram}
        isMooreExample={simulationContext.isMooreExample}
        isMealyExample={simulationContext.isMealyExample}
        storageEnabled={simulationContext.storageEnabled}
        onMooreSimulatorReady={onMooreSimulatorReady}
        onMealySimulatorReady={onMealySimulatorReady}
      />
    </div>
  );
}

export function SimulationTab(props: ModuleSimulationTabProps) {
  const exerciseScenario = useMemo(
    () =>
      props.selectedExercise
        ? getAutomataExerciseScenario(props.selectedExercise.id)
        : null,
    [props.selectedExercise],
  );
  const [machineType, setMachineType] = useState<MachineType>(() =>
    resolveInitialMachineType({
      exerciseScenario,
      isMealyExample: props.selectedItem?.id === MEALY_EXAMPLE_ID,
      importedTaskStorageId: props.importedTaskStorageId,
    }),
  );
  const {
    isMooreSimulatorReady,
    isMealySimulatorReady,
    mooreSimulatorRef,
    mealySimulatorRef,
    handleMooreSimulatorRef,
    handleMealySimulatorRef,
  } = useAutomataSimulatorRefs();
  const simulationContext = resolveAutomataSimulationContext({
    exerciseScenario,
    selectedItemId: props.selectedItem?.id,
    machineType,
  });
  const { activeMachineType } = simulationContext;
  const activeSimulatorReady =
    exerciseScenario?.machineType === "mealy"
      ? isMealySimulatorReady
      : isMooreSimulatorReady;

  const solutionActions = useAutomataSolutionActions({
    exerciseScenario,
    activeSimulatorReady,
    mooreSimulatorRef,
    mealySimulatorRef,
  });

  return (
    <>
      <TopicSimulationTab
        {...props}
        selectedItem={props.selectedItem}
        selectedItemActions={
          exerciseScenario ? (
            <AutomataExerciseActions
              isChecking={solutionActions.isChecking}
              simulatorReady={activeSimulatorReady}
              onCheckSolution={solutionActions.checkSolution}
              onLoadSolution={solutionActions.loadSolution}
            />
          ) : undefined
        }
        emptyStateTextKey="common.simulation.emptyStates.moore"
        onReset={() => {
          solutionActions.clearCheckResult();
          if (activeMachineType === "moore") {
            mooreSimulatorRef.current?.resetStoredState();
          } else {
            mealySimulatorRef.current?.resetStoredState();
          }
        }}
      >
        <AutomataSimulationBody
          simulationContext={simulationContext}
          onMachineTypeChange={setMachineType}
          onMooreSimulatorReady={handleMooreSimulatorRef}
          onMealySimulatorReady={handleMealySimulatorRef}
        />
      </TopicSimulationTab>
      <AutomataSolutionCheckDialog
        checkResult={solutionActions.checkResult}
        onClose={solutionActions.clearCheckResult}
      />
    </>
  );
}
