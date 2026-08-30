import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { CircuitBoard, Pencil, Play, TableProperties } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import { useActiveSimulatorTransfer } from "@/hooks/useActiveSimulatorTransfer";
import { useTrainingCenterAutoSave } from "@/hooks/useTrainingCenterAutoSave";
import {
  buildMooreConversion,
  type AutomataConversion,
} from "./domain/automataConversion";
import {
  SIMULATOR_TASK_STORAGE_ID,
  createTrainingCenterIdentifier,
  loadTrainingCenterValue,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
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
    handleOutputCodeChange,
    handleOutputSymbolCreate,
  } = useMooreProgramEditor(cloneJson(scenarioProgram));

  const [committedProgram, setCommittedProgram] = useState<MooreProgram>(() =>
    cloneJson(scenarioProgram),
  );
  const [isEditMode, setIsEditMode] = useState(true);
  const [activeView, setActiveView] = useState<"main" | "conversion" | "logic">(
    "main",
  );
  const [isStorageReady, setIsStorageReady] = useState(false);
  const simulation = useMooreSimulator(committedProgram);
  const isStorageEnabled = !isExample;
  const pauseSimulation = simulation.pause;

  const conversion = useMemo<AutomataConversion | null>(
    () => (issues.length === 0 ? buildMooreConversion(program) : null),
    [issues.length, program],
  );
  const storageIdentifier = useMemo(
    () =>
      createTrainingCenterIdentifier(
        TOPIC_STORAGE_IDS.mooreMealy,
        scenario?.storageId ?? SIMULATOR_TASK_STORAGE_ID,
      ),
    [scenario?.storageId],
  );
  useActiveSimulatorTransfer({
    identifier: storageIdentifier,
    value: program,
    codec: mooreProgramTransferCodec,
    enabled: transferActive,
  });

  const loadProgram = useCallback(
    (nextProgram: MooreProgram) => {
      pauseSimulation();
      setProgram(normalizeMooreProgram(nextProgram));
      setIsEditMode(true);
      setActiveView("main");
    },
    [pauseSimulation, setProgram],
  );

  useEffect(() => {
    setIsStorageReady(false);
    if (!isStorageEnabled) {
      setIsStorageReady(true);
      return;
    }
    let cancelled = false;
    void loadTrainingCenterValue(storageIdentifier, mooreProgramTransferCodec)
      .then((storedProgram) => {
        if (!cancelled && storedProgram) {
          loadProgram(storedProgram);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setIsStorageReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isStorageEnabled, loadProgram, storageIdentifier]);

  useTrainingCenterAutoSave({
    identifier: storageIdentifier,
    value: program,
    codec: mooreProgramTransferCodec,
    enabled: isStorageEnabled && isStorageReady,
  });

  useImperativeHandle(
    ref,
    () => ({
      resetStoredState() {
        if (isStorageEnabled) {
          trainingCenterStorage.delete(storageIdentifier);
        }
        pauseSimulation();
        const resetProgram = cloneJson(scenarioProgram);
        setProgram(resetProgram);
        setCommittedProgram(resetProgram);
        setIsEditMode(true);
        setActiveView("main");
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
      isStorageEnabled,
      loadProgram,
      pauseSimulation,
      program,
      scenario,
      scenarioProgram,
      setProgram,
      storageIdentifier,
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
    setIsEditMode(false);
    setActiveView("main");
  };

  if (activeView === "conversion" && conversion) {
    return (
      <div
        data-testid="moore-simulator"
        className="mx-auto w-full max-w-[100rem]"
      >
        <AutomataConversionView
          conversion={conversion}
          onBackToEditor={() => {
            setIsEditMode(true);
            setActiveView("main");
          }}
          onShowSimulator={() => {
            setCommittedProgram(program);
            setIsEditMode(false);
            setActiveView("main");
          }}
          onShowLogic={() => setActiveView("logic")}
        />
      </div>
    );
  }

  if (activeView === "logic" && conversion) {
    return (
      <div
        data-testid="moore-simulator"
        className="mx-auto w-full max-w-[100rem]"
      >
        <AutomataLogicGateView
          conversion={conversion}
          onEditDefinition={() => {
            setIsEditMode(true);
            setActiveView("main");
          }}
          onShowSimulator={() => {
            setCommittedProgram(program);
            setIsEditMode(false);
            setActiveView("main");
          }}
          onShowConversion={() => setActiveView("conversion")}
        />
      </div>
    );
  }

  return (
    <div
      data-testid="moore-simulator"
      className="mx-auto w-full max-w-[100rem]"
    >
      {isEditMode ? (
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
            onOutputCodeChange={handleOutputCodeChange}
          />

          <AutomataViewActions
            actions={[
              {
                label: t("moore-mealy.conversion.open"),
                onClick: () => setActiveView("conversion"),
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
                onClick: () => setActiveView("logic"),
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
            onEdit={() => {
              simulation.pause();
              setProgram(cloneJson(committedProgram));
              setIsEditMode(true);
            }}
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
                onClick: () => {
                  simulation.pause();
                  setProgram(cloneJson(committedProgram));
                  setIsEditMode(true);
                },
                icon: Pencil,
                testId: "moore-bottom-edit-configuration",
              },
              {
                label: t("moore-mealy.navigation.showConversion"),
                onClick: () => {
                  simulation.pause();
                  setActiveView("conversion");
                },
                icon: TableProperties,
                testId: "moore-open-conversion",
                disabled: !conversion,
              },
              {
                label: t("moore-mealy.navigation.showLogic"),
                onClick: () => {
                  simulation.pause();
                  setActiveView("logic");
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
