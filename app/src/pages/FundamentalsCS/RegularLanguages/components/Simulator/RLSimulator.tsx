import { useCallback, useImperativeHandle, useState, type Ref } from "react";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import {
  createTrainingCenterIdentifier,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import type { RLExerciseDefinition } from "../../exercises/rlExerciseDefinitions";
import type { RLExample } from "./config/rlExamples";
import type { SimulationMode } from "./domain/rlTypes";
import {
  checkGrammarEnumerationExercise,
  checkLanguageToGrammarExercise,
  G2L_EXERCISE_ENUMERATION,
  type RLCheckResult,
} from "./domain/rlSolutionChecker";
import { enumerateLanguage } from "./domain/rlLanguageOps";
import { parseGrammar } from "./domain/rlGrammarValidation";
import { RLModeSelector } from "./presentation/RLModeSelector";
import { RLGrammarToLanguage } from "./presentation/RLGrammarToLanguage";
import { RLGrammarEnumerationExercise } from "./presentation/RLGrammarEnumerationExercise";
import { RLLanguageGrammarExercise } from "./presentation/RLLanguageGrammarExercise";
import { RLLanguageToGrammar } from "./presentation/RLLanguageToGrammar";
import { RLWordRecognizer } from "./presentation/RLWordRecognizer";
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
  const [mode, setMode] = useState<SimulationMode>(() => {
    if (importedTaskStorageId) {
      const imported = Object.entries(RL_STORAGE_TASK_IDS).find(
        ([, id]) => id === importedTaskStorageId,
      )?.[0] as SimulationMode | undefined;
      if (imported) return imported;
    }
    return exercise?.mode ?? example?.mode ?? "grammarToLanguage";
  });

  const [prevImportedId, setPrevImportedId] = useState(importedTaskStorageId);
  if (prevImportedId !== importedTaskStorageId) {
    setPrevImportedId(importedTaskStorageId);
    const importedMode = Object.entries(RL_STORAGE_TASK_IDS).find(
      ([, taskStorageId]) => taskStorageId === importedTaskStorageId,
    )?.[0] as SimulationMode | undefined;

    if (importedMode) {
      setMode(importedMode);
    }
  }

  const [studentDraft, setStudentDraft] = useState("");
  const [resetVersions, setResetVersions] = useState(INITIAL_RESET_VERSIONS);

  const isGrammarExercise = exercise?.mode === "grammarToLanguage";
  const isLanguageExercise = exercise?.mode === "languageToGrammar";

  const handleModeChange = (target: SimulationMode) => {
    if (target === mode) {
      return;
    }
    if (exercise) {
      onExitExercise?.();
    }
    setMode(target);
  };

  const resetStoredState = useCallback(() => {
    if (exercise) {
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
  }, [exercise, mode]);

  const loadSolution = useCallback(() => {
    if (!exercise) return;
    if (exercise.mode === "grammarToLanguage") {
      const parsed = parseGrammar(exercise.seed.grammarSource ?? "");
      if (!parsed.ok || !parsed.grammar) return;
      const { words } = enumerateLanguage(
        parsed.grammar,
        G2L_EXERCISE_ENUMERATION,
      );
      const revealed = words.map((w) => (w === "" ? "ε" : w)).join(", ");
      setStudentDraft(revealed);
    } else if (
      exercise.mode === "languageToGrammar" &&
      exercise.referenceGrammar
    ) {
      setStudentDraft(exercise.referenceGrammar);
    }
  }, [exercise]);

  const checkSolution = useCallback((): RLCheckResult | null => {
    if (!exercise) return null;
    if (exercise.mode === "grammarToLanguage") {
      return checkGrammarEnumerationExercise(
        studentDraft,
        exercise.seed.grammarSource ?? "",
      );
    }
    if (exercise.mode === "languageToGrammar") {
      return checkLanguageToGrammarExercise(
        studentDraft,
        exercise.seed.languageSource ?? "",
        exercise.rejectWords ?? [],
      );
    }
    return null;
  }, [exercise, studentDraft]);

  useImperativeHandle(
    ref,
    () => ({
      resetStoredState,
      loadSolution,
      checkSolution,
    }),
    [resetStoredState, loadSolution, checkSolution],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-2 sm:p-4">
      <RLModeSelector mode={mode} onChange={handleModeChange} />

      <div hidden={mode !== "grammarToLanguage"}>
        {isGrammarExercise && exercise ? (
          <RLGrammarEnumerationExercise
            exercise={exercise}
            value={studentDraft}
            onChange={setStudentDraft}
          />
        ) : (
          <RLGrammarToLanguage
            transferActive={mode === "grammarToLanguage"}
            resetVersion={resetVersions.grammarToLanguage}
            initialGrammar={
              mode === "grammarToLanguage"
                ? (example?.grammarSource ?? undefined)
                : undefined
            }
          />
        )}
      </div>
      <div hidden={mode !== "languageToGrammar"}>
        {isLanguageExercise && exercise ? (
          <RLLanguageGrammarExercise
            exercise={exercise}
            value={studentDraft}
            onChange={setStudentDraft}
          />
        ) : (
          <RLLanguageToGrammar
            transferActive={mode === "languageToGrammar"}
            resetVersion={resetVersions.languageToGrammar}
            initialSource={
              mode === "languageToGrammar"
                ? (example?.languageSource ?? undefined)
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
              ? (example?.grammarSource ?? undefined)
              : undefined
          }
          initialWord={
            mode === "recognizeWord"
              ? (example?.testWord ?? undefined)
              : undefined
          }
        />
      </div>
    </div>
  );
}
