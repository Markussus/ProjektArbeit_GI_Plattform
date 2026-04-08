import { Binary, Calculator, Cpu, Shuffle } from "lucide-react";
import type { ExerciseDefinition } from "@/types/exercise";

export const numberSystemsExercises: ExerciseDefinition[] = [
  {
    titleKey: "number.exercise1",
    descriptionKey: "number.exercise1Desc",
    difficulty: "easy",
    icon: Binary,
  },
  {
    titleKey: "number.exercise2",
    descriptionKey: "number.exercise2Desc",
    difficulty: "medium",
    icon: Calculator,
  },
  {
    titleKey: "number.exercise3",
    descriptionKey: "number.exercise3Desc",
    difficulty: "hard",
    icon: Cpu,
  },
  {
    titleKey: "number.exercise4",
    descriptionKey: "number.exercise4Desc",
    difficulty: "hard",
    icon: Shuffle,
  },
];
