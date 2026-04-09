import { ArrowRightLeft, Repeat, ToggleLeft, ToggleRight } from "lucide-react";
import type { ExerciseDefinition } from "@/types/exercise";

export const mooreMealyExercises: ExerciseDefinition[] = [
  {
    titleKey: "moore.exercise1",
    descriptionKey: "moore.exercise1Desc",
    difficulty: "easy",
    icon: ToggleLeft,
  },
  {
    titleKey: "moore.exercise2",
    descriptionKey: "moore.exercise2Desc",
    difficulty: "medium",
    icon: ToggleRight,
  },
  {
    titleKey: "moore.exercise3",
    descriptionKey: "moore.exercise3Desc",
    difficulty: "medium",
    icon: ArrowRightLeft,
  },
  {
    titleKey: "moore.exercise4",
    descriptionKey: "moore.exercise4Desc",
    difficulty: "hard",
    icon: Repeat,
  },
];
