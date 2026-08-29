import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  type Ref,
} from "react";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import {
  createTrainingCenterIdentifier,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import { useRLSimulatorStore } from "../../store/rlSimulatorStore";
import { findRLExercise } from "../../exercises/rlExerciseDefinitions";
import type { SimulationMode } from "./domain/rlTypes";
import { RLModeSelector } from "./presentation/RLModeSelector";
import { RLGrammarToLanguage } from "./presentation/RLGrammarToLanguage";
import { RLGrammarEnumerationExercise } from "./presentation/RLGrammarEnumerationExercise";
import { RLLanguageGrammarExercise } from "./presentation/RLLanguageGrammarExercise";
import { RLLanguageToGrammar } from "./presentation/RLLanguageToGrammar";
import { RLWordRecognizer } from "./presentation/RLWordRecognizer";
import { RL_STORAGE_TASK_IDS } from "./useRLPersistedSource";

interface RLSimulatorProps {
  /** Clears the active exercise (set by ModuleTopicPage when one is open). */
  onExitExercise?: () => void;
  importedTaskStorageId?: number;
  ref?: Ref<RLSimulatorHandle>;
  isFocused?: boolean;
  onToggleFocus?: () => void;
  onReset?: () => void;
}

export interface RLSimulatorHandle {
  resetStoredState: () => void;
}

const INITIAL_RESET_VERSIONS: Record<SimulationMode, number> = {
  grammarToLanguage: 0,
  languageToGrammar: 0,
  recognizeWord: 0,
};

export function RLSimulator({
  onExitExercise,
  importedTaskStorageId,
  ref,
  isFocused,
  onToggleFocus,
  onReset: onWorkspaceReset,
}: RLSimulatorProps) {
  const mode = useRLSimulatorStore((s) => s.mode);
  const setMode = useRLSimulatorStore((s) => s.setMode);
  const activeExerciseId = useRLSimulatorStore((s) => s.activeExerciseId);
  const pendingGrammarSource = useRLSimulatorStore(
    (s) => s.pendingGrammarSource,
  );
  const pendingLanguageSource = useRLSimulatorStore(
    (s) => s.pendingLanguageSource,
  );
  const pendingTestWord = useRLSimulatorStore((s) => s.pendingTestWord);
  const consumePending = useRLSimulatorStore((s) => s.consumePending);
  const clearExerciseDraft = useRLSimulatorStore((s) => s.clearExerciseDraft);
  const [resetVersions, setResetVersions] = useState(INITIAL_RESET_VERSIONS);

  useEffect(() => {
    const importedMode = Object.entries(RL_STORAGE_TASK_IDS).find(
      ([, taskStorageId]) => taskStorageId === importedTaskStorageId,
    )?.[0] as SimulationMode | undefined;

    if (importedMode) {
      setMode(importedMode);
    }
  }, [importedTaskStorageId, setMode]);

  // An active exercise replaces the free converter with a guided workspace:
  // Grammar → Language gives the grammar and asks for the language; Language →
  // Grammar gives the language and asks for a grammar.
  const activeExercise = activeExerciseId
    ? findRLExercise(activeExerciseId)
    : undefined;
  const isGrammarExercise = activeExercise?.mode === "grammarToLanguage";
  const isLanguageExercise = activeExercise?.mode === "languageToGrammar";

  // Switching modes while an exercise is active simply abandons it - the same
  // uninterrupted switch the module tabs and the Moore/Mealy tabs use.
  const handleModeChange = (target: SimulationMode) => {
    if (target === mode) {
      return;
    }
    if (activeExerciseId) {
      onExitExercise?.();
    }
    setMode(target);
  };

  const resetStoredState = useCallback(() => {
    if (activeExerciseId) {
      clearExerciseDraft(activeExerciseId);
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
  }, [activeExerciseId, clearExerciseDraft, mode]);

  useImperativeHandle(ref, () => ({ resetStoredState }), [resetStoredState]);

  // When a pending scenario arrives the mode cards pick it up via a
  // render-time prop sync (see each card); we then clear the store so the
  // value isn't re-applied and the user's later edits stick.
  useEffect(() => {
    if (
      pendingGrammarSource !== null ||
      pendingLanguageSource !== null ||
      pendingTestWord !== null
    ) {
      const clearPending = setTimeout(() => consumePending(), 0);
      return () => clearTimeout(clearPending);
    }
  }, [
    pendingGrammarSource,
    pendingLanguageSource,
    pendingTestWord,
    consumePending,
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-2 sm:p-4">
      <RLModeSelector
        mode={mode}
        onChange={handleModeChange}
        isFocused={isFocused}
        onToggleFocus={onToggleFocus}
        onReset={onWorkspaceReset}
      />

      {/*
        All three modes stay mounted and are toggled with `hidden`, mirroring
        the Moore/Mealy simulator's tab handling. This preserves each mode's
        in-progress edits when the learner switches between them, so returning
        to a mode behaves like the initial navigation instead of resetting to
        its default example. A pending seed is only handed to the mode it
        targets (the grammar field is shared by two modes).
      */}
      <div hidden={mode !== "grammarToLanguage"}>
        {isGrammarExercise && activeExercise ? (
          <RLGrammarEnumerationExercise exercise={activeExercise} />
        ) : (
          <RLGrammarToLanguage
            transferActive={mode === "grammarToLanguage"}
            resetVersion={resetVersions.grammarToLanguage}
            initialGrammar={
              mode === "grammarToLanguage"
                ? (pendingGrammarSource ?? undefined)
                : undefined
            }
          />
        )}
      </div>
      <div hidden={mode !== "languageToGrammar"}>
        {isLanguageExercise && activeExercise ? (
          <RLLanguageGrammarExercise exercise={activeExercise} />
        ) : (
          <RLLanguageToGrammar
            transferActive={mode === "languageToGrammar"}
            resetVersion={resetVersions.languageToGrammar}
            initialSource={
              mode === "languageToGrammar"
                ? (pendingLanguageSource ?? undefined)
                : undefined
            }
          />
        )}
      </div>
      <div hidden={mode !== "recognizeWord"}>
        <RLWordRecognizer
          transferActive={mode === "recognizeWord"}
          resetVersion={resetVersions.recognizeWord}
          initialGrammar={
            mode === "recognizeWord"
              ? (pendingGrammarSource ?? undefined)
              : undefined
          }
          initialWord={
            mode === "recognizeWord"
              ? (pendingTestWord ?? undefined)
              : undefined
          }
        />
      </div>
    </div>
  );
}
