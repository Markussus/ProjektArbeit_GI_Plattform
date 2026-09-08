import type { RLExerciseDefinition } from "../../../exercises/rlExerciseDefinitions";
import type { RLExample } from "../config/rlExamples";
import type { SimulationMode } from "../domain/rlTypes";
import { RLGrammarEnumerationExercise } from "./RLGrammarEnumerationExercise";
import { RLGrammarToLanguage } from "./RLGrammarToLanguage";
import { RLLanguageGrammarExercise } from "./RLLanguageGrammarExercise";
import { RLLanguageToGrammar } from "./RLLanguageToGrammar";
import { RLWordRecognizer } from "./RLWordRecognizer";

/**
 * One panel per simulation mode. All three stay mounted and the inactive ones
 * are hidden, so switching modes never throws away what was typed.
 */
interface ModePanelProps {
  mode: SimulationMode;
  exercise?: RLExerciseDefinition | null;
  example?: RLExample | null;
  resetVersion: number;
  studentDraft: string;
  onStudentDraftChange: (value: string) => void;
}

/** Grammar → language: enumerate it, or answer the exercise's prompt. */
export function RLGrammarModePanel({
  mode,
  exercise,
  example,
  resetVersion,
  studentDraft,
  onStudentDraftChange,
}: ModePanelProps) {
  const active = mode === "grammarToLanguage";
  const exerciseForMode =
    exercise?.mode === "grammarToLanguage" ? exercise : null;

  return (
    <div hidden={!active}>
      {exerciseForMode ? (
        <RLGrammarEnumerationExercise
          exercise={exerciseForMode}
          value={studentDraft}
          onChange={onStudentDraftChange}
        />
      ) : (
        <RLGrammarToLanguage
          transferActive={active}
          resetVersion={resetVersion}
          initialGrammar={
            active ? (example?.grammarSource ?? undefined) : undefined
          }
        />
      )}
    </div>
  );
}

/** Language → grammar: derive a grammar, or answer the exercise's prompt. */
export function RLLanguageModePanel({
  mode,
  exercise,
  example,
  resetVersion,
  studentDraft,
  onStudentDraftChange,
}: ModePanelProps) {
  const active = mode === "languageToGrammar";
  const exerciseForMode =
    exercise?.mode === "languageToGrammar" ? exercise : null;

  return (
    <div hidden={!active}>
      {exerciseForMode ? (
        <RLLanguageGrammarExercise
          exercise={exerciseForMode}
          value={studentDraft}
          onChange={onStudentDraftChange}
        />
      ) : (
        <RLLanguageToGrammar
          transferActive={active}
          resetVersion={resetVersion}
          initialSource={
            active ? (example?.languageSource ?? undefined) : undefined
          }
        />
      )}
    </div>
  );
}

/** Recognize word: check words against a grammar. Never an exercise mode. */
export function RLRecognizeModePanel({
  mode,
  example,
  resetVersion,
}: Pick<ModePanelProps, "mode" | "example" | "resetVersion">) {
  const active = mode === "recognizeWord";

  return (
    <div hidden={!active}>
      <RLWordRecognizer
        transferActive={active}
        resetVersion={resetVersion}
        initialGrammar={
          active ? (example?.grammarSource ?? undefined) : undefined
        }
        initialWord={active ? (example?.testWord ?? undefined) : undefined}
      />
    </div>
  );
}
