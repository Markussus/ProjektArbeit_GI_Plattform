import { Braces, Link2, MonitorPlay, Target } from "lucide-react";
import type { ExerciseDefinition } from "@/features/modules/types";

export const turingMachineExercises: ExerciseDefinition[] = [
  {
    titleKey: "turing.exercise1",
    descriptionKey: "turing.exercise1Desc",
    difficulty: "easy",
    icon: MonitorPlay,
  },
  {
    titleKey: "turing.exercise2",
    descriptionKey: "turing.exercise2Desc",
    difficulty: "medium",
    icon: Braces,
  },
  {
    titleKey: "turing.exercise3",
    descriptionKey: "turing.exercise3Desc",
    difficulty: "hard",
    icon: Target,
  },
  {
    titleKey: "turing.exercise4",
    descriptionKey: "turing.exercise4Desc",
    difficulty: "hard",
    icon: Link2,
  },
];
