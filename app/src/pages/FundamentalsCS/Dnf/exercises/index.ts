import { CircuitBoard, Grid3X3, Table, Variable } from "lucide-react";
import type { ExerciseDefinition } from "@/types/exercise";

export const DEFAULT_DNF_SOURCE = "a ∨ (b ∧ c)";

interface DnfExerciseDefinition extends ExerciseDefinition {
  expression: string;
}

export const dnfExercises: DnfExerciseDefinition[] = [
  {
    titleKey: "dnf.exercise1",
    descriptionKey: "dnf.exercise1Desc",
    difficulty: "easy",
    icon: Table,
    expression: DEFAULT_DNF_SOURCE,
  },
  {
    titleKey: "dnf.exercise2",
    descriptionKey: "dnf.exercise2Desc",
    difficulty: "medium",
    icon: Grid3X3,
    expression: "(a ∨ b) ∧ c",
  },
  {
    titleKey: "dnf.exercise3",
    descriptionKey: "dnf.exercise3Desc",
    difficulty: "hard",
    icon: CircuitBoard,
    expression: "(¬x ∧ y) ∨ (x ∧ ¬y)",
  },
  {
    titleKey: "dnf.exercise4",
    descriptionKey: "dnf.exercise4Desc",
    difficulty: "hard",
    icon: Variable,
    expression: "a ∨ (b ∧ c) ∨ ¬d",
  },
];

export function getDnfExerciseSource(exerciseId?: string | null): string {
  return (
    dnfExercises.find((exercise) => exercise.titleKey === exerciseId)
      ?.expression ?? DEFAULT_DNF_SOURCE
  );
}
