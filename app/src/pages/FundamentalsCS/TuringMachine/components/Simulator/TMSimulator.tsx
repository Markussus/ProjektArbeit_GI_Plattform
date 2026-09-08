import {
  forwardRef,
  useCallback,
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
import { useTrainingCenterPersistence } from "@/hooks/useTrainingCenterPersistence";
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

    const isStorageEnabled = scenario?.kind !== "example";
    const { clear: clearStoredProgram, save: saveProgram } =
      useTrainingCenterPersistence({
        topicStorageId: TOPIC_STORAGE_IDS.turingMachine,
        taskStorageId:
          scenario?.kind === "exercise" ? scenario.storageId : undefined,
        codec: tmProgramTransferCodec,
        value: editor.draft,
        onRestore: handleImportProgram,
        enabled: isStorageEnabled,
      });

    const handleApplyProgram = () => {
      const result = editor.applyProgram();
      if (!result.ok) {
        return;
      }

      setProgram(result.program);
      setIsEditMode(false);
      if (isStorageEnabled) {
        void saveProgram().catch(() => undefined);
      }
    };

    const handleEditProgram = () => {
      simulation.pause();
      editor.resetToProgram(program);
      setIsEditMode(true);
    };

    useTMSimulatorImperativeHandle({
      ref,
      scenario,
      clearStoredProgram,
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

function useTMSimulatorImperativeHandle({
  ref,
  scenario,
  clearStoredProgram,
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
  clearStoredProgram: () => void;
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
        clearStoredProgram();

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
      clearStoredProgram,
      program,
      scenario,
      setIsEditMode,
      setProgram,
      simulation,
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
