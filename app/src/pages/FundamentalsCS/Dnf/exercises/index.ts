import { CircuitBoard, Grid3X3, Sigma, Table, Variable } from "lucide-react";
import type { ExerciseDefinition } from "@/types/exercise";
import { createTruthTableFromResults } from "../components/DnfBuilder/domain/truthTable";
import type { TruthTable } from "../components/DnfBuilder/domain/truthTable";

export const DEFAULT_DNF_SOURCE = "a ∨ (b ∧ c)";

interface DnfExpressionExerciseDefinition extends ExerciseDefinition {
  mode: "expression_to_truth_table";
  expression: string;
}

interface DnfTruthTableExerciseDefinition extends ExerciseDefinition {
  mode: "truth_table_to_dnf";
  truthTable: TruthTable;
}

export type DnfExerciseDefinition =
  | DnfExpressionExerciseDefinition
  | DnfTruthTableExerciseDefinition;

export const dnfExercises: DnfExerciseDefinition[] = [
  {
    titleKey: "dnf.exercise1",
    descriptionKey: "dnf.exercise1Desc",
    difficulty: "easy",
    icon: Table,
    mode: "expression_to_truth_table",
    expression: DEFAULT_DNF_SOURCE,
  },
  {
    titleKey: "dnf.exercise2",
    descriptionKey: "dnf.exercise2Desc",
    difficulty: "medium",
    icon: Grid3X3,
    mode: "expression_to_truth_table",
    expression: "(a ∨ b) ∧ c",
  },
  {
    titleKey: "dnf.exercise3",
    descriptionKey: "dnf.exercise3Desc",
    difficulty: "hard",
    icon: CircuitBoard,
    mode: "expression_to_truth_table",
    expression: "(¬x ∧ y) ∨ (x ∧ ¬y)",
  },
  {
    titleKey: "dnf.exercise4",
    descriptionKey: "dnf.exercise4Desc",
    difficulty: "hard",
    icon: Variable,
    mode: "expression_to_truth_table",
    expression: "a ∨ (b ∧ c) ∨ ¬d",
  },
  {
    titleKey: "dnf.exercise5",
    descriptionKey: "dnf.exercise5Desc",
    difficulty: "medium",
    icon: Sigma,
    mode: "truth_table_to_dnf",
    truthTable: createTruthTableFromResults(
      ["a", "b", "c"],
      [false, false, true, false, true, true, false, false],
    ),
  },
];

export function getDnfExerciseDefinition(
  exerciseId?: string | null,
): DnfExerciseDefinition | null {
  return (
    dnfExercises.find((exercise) => exercise.titleKey === exerciseId) ?? null
  );
}

export function getDnfExerciseSource(exerciseId?: string | null): string {
  const exercise = getDnfExerciseDefinition(exerciseId);

  return exercise?.mode === "expression_to_truth_table"
    ? exercise.expression
    : DEFAULT_DNF_SOURCE;
}
