import { Grid3X3, Table } from "lucide-react";
import type { ExerciseDefinition } from "@/types/exercise";
import { createTruthTableFromResults } from "../components/DnfBuilder/domain/truthTable";
import type { TruthTable } from "../components/DnfBuilder/domain/truthTable";

const DEFAULT_DNF_SOURCE = "a ∨ (b ∧ c)";

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
    titleKey: "dnf.exercises.worksheet02bTruthTable1.title",
    descriptionKey: "dnf.exercises.worksheet02bTruthTable1.description",
    difficulty: "easy",
    icon: Table,
    mode: "truth_table_to_dnf",
    truthTable: createTruthTableFromResults(
      ["a", "b", "c"],
      [false, true, false, true, true, false, true, false],
    ),
  },
  {
    titleKey: "dnf.exercises.worksheet02bTruthTable2.title",
    descriptionKey: "dnf.exercises.worksheet02bTruthTable2.description",
    difficulty: "medium",
    icon: Grid3X3,
    mode: "truth_table_to_dnf",
    truthTable: createTruthTableFromResults(
      ["a", "b", "c", "d"],
      [
        false,
        true,
        false,
        true,
        false,
        true,
        true,
        false,
        true,
        false,
        true,
        false,
        true,
        false,
        false,
        true,
      ],
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
