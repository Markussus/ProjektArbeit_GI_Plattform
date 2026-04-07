import { ArrowRightLeft, GitBranch, Minimize2, Shuffle } from "lucide-react";
import type { ExerciseDefinition } from "@/features/modules/types";

export const finiteAutomataExercises: ExerciseDefinition[] = [
  {
    titleKey: "automata.exercise1",
    descriptionKey: "automata.exercise1Desc",
    difficulty: "easy",
    icon: GitBranch,
  },
  {
    titleKey: "automata.exercise2",
    descriptionKey: "automata.exercise2Desc",
    difficulty: "medium",
    icon: Shuffle,
  },
  {
    titleKey: "automata.exercise3",
    descriptionKey: "automata.exercise3Desc",
    difficulty: "medium",
    icon: Minimize2,
  },
  {
    titleKey: "automata.exercise4",
    descriptionKey: "automata.exercise4Desc",
    difficulty: "hard",
    icon: ArrowRightLeft,
  },
];
