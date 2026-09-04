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
import {
  buildMooreConversion,
  type AutomataConversion,
} from "./domain/automataConversion";
import { cloneJson } from "@/lib/utils";
import { useMooreSimulator } from "./application/useMooreSimulator";
import { useMooreProgramEditor } from "./application/useMooreProgramEditor";
import {
  runMooreValidation,
  type AutomataValidationResult,
} from "./application/automataSolutionChecker";
import { emptyMooreProgram } from "./config/emptyMooreProgram";
import type { MooreExerciseScenario } from "../../exercises";
import {
  normalizeMooreProgram,
  validateMooreProgram,
} from "./domain/mooreProgram";
import { mooreProgramTransferCodec } from "./domain/mooreProgramTransfer";
import type { MooreProgram } from "./domain/mooreTypes";
import { MooreConfigView } from "./presentation/MooreConfigView";
import { AutomataConversionView } from "./presentation/AutomataConversionView";
import { AutomataLogicGateView } from "./presentation/AutomataLogicGateView";
import { MooreSimulationView } from "./presentation/MooreSimulationView";
import { AutomataViewActions } from "./presentation/AutomataViewActions";

export interface MooreSimulatorHandle {
  resetStoredState: () => void;
  loadSolution: () => void;
  checkSolution: () => Promise<AutomataValidationResult>;
}

interface MooreSimulatorProps {
  scenario: MooreExerciseScenario | null;
  initialProgram?: MooreProgram;
  isExample?: boolean;
  transferActive?: boolean;
}

export const MooreSimulator = forwardRef<
  MooreSimulatorHandle,
  MooreSimulatorProps
>(function MooreSimulator(
  {
    scenario,
    initialProgram = emptyMooreProgram,
    isExample = false,
    transferActive = true,
  },
  ref,
) {
  const { t } = useTranslation();
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
    handleOutputCodeChange,
    handleOutputSymbolCreate,
  } = useMooreProgramEditor(cloneJson(scenarioProgram));

  const [committedProgram, setCommittedProgram] = useState<MooreProgram>(() =>
    cloneJson(scenarioProgram),
  );
  const [mode, setMode] = useState<
    "edit" | "simulation" | "conversion" | "logic"
  >("edit");
  const simulation = useMooreSimulator(committedProgram);
  const isStorageEnabled = !isExample;
  const pauseSimulation = simulation.pause;

  const conversion = useMemo<AutomataConversion | null>(
    () => (issues.length === 0 ? buildMooreConversion(program) : null),
    [issues.length, program],
  );
  const loadProgram = useCallback(
    (nextProgram: MooreProgram) => {
      pauseSimulation();
      setProgram(normalizeMooreProgram(nextProgram));
      setMode("edit");
    },
    [pauseSimulation, setProgram],
  );

  const { clear: clearStoredProgram } = useTrainingCenterPersistence({
    topicStorageId: TOPIC_STORAGE_IDS.mooreMealy,
    taskStorageId: scenario?.storageId,
    codec: mooreProgramTransferCodec,
    value: program,
    onRestore: loadProgram,
    enabled: isStorageEnabled,
    transferEnabled: transferActive,
  });

  useImperativeHandle(
    ref,
    () => ({
      resetStoredState() {
        clearStoredProgram();
        pauseSimulation();
        const resetProgram = cloneJson(scenarioProgram);
        setProgram(resetProgram);
        setCommittedProgram(resetProgram);
        setMode("edit");
      },
      loadSolution() {
        if (!scenario) {
          return;
        }
        loadProgram(cloneJson(scenario.solutionProgram));
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
        return runMooreValidation(program, scenario.validationCases);
      },
    }),
    [
      clearStoredProgram,
      loadProgram,
      pauseSimulation,
      program,
      scenario,
      scenarioProgram,
      setProgram,
      t,
    ],
  );

  const startSimulation = () => {
    const normalized = normalizeMooreProgram(program);
    if (validateMooreProgram(normalized).length > 0) {
      return;
    }
    setProgram(normalized);
    setCommittedProgram(normalized);
    setMode("simulation");
  };

  const edit = () => {
    simulation.pause();
    setProgram(cloneJson(committedProgram));
    setMode("edit");
  };

  const showSimulation = () => {
    setCommittedProgram(normalizeMooreProgram(program));
    setMode("simulation");
  };

  if (mode === "conversion" && conversion) {
    return (
      <div
        data-testid="moore-simulator"
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
  }

  if (mode === "logic" && conversion) {
    return (
      <div
        data-testid="moore-simulator"
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
  }

  return (
    <div
      data-testid="moore-simulator"
      className="mx-auto w-full max-w-[100rem]"
    >
      {mode === "edit" ? (
        <div className="space-y-6">
          <MooreConfigView
            program={program}
            issues={issues}
            onChange={setProgram}
            onTransitionChange={handleTransitionChange}
            onStateRename={handleStateRename}
            onInputSymbolRename={handleInputSymbolRename}
            onAddState={handleAddState}
            onRemoveState={handleRemoveState}
            onAddInputSymbol={handleAddInputSymbol}
            onRemoveInputSymbol={handleRemoveInputSymbol}
            onOutputSymbolChange={handleOutputSymbolChange}
            onOutputSymbolCreate={handleOutputSymbolCreate}
            onOutputSymbolRename={handleOutputSymbolRename}
            onOutputCodeChange={handleOutputCodeChange}
          />

          <AutomataViewActions
            actions={[
              {
                label: t("moore-mealy.conversion.open"),
                onClick: () => setMode("conversion"),
                icon: TableProperties,
                testId: "moore-open-conversion",
                disabled: !conversion,
              },
              {
                label: t("moore-mealy.sim.startSimulation"),
                onClick: startSimulation,
                icon: Play,
                testId: "moore-start-simulation",
                disabled: issues.length > 0,
              },
              {
                label: t("moore-mealy.logic.open"),
                onClick: () => setMode("logic"),
                icon: CircuitBoard,
                testId: "moore-open-logic",
                disabled: !conversion,
              },
            ]}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <MooreSimulationView
            program={committedProgram}
            runtime={simulation.runtime}
            status={simulation.status}
            speed={simulation.speed}
            error={simulation.error}
            onEdit={edit}
            onPlay={simulation.play}
            onPause={simulation.pause}
            onStep={simulation.step}
            onStepBack={simulation.stepBack}
            onReset={() => simulation.reset()}
            onSpeedChange={simulation.setSpeed}
          />
          <AutomataViewActions
            actions={[
              {
                label: t("moore-mealy.navigation.editDefinition"),
                onClick: edit,
                icon: Pencil,
                testId: "moore-bottom-edit-configuration",
              },
              {
                label: t("moore-mealy.navigation.showConversion"),
                onClick: () => {
                  simulation.pause();
                  setMode("conversion");
                },
                icon: TableProperties,
                testId: "moore-open-conversion",
                disabled: !conversion,
              },
              {
                label: t("moore-mealy.navigation.showLogic"),
                onClick: () => {
                  simulation.pause();
                  setMode("logic");
                },
                icon: CircuitBoard,
                testId: "moore-open-logic",
                disabled: !conversion,
              },
            ]}
          />
        </div>
      )}
    </div>
  );
});
