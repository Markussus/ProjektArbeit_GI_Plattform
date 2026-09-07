import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { CircuitBoard, Pencil, Play, TableProperties } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import { useTrainingCenterPersistence } from "@/hooks/useTrainingCenterPersistence";
import { SIMULATOR_TASK_STORAGE_ID } from "@/lib/trainingCenter";
import { cloneJson } from "@/lib/utils";
import type { MealyExerciseScenario } from "../../exercises";
import {
  runMealyValidation,
  type AutomataValidationResult,
} from "./application/automataSolutionChecker";
import { useMealySimulator } from "./application/useMealySimulator";
import { useMealyProgramEditor } from "./application/useMealyProgramEditor";
import { emptyMealyProgram } from "./config/emptyMealyProgram";
import { buildMealyConversion } from "./domain/automataConversion";
import {
  normalizeMealyProgram,
  validateMealyProgram,
} from "./domain/mealyProgram";
import { mealyProgramTransferCodec } from "./domain/mealyProgramTransfer";
import type { MealyProgram } from "./domain/mealyTypes";
import { MealyConfigView } from "./presentation/MealyConfigView";
import { MealySimulationView } from "./presentation/MealySimulationView";
import { AutomataConversionView } from "./presentation/AutomataConversionView";
import { AutomataLogicGateView } from "./presentation/AutomataLogicGateView";
import { AutomataViewActions } from "./presentation/AutomataViewActions";

export interface MealySimulatorHandle {
  resetStoredState: () => void;
  loadSolution: () => void;
  checkSolution: () => Promise<AutomataValidationResult>;
}

interface MealySimulatorProps {
  initialProgram?: MealyProgram;
  scenario?: MealyExerciseScenario | null;
  storageEnabled?: boolean;
  isExample?: boolean;
  transferActive?: boolean;
}

export const MEALY_SIMULATOR_TASK_STORAGE_ID = SIMULATOR_TASK_STORAGE_ID - 1;

/**
 * edit: Table editor for states, transitions delta(q, a), and transition outputs lambda(q, a)
 * simulation: Interactive runtime visualization with step/stepBack and speed controls
 * conversion: Binary truth table & DNF boolean formulas
 * logic: Interactive logic gate schematic derived from the boolean formulas
 */
export const MealySimulator = forwardRef<
  MealySimulatorHandle,
  MealySimulatorProps
