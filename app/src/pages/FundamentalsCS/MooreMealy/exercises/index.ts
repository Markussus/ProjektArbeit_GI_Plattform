import type { TranslationKey } from "@/types/i18n";
import { mealyExercises, mealyExerciseScenarios } from "./mealyExercises";
import { mooreExercises, mooreExerciseScenarios } from "./mooreExercises";
import type { AutomataExerciseScenario } from "./exerciseTypes";

export type {
  AutomataExerciseScenario,
  MealyExerciseScenario,
  MooreExerciseScenario,
} from "./exerciseTypes";
export {
  mealyExercises,
  mealyExerciseScenarios,
  mooreExercises,
  mooreExerciseScenarios,
};

export const automataExerciseScenarios: AutomataExerciseScenario[] = [
  ...mooreExerciseScenarios,
  ...mealyExerciseScenarios,
];

export const mooreMealyExercises = automataExerciseScenarios.map(
  (scenario) => scenario.definition,
);

export function getAutomataExerciseScenario(
  id: TranslationKey,
): AutomataExerciseScenario | null {
  return (
    automataExerciseScenarios.find((scenario) => scenario.id === id) ?? null
  );
}

export function getMooreExerciseScenario(id: TranslationKey) {
  const scenario = getAutomataExerciseScenario(id);
  return scenario?.machineType === "moore" ? scenario : null;
}
