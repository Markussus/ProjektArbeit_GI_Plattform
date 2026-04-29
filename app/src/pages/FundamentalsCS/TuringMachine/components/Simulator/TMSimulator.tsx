import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { TMConfigView } from "./presentation/TMConfigView";
import { TMSimulationView } from "./presentation/TMSimulationView";

export interface TMSimulatorHandle {
  loadSolution: () => void;
  checkSolution: () => Promise<TMValidationRunResult>;
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
    const isExerciseScenario = scenario?.kind === "exercise";

    const handleApplyProgram = () => {
      const result = editor.applyProgram();
      if (!result.ok) {
        return;
      }

      setProgram(result.program);
      setIsEditMode(false);
    };

    const handleEditProgram = () => {
      simulation.pause();
      editor.resetToProgram(program);
      setIsEditMode(true);
    };

    useImperativeHandle(
      ref,
      () => ({
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
              error: t("tm.validation.summary.exampleCheckUnavailable"),
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
              error: t("tm.validation.summary.checkInvalidProgram"),
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
        program,
        scenario,
        simulation,
        t,
      ],
    );

    return (
      <div
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
              className="bg-brand text-brand-foreground self-center rounded-md px-4 py-2 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("tm.config.general.apply")}
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
