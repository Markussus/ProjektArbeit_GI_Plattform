import { useEffect } from "react";
import { useRLSimulatorStore } from "../../store/rlSimulatorStore";
import { RLModeSelector } from "./presentation/RLModeSelector";
import { RLGrammarToLanguage } from "./presentation/RLGrammarToLanguage";
import { RLLanguageToGrammar } from "./presentation/RLLanguageToGrammar";
import { RLWordRecognizer } from "./presentation/RLWordRecognizer";

export function RLSimulator() {
  const mode = useRLSimulatorStore((s) => s.mode);
  const setMode = useRLSimulatorStore((s) => s.setMode);
  const pendingGrammarSource = useRLSimulatorStore(
    (s) => s.pendingGrammarSource,
  );
  const pendingLanguageSource = useRLSimulatorStore(
    (s) => s.pendingLanguageSource,
  );
  const pendingTestWord = useRLSimulatorStore((s) => s.pendingTestWord);
  const consumePending = useRLSimulatorStore((s) => s.consumePending);

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
      <RLModeSelector mode={mode} onChange={setMode} />

      {mode === "grammarToLanguage" && (
        <RLGrammarToLanguage
          initialGrammar={pendingGrammarSource ?? undefined}
        />
      )}
      {mode === "languageToGrammar" && (
        <RLLanguageToGrammar
          initialSource={pendingLanguageSource ?? undefined}
        />
      )}
      {mode === "recognizeWord" && (
        <RLWordRecognizer
          initialGrammar={pendingGrammarSource ?? undefined}
          initialWord={pendingTestWord ?? undefined}
        />
      )}
    </div>
  );
}
