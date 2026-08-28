import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { TOPIC_STORAGE_IDS } from "@/data/moduleCatalog";
import { useActiveSimulatorTransfer } from "@/hooks/useActiveSimulatorTransfer";
import { useTrainingCenterAutoSave } from "@/hooks/useTrainingCenterAutoSave";
import {
  SIMULATOR_TASK_STORAGE_ID,
  createTrainingCenterIdentifier,
  exportAndStoreTrainingCenterValue,
  loadTrainingCenterValue,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import { cloneJson, cn } from "@/lib/utils";
import {
  emptyTuringMachineProgram,
  type TuringMachineExerciseScenario,
  type TuringMachineScenario,
} from "../../scenarios";
import { useTMConfigEditor } from "./application/useTMConfigEditor";
import {
  runTMValidation,
  type TMValidationRunResult,
} from "./application/tmSolutionChecker";
import { useTMSimulator } from "./application/useTMSimulator";
import type { TMProgram } from "./domain/tmProgram";
import { tmProgramTransferCodec } from "./domain/tmProgramTransfer";
import { TMConfigView } from "./presentation/TMConfigView";
import { TMSimulationView } from "./presentation/TMSimulationView";

export interface TMSimulatorHandle {
  loadSolution: () => void;
  checkSolution: () => Promise<TMValidationRunResult>;
  resetStoredState: () => void;
}

interface TMSimulatorProps {
  scenario: TuringMachineScenario | null;
}

export const TMSimulator = forwardRef<TMSimulatorHandle, TMSimulatorProps>(
  function TMSimulator({ scenario }, ref) {
    const { t } = useTranslation();
    const scenarioProgram = useMemo(
      () => cloneJson(getScenarioProgram(scenario)),
      [scenario],
    );
    const [program, setProgram] = useState<TMProgram>(() => scenarioProgram);
    const [isEditMode, setIsEditMode] = useState(true);
    const [isStorageReady, setIsStorageReady] = useState(false);
    const simulationBoundaryRef = useRef<HTMLDivElement | null>(null);
    const editor = useTMConfigEditor(program);
    const simulation = useTMSimulator(program);
    const resetEditorToProgram = editor.resetToProgram;
    const pauseSimulation = simulation.pause;
    const isExerciseScenario = scenario?.kind === "exercise";
    const isStorageEnabled = scenario?.kind !== "example";
    const storageIdentifier = useMemo(
      () =>
        createTrainingCenterIdentifier(
          TOPIC_STORAGE_IDS.turingMachine,
          scenario?.kind === "exercise"
            ? scenario.storageId
            : SIMULATOR_TASK_STORAGE_ID,
        ),
      [scenario],
    );
    useActiveSimulatorTransfer({
      identifier: storageIdentifier,
      value: editor.draft,
      codec: tmProgramTransferCodec,
    });

    const handleImportProgram = useCallback(
      (nextProgram: TMProgram) => {
        pauseSimulation();
        setProgram(nextProgram);
        resetEditorToProgram(nextProgram);
        setIsEditMode(true);
      },
      [pauseSimulation, resetEditorToProgram],
    );

    useEffect(() => {
      let isCancelled = false;
      setIsStorageReady(false);

      if (!isStorageEnabled) {
        return;
      }

      void loadTrainingCenterValue(storageIdentifier, tmProgramTransferCodec)
        .then((storedProgram) => {
          if (!isCancelled && storedProgram) {
            handleImportProgram(storedProgram);
          }
        })
        .catch(() => undefined)
        .finally(() => {
          if (!isCancelled) {
            setIsStorageReady(true);
          }
        });

      return () => {
        isCancelled = true;
      };
    }, [handleImportProgram, isStorageEnabled, storageIdentifier]);

    useTrainingCenterAutoSave({
      identifier: storageIdentifier,
      value: editor.draft,
      codec: tmProgramTransferCodec,
      enabled: isStorageEnabled && isStorageReady,
    });

    const handleApplyProgram = () => {
      const result = editor.applyProgram();
      if (!result.ok) {
        return;
      }

      setProgram(result.program);
      setIsEditMode(false);
      if (isStorageEnabled) {
        void exportAndStoreTrainingCenterValue(
          storageIdentifier,
          result.program,
          tmProgramTransferCodec,
        );
      }
    };

    const handleEditProgram = () => {
      simulation.pause();
      editor.resetToProgram(program);
      setIsEditMode(true);
    };

    useImperativeHandle(
      ref,
      () => ({
        resetStoredState: () => {
          if (isStorageEnabled) {
            trainingCenterStorage.delete(storageIdentifier);
          }

          const resetProgram = cloneJson(getScenarioProgram(scenario));
          simulation.pause();
          setProgram(resetProgram);
          editor.resetToProgram(resetProgram);
          setIsEditMode(true);
        },
        loadSolution: () => {
          if (!isExerciseScenario) {
            return;
          }

          const solutionProgram = cloneJson(
            (scenario as TuringMachineExerciseScenario).solutionProgram,
          );

          simulation.pause();
          setProgram(solutionProgram);
          editor.resetToProgram(solutionProgram);
          setIsEditMode(true);
        },
        checkSolution: async () => {
          if (!isExerciseScenario) {
            return {
              rows: [],
              error: t("turing-machine.validation.summary.exampleCheckUnavailable"),
            };
          }

          const validationProgramResult = resolveProgramForValidation(
            isEditMode,
            program,
            editor.applyProgram,
          );

          if (!validationProgramResult.ok) {
            return {
              rows: [],
              error: t("turing-machine.validation.summary.checkInvalidProgram"),
            };
          }

          return runTMValidation(
            validationProgramResult.program,
            (scenario as TuringMachineExerciseScenario).validationCases,
          );
        },
      }),
      [
        editor,
        isEditMode,
        isExerciseScenario,
        isStorageEnabled,
        program,
        scenario,
        simulation,
        storageIdentifier,
        t,
      ],
    );

    return (
      <div
        data-testid="tm-simulator"
        data-mode={isEditMode ? "edit" : "simulation"}
        data-scenario-id={scenario?.id ?? ""}
        className={cn(
          "mx-auto flex w-full flex-col gap-6 p-4",
          isEditMode ? "max-w-none" : "max-w-7xl",
        )}
      >
        {isEditMode ? (
          <div className="flex flex-col gap-4">
            <TMConfigView editor={editor} />
            <button
              onClick={handleApplyProgram}
              disabled={editor.hasBlockingCellIssue}
              data-testid="tm-start-simulation"
              className="bg-brand text-brand-foreground self-center rounded-md px-4 py-2 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("turing-machine.config.general.apply")}
            </button>
          </div>
        ) : (
          <TMSimulationView
            program={program}
            runtime={simulation.runtime}
            status={simulation.status}
            speed={simulation.speed}
            error={simulation.error}
            responsiveBoundaryRef={simulationBoundaryRef}
            onEditConfig={handleEditProgram}
            onPlay={simulation.play}
            onPause={simulation.pause}
            onStep={simulation.step}
            onStepBack={simulation.stepBack}
            onReset={() => simulation.reset()}
            onSpeedChange={simulation.setSpeed}
          />
        )}
      </div>
    );
  },
);

function resolveProgramForValidation(
  isEditMode: boolean,
  program: TMProgram,
  applyProgram: () => { ok: true; program: TMProgram } | { ok: false },
): { ok: true; program: TMProgram } | { ok: false } {
  if (!isEditMode) {
    return {
      ok: true,
      program: cloneJson(program),
    };
  }

  return applyProgram();
}

function getScenarioProgram(scenario: TuringMachineScenario | null): TMProgram {
  if (!scenario) {
    return emptyTuringMachineProgram;
  }

  if (scenario.kind === "exercise") {
    return scenario.starterProgram;
  }

  return scenario.program;
}
