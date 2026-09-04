import { useCallback, useImperativeHandle, useState, type Ref } from "react";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import {
  createTrainingCenterIdentifier,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import type { RLExerciseDefinition } from "../../exercises/rlExerciseDefinitions";
import {
  checkExerciseSolution,
  revealExerciseSolution,
} from "./application/rlExerciseSolutions";
import { useRLSimulatorMode } from "./application/useRLSimulatorMode";
import type { RLExample } from "./config/rlExamples";
import type { SimulationMode } from "./domain/rlTypes";
import type { RLCheckResult } from "./domain/rlSolutionChecker";
import {
  RLGrammarModePanel,
  RLLanguageModePanel,
  RLRecognizeModePanel,
} from "./presentation/RLModePanels";
import { RLModeSelector } from "./presentation/RLModeSelector";
import { useRLPersistedDraft } from "./useRLPersistedDraft";
import { RL_STORAGE_TASK_IDS } from "./useRLPersistedSource";

export interface RLSimulatorProps {
  exercise?: RLExerciseDefinition | null;
  example?: RLExample | null;
  /** Clears the active exercise (set by ModuleTopicPage when one is open). */
  onExitExercise?: () => void;
  importedTaskStorageId?: number;
  ref?: Ref<RLSimulatorHandle>;
}

export interface RLSimulatorHandle {
  resetStoredState: () => void;
  loadSolution: () => void;
  checkSolution: () => RLCheckResult | null;
}

const INITIAL_RESET_VERSIONS: Record<SimulationMode, number> = {
  grammarToLanguage: 0,
  languageToGrammar: 0,
  recognizeWord: 0,
};

export function RLSimulator({
  exercise,
  example,
  onExitExercise,
  importedTaskStorageId,
  ref,
}: RLSimulatorProps) {
  const { mode, setMode } = useRLSimulatorMode({
    exercise,
    example,
    importedTaskStorageId,
  });

  const [studentDraft, setStudentDraft] = useState("");
  const [resetVersions, setResetVersions] = useState(INITIAL_RESET_VERSIONS);

  // An open exercise keeps its answer in its own slot, so leaving the page and
  // coming back restores the draft rather than an empty box.
  const persistedDraft = useRLPersistedDraft({
    exercise,
    draft: studentDraft,
    onRestore: setStudentDraft,
  });

  const handleModeChange = (target: SimulationMode) => {
    if (target === mode) return;
    if (exercise) onExitExercise?.();
    setMode(target);
  };

  const clearPersistedDraft = persistedDraft.clear;

  const resetStoredState = useCallback(() => {
    if (exercise) {
      clearPersistedDraft();
      setStudentDraft("");
      return;
    }

    trainingCenterStorage.delete(
      createTrainingCenterIdentifier(
        TOPIC_STORAGE_IDS.regularLanguages,
        RL_STORAGE_TASK_IDS[mode],
      ),
    );
    setResetVersions((versions) => ({
      ...versions,
      [mode]: versions[mode] + 1,
    }));
  }, [clearPersistedDraft, exercise, mode]);

  const loadSolution = useCallback(() => {
    if (!exercise) return;
    const revealed = revealExerciseSolution(exercise);
    if (revealed !== null) setStudentDraft(revealed);
  }, [exercise]);

  const checkSolution = useCallback(
    (): RLCheckResult | null =>
      exercise ? checkExerciseSolution(exercise, studentDraft) : null,
    [exercise, studentDraft],
  );

  useImperativeHandle(
    ref,
    () => ({ resetStoredState, loadSolution, checkSolution }),
    [resetStoredState, loadSolution, checkSolution],
  );

  const panelProps = {
    mode,
    exercise,
    example,
    studentDraft,
    onStudentDraftChange: setStudentDraft,
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-2 sm:p-4">
      <RLModeSelector mode={mode} onChange={handleModeChange} />

      <RLGrammarModePanel
        {...panelProps}
        resetVersion={resetVersions.grammarToLanguage}
      />
      <RLLanguageModePanel
        {...panelProps}
        resetVersion={resetVersions.languageToGrammar}
      />
      <RLRecognizeModePanel
        mode={mode}
        example={example}
        resetVersion={resetVersions.recognizeWord}
      />
    </div>
  );
}
