import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
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
    const simulationBoundaryRef = useRef<HTMLDivElement | null>(null);
    const editor = useTMConfigEditor(program);
    const simulation = useTMSimulator(program);
    const resetEditorToProgram = editor.resetToProgram;
    const pauseSimulation = simulation.pause;

    const handleImportProgram = useCallback(
      (nextProgram: TMProgram) => {
        pauseSimulation();
        setProgram(nextProgram);
        resetEditorToProgram(nextProgram);
        setIsEditMode(true);
      },
      [pauseSimulation, resetEditorToProgram],
    );

    const { isStorageEnabled, storageIdentifier } = useTMSimulatorStorage({
      scenario,
      draft: editor.draft,
      onImportProgram: handleImportProgram,
    });

    const handleApplyProgram = () => {
      const result = editor.applyProgram();
      if (!result.ok) {
        return;
      }

      setProgram(result.program);
      setIsEditMode(false);
      saveProgramToStorage(storageIdentifier, result.program, isStorageEnabled);
    };

    const handleEditProgram = () => {
      simulation.pause();
      editor.resetToProgram(program);
      setIsEditMode(true);
    };

    useTMSimulatorImperativeHandle({
      ref,
      scenario,
      isStorageEnabled,
      storageIdentifier,
      program,
      isEditMode,
      editor,
      simulation,
      setProgram,
      setIsEditMode,
      t,
    });

    return (
      <TMSimulatorLayout
        isEditMode={isEditMode}
        scenarioId={scenario ? scenario.id : ""}
      >
        {isEditMode ? (
          <TMEditorSection
            editor={editor}
            onApply={handleApplyProgram}
            applyLabel={t("turing-machine.config.general.apply")}
          />
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
      </TMSimulatorLayout>
    );
  },
);

function TMSimulatorLayout({
  isEditMode,
  scenarioId,
  children,
}: {
  isEditMode: boolean;
  scenarioId: string;
  children: ReactNode;
}) {
  return (
    <div
      data-testid="tm-simulator"
      data-mode={isEditMode ? "edit" : "simulation"}
      data-scenario-id={scenarioId}
      className={cn(
        "mx-auto flex w-full flex-col gap-6 p-4",
        isEditMode ? "max-w-none" : "max-w-7xl",
      )}
    >
      {children}
    </div>
  );
}

interface TMEditorSectionProps {
  editor: ReturnType<typeof useTMConfigEditor>;
  onApply: () => void;
  applyLabel: string;
}

function TMEditorSection({
  editor,
  onApply,
  applyLabel,
}: TMEditorSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <TMConfigView editor={editor} />
      <button
        onClick={onApply}
        disabled={editor.hasBlockingCellIssue}
        data-testid="tm-start-simulation"
        className="bg-brand text-brand-foreground self-center rounded-md px-4 py-2 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {applyLabel}
      </button>
    </div>
  );
}

function saveProgramToStorage(
  storageIdentifier: string,
  program: TMProgram,
  enabled: boolean,
): void {
  if (enabled) {
    void exportAndStoreTrainingCenterValue(
      storageIdentifier,
      program,
      tmProgramTransferCodec,
    );
  }
}

function useTMSimulatorStorage({
  scenario,
  draft,
  onImportProgram,
}: {
  scenario: TuringMachineScenario | null;
  draft: TMProgram;
  onImportProgram: (nextProgram: TMProgram) => void;
}) {
  const isStorageEnabled = scenario?.kind !== "example";
  const [isStorageReady, setIsStorageReady] = useState(false);
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
    value: draft,
    codec: tmProgramTransferCodec,
  });

  useEffect(() => {
    let isCancelled = false;

    if (!isStorageEnabled) {
      return;
    }

    void loadTrainingCenterValue(storageIdentifier, tmProgramTransferCodec)
      .then((storedProgram) => {
        if (!isCancelled && storedProgram) {
          onImportProgram(storedProgram);
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
  }, [isStorageEnabled, onImportProgram, storageIdentifier]);

  useTrainingCenterAutoSave({
    identifier: storageIdentifier,
    value: draft,
    codec: tmProgramTransferCodec,
    enabled: isStorageEnabled && isStorageReady,
  });

  return { isStorageEnabled, storageIdentifier };
}

function useTMSimulatorImperativeHandle({
  ref,
  scenario,
  isStorageEnabled,
  storageIdentifier,
  program,
  isEditMode,
  editor,
  simulation,
  setProgram,
  setIsEditMode,
  t,
}: {
  ref: ForwardedRef<TMSimulatorHandle>;
  scenario: TuringMachineScenario | null;
  isStorageEnabled: boolean;
  storageIdentifier: string;
  program: TMProgram;
  isEditMode: boolean;
  editor: ReturnType<typeof useTMConfigEditor>;
  simulation: ReturnType<typeof useTMSimulator>;
  setProgram: (program: TMProgram) => void;
  setIsEditMode: (isEdit: boolean) => void;
  t: TFunction;
}) {
  const isExerciseScenario = scenario?.kind === "exercise";

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
            error: t(
              "turing-machine.validation.summary.exampleCheckUnavailable",
            ),
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
      setIsEditMode,
      setProgram,
      simulation,
      storageIdentifier,
      t,
    ],
  );
}

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
