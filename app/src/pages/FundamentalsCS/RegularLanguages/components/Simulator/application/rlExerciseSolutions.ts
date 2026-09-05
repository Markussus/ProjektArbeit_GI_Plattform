import type { RLExerciseDefinition } from "../../../exercises/rlExerciseDefinitions";
import { parseGrammar } from "../domain/rlGrammarValidation";
import { enumerateLanguage } from "../domain/rlLanguageOps";
import {
  checkGrammarEnumerationExercise,
  checkLanguageToGrammarExercise,
  G2L_EXERCISE_ENUMERATION,
  type RLCheckResult,
} from "../domain/rlSolutionChecker";

/**
 * The exercise's own answer, as the text its editor should show — the
 * enumerated language for a grammar task, the reference grammar for a language
 * task. Null when there is nothing to reveal.
 */
export function revealExerciseSolution(
  exercise: RLExerciseDefinition,
): string | null {
  if (exercise.mode === "grammarToLanguage") {
    const parsed = parseGrammar(exercise.seed.grammarSource ?? "");
    if (!parsed.ok || !parsed.grammar) return null;
    const { words } = enumerateLanguage(
      parsed.grammar,
      G2L_EXERCISE_ENUMERATION,
    );
    return words.map((word) => (word === "" ? "ε" : word)).join(", ");
  }

  if (exercise.mode === "languageToGrammar" && exercise.referenceGrammar) {
    return exercise.referenceGrammar;
  }

  return null;
}

/** Grade `studentDraft`, or null when this exercise is not gradable. */
export function checkExerciseSolution(
  exercise: RLExerciseDefinition,
  studentDraft: string,
): RLCheckResult | null {
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
}
