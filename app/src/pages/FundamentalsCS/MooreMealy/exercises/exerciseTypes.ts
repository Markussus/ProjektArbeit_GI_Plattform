import type { ExerciseDefinition } from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";
import type { AutomataValidationCase } from "../components/Simulator/application/automataSolutionChecker";
import type { MealyProgram } from "../components/Simulator/domain/mealyTypes";
import type { MooreProgram } from "../components/Simulator/domain/mooreTypes";

interface BaseExerciseScenario<
  TMachineType extends "moore" | "mealy",
  TProgram,
> {
  machineType: TMachineType;
  id: TranslationKey;
  storageId: number;
  starterProgram: TProgram;
  solutionProgram: TProgram;
  validationCases: AutomataValidationCase[];
  definition: ExerciseDefinition;
}

export type MooreExerciseScenario = BaseExerciseScenario<"moore", MooreProgram>;

export type MealyExerciseScenario = BaseExerciseScenario<"mealy", MealyProgram>;

export type AutomataExerciseScenario =
  | MooreExerciseScenario
  | MealyExerciseScenario;