>(function MealySimulator(
  {
    initialProgram = emptyMealyProgram,
    scenario = null,
    storageEnabled = true,
    isExample = false,
    transferActive = true,
  },
  ref,
) {
  const { t } = useTranslation();
  const effectiveStorageEnabled = storageEnabled && !isExample;
  const scenarioProgram = useMemo(
    () => cloneJson(scenario?.starterProgram ?? initialProgram),
    [initialProgram, scenario],
  );
  const {
    program,
    setProgram,
    issues,
    handleTransitionChange,
    handleStateRename,
    handleInputSymbolRename,
    handleAddState,
    handleRemoveState,
    handleAddInputSymbol,
    handleRemoveInputSymbol,
    handleOutputSymbolChange,
    handleOutputSymbolRename,
    handleOutputSymbolCreate,
    handleOutputCodeChange,
  } = useMealyProgramEditor(cloneJson(scenarioProgram));

  const [committed, setCommitted] = useState(() => cloneJson(scenarioProgram));
  const [mode, setMode] = useState<
    "edit" | "simulation" | "conversion" | "logic"
  >("edit");
  const simulation = useMealySimulator(committed);

  const conversion = useMemo(
    () => (issues.length ? null : buildMealyConversion(program)),
    [issues.length, program],
  );
  const loadProgram = useCallback(
    (value: MealyProgram) => {
      setProgram(normalizeMealyProgram(value));
      setMode("edit");
    },
    [setProgram],
  );

  const { clear: clearStoredProgram } = useTrainingCenterPersistence({
    topicStorageId: TOPIC_STORAGE_IDS.mooreMealy,
    taskStorageId: scenario?.storageId ?? MEALY_SIMULATOR_TASK_STORAGE_ID,
    codec: mealyProgramTransferCodec,
    value: program,
    onRestore: loadProgram,
    enabled: effectiveStorageEnabled,
    transferEnabled: transferActive,
  });

  useImperativeHandle(
    ref,
    () => ({
      resetStoredState() {
        clearStoredProgram();
        simulation.pause();
        const resetProgram = cloneJson(scenarioProgram);
        setProgram(resetProgram);
        setCommitted(resetProgram);
        setMode("edit");
      },
      loadSolution() {
        if (scenario) {
          loadProgram(cloneJson(scenario.solutionProgram));
        }
      },
      checkSolution: async () => {
        if (!scenario) {
          return {
            rows: [],
            passed: false,
            error: t(
              "moore-mealy.exercises.validation.exampleCheckUnavailable",
            ),
          };
        }
        return runMealyValidation(program, scenario.validationCases);
      },
    }),
    [
      clearStoredProgram,
      loadProgram,
      program,
      scenario,
      scenarioProgram,
      setProgram,
      simulation,
      t,
    ],
  );

  const start = () => {
    const normalized = normalizeMealyProgram(program);
    if (validateMealyProgram(normalized).length) return;
    setProgram(normalized);
    setCommitted(normalized);
    setMode("simulation");
  };

  const edit = () => {
    simulation.pause();
    setProgram(cloneJson(committed));
    setMode("edit");
  };

  const showSimulation = () => {
    setCommitted(normalizeMealyProgram(program));
    setMode("simulation");
  };

  if (mode === "conversion" && conversion)
    return (
      <div
        data-testid="mealy-simulator"
        className="mx-auto w-full max-w-[100rem]"
      >
        <AutomataConversionView
          conversion={conversion}
          onBackToEditor={() => setMode("edit")}
          onShowSimulator={showSimulation}
          onShowLogic={() => setMode("logic")}
        />
      </div>
    );
  if (mode === "logic" && conversion)
    return (
      <div
        data-testid="mealy-simulator"
        className="mx-auto w-full max-w-[100rem]"
      >
        <AutomataLogicGateView
          conversion={conversion}
          onEditDefinition={() => setMode("edit")}
          onShowSimulator={showSimulation}
          onShowConversion={() => setMode("conversion")}
        />
      </div>
    );

  return (
    <div
      data-testid="mealy-simulator"
      className="mx-auto w-full max-w-[100rem] space-y-6"
    >
      {mode === "edit" ? (
        <>
          <MealyConfigView
            program={program}
            issues={issues}
            onChange={setProgram}
            onTransitionChange={handleTransitionChange}
            onStateRename={handleStateRename}
            onInputRename={handleInputSymbolRename}
            onAddState={handleAddState}
            onRemoveState={handleRemoveState}
            onAddInput={handleAddInputSymbol}
            onRemoveInput={handleRemoveInputSymbol}
            onOutputSymbolChange={handleOutputSymbolChange}
            onOutputSymbolRename={handleOutputSymbolRename}
            onOutputSymbolCreate={handleOutputSymbolCreate}
            onOutputCodeChange={handleOutputCodeChange}
          />
          <AutomataViewActions
            actions={[
              {
                label: t("moore-mealy.conversion.open"),
                onClick: () => setMode("conversion"),
                icon: TableProperties,
                testId: "mealy-open-conversion",
                disabled: !conversion,
              },
              {
                label: t("moore-mealy.sim.startSimulation"),
                onClick: start,
                icon: Play,
                testId: "mealy-start-simulation",
                disabled: issues.length > 0,
              },
              {
                label: t("moore-mealy.logic.open"),
                onClick: () => setMode("logic"),
                icon: CircuitBoard,
                testId: "mealy-open-logic",
                disabled: !conversion,
              },
            ]}
          />
        </>
      ) : (
        <>
          <MealySimulationView
            program={committed}
            runtime={simulation.runtime}
            status={simulation.status}
            speed={simulation.speed}
            error={simulation.error}
            onPlay={simulation.play}
            onPause={simulation.pause}
            onStep={simulation.step}
            onStepBack={simulation.stepBack}
            onReset={() => simulation.reset(committed)}
            onSpeedChange={simulation.setSpeed}
          />
          <AutomataViewActions
            actions={[
              {
                label: t("moore-mealy.navigation.editDefinition"),
                onClick: edit,
                icon: Pencil,
                testId: "mealy-edit-definition",
              },
              {
                label: t("moore-mealy.navigation.showConversion"),
                onClick: () => setMode("conversion"),
                icon: TableProperties,
                testId: "mealy-open-conversion",
              },
              {
                label: t("moore-mealy.navigation.showLogic"),
                onClick: () => setMode("logic"),
                icon: CircuitBoard,
                testId: "mealy-open-logic",
              },
            ]}
          />
        </>
      )}
    </div>
  );
});
