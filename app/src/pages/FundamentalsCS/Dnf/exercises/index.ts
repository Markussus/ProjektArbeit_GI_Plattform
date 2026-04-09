import { CircuitBoard, Grid3X3, Table, Variable } from "lucide-react";
import type { ExerciseDefinition } from "@/types/exercise";

export const dnfExercises: ExerciseDefinition[] = [
  {
    titleKey: "dnf.exercise1",
    descriptionKey: "dnf.exercise1Desc",
    difficulty: "easy",
    icon: Table,
  },
  {
    titleKey: "dnf.exercise2",
    descriptionKey: "dnf.exercise2Desc",
    difficulty: "medium",
    icon: Grid3X3,
  },
  {
    titleKey: "dnf.exercise3",
    descriptionKey: "dnf.exercise3Desc",
    difficulty: "hard",
    icon: CircuitBoard,
  },
  {
    titleKey: "dnf.exercise4",
    descriptionKey: "dnf.exercise4Desc",
    difficulty: "hard",
    icon: Variable,
  },
];
