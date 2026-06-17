import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog/ConfirmDialog";
import { useRLSimulatorStore } from "../../store/rlSimulatorStore";
import { findRLExercise } from "../../exercises/rlExerciseDefinitions";
import type { SimulationMode } from "./domain/rlTypes";
import { RLModeSelector } from "./presentation/RLModeSelector";
import { RLGrammarToLanguage } from "./presentation/RLGrammarToLanguage";
import { RLGrammarEnumerationExercise } from "./presentation/RLGrammarEnumerationExercise";
import { RLLanguageGrammarExercise } from "./presentation/RLLanguageGrammarExercise";
import { RLLanguageToGrammar } from "./presentation/RLLanguageToGrammar";
import { RLWordRecognizer } from "./presentation/RLWordRecognizer";

interface RLSimulatorProps {
  /** Clears the active exercise (set by ModuleTopicPage when one is open). */
  onExitExercise?: () => void;
}

export function RLSimulator({ onExitExercise }: RLSimulatorProps) {
  const { t } = useTranslation();
  const mode = useRLSimulatorStore((s) => s.mode);
  const setMode = useRLSimulatorStore((s) => s.setMode);
  const activeExerciseId = useRLSimulatorStore((s) => s.activeExerciseId);
  const [pendingMode, setPendingMode] = useState<SimulationMode | null>(null);
  const pendingGrammarSource = useRLSimulatorStore(
    (s) => s.pendingGrammarSource,
  );
  const pendingLanguageSource = useRLSimulatorStore(
    (s) => s.pendingLanguageSource,
  );
  const pendingTestWord = useRLSimulatorStore((s) => s.pendingTestWord);
  const consumePending = useRLSimulatorStore((s) => s.consumePending);

  // An active exercise replaces the free converter with a guided workspace:
  // Grammar → Language gives the grammar and asks for the language; Language →
  // Grammar gives the language and asks for a grammar.
  const activeExercise = activeExerciseId
    ? findRLExercise(activeExerciseId)
    : undefined;
  const isGrammarExercise = activeExercise?.mode === "grammarToLanguage";
  const isLanguageExercise = activeExercise?.mode === "languageToGrammar";

  // Switching modes while an exercise is active abandons it, so prompt with the
  // same "Switch Tab?" confirmation the top-level module tabs use.
  const handleModeChange = (target: SimulationMode) => {
    if (target === mode) {
      return;
    }
    if (activeExerciseId) {
      setPendingMode(target);
      return;
    }
    setMode(target);
  };

  const confirmModeChange = () => {
    const target = pendingMode;
    setPendingMode(null);
    onExitExercise?.();
    if (target) {
      setMode(target);
    }
  };

  // When a pending scenario arrives the mode cards pick it up via a
  // render-time prop sync (see each card); we then clear the store so the
  // value isn't re-applied and the user's later edits stick.
  useEffect(() => {
    if (
      pendingGrammarSource !== null ||
      pendingLanguageSource !== null ||
      pendingTestWord !== null
    ) {
      const t = setTimeout(() => consumePending(), 0);
      return () => clearTimeout(t);
    }
  }, [
    pendingGrammarSource,
    pendingLanguageSource,
    pendingTestWord,
    consumePending,
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-2 sm:p-4">
      <RLModeSelector mode={mode} onChange={handleModeChange} />

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
          initialGrammar={
            mode === "recognizeWord"
              ? (pendingGrammarSource ?? undefined)
              : undefined
          }
          initialWord={
            mode === "recognizeWord" ? (pendingTestWord ?? undefined) : undefined
          }
        />
      </div>

      <ConfirmDialog
        isOpen={pendingMode !== null}
        title={t("simulator.validation.exitTabTitle")}
        description={t("simulator.validation.exitTabDesc")}
        confirmLabel={t("simulator.validation.exitTabConfirm")}
        onConfirm={confirmModeChange}
        onCancel={() => setPendingMode(null)}
        variant="warning"
        testId="rl-mode-switch-confirm"
      />
    </div>
  );
}
