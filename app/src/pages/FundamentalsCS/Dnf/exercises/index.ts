import { Braces, Grid3X3, Table } from "lucide-react";
import type { ExerciseDefinition } from "@/types/exercise";
import { createTruthTableFromResults } from "../components/DnfBuilder/domain/truthTable";
import type { TruthTable } from "../components/DnfBuilder/domain/truthTable";

const DEFAULT_DNF_SOURCE = "a ∨ (b ∧ c)";

interface DnfExpressionExerciseDefinition extends ExerciseDefinition {
  storageId: number;
  mode: "expression_to_truth_table";
  expression: string;
}

interface DnfTruthTableExerciseDefinition extends ExerciseDefinition {
  storageId: number;
  mode: "truth_table_to_dnf";
  truthTable: TruthTable;
}

export type DnfExerciseDefinition =
  DnfExpressionExerciseDefinition | DnfTruthTableExerciseDefinition;

export const dnfExercises: DnfExerciseDefinition[] = [
  {
    storageId: 0,
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
    storageId: 1,
    titleKey: "dnf.exercises.simpleExpression.title",
    descriptionKey: "dnf.exercises.simpleExpression.description",
    difficulty: "easy",
    icon: Braces,
    mode: "expression_to_truth_table",
    expression: "(a ∨ b) ∧ c",
  },
  {
    storageId: 2,
    titleKey: "dnf.exercises.overlappingGroups.title",
    descriptionKey: "dnf.exercises.overlappingGroups.description",
    difficulty: "medium",
    icon: Table,
    mode: "truth_table_to_dnf",
    truthTable: createTruthTableFromResults(
      ["a", "b", "c"],
      [true, true, true, false, false, false, false, true],
    ),
  },
  {
    storageId: 3,
    titleKey: "dnf.exercises.negatedExpression.title",
    descriptionKey: "dnf.exercises.negatedExpression.description",
    difficulty: "medium",
    icon: Braces,
    mode: "expression_to_truth_table",
    expression: "¬a ∨ (b ∧ ¬c)",
  },
  {
    storageId: 4,
    titleKey: "dnf.exercises.worksheet02bTruthTable2.title",
    descriptionKey: "dnf.exercises.worksheet02bTruthTable2.description",
    difficulty: "hard",
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
  {
    storageId: 5,
    titleKey: "dnf.exercises.complexExpression.title",
    descriptionKey: "dnf.exercises.complexExpression.description",
    difficulty: "hard",
    icon: Braces,
    mode: "expression_to_truth_table",
    expression: "(a ∧ ¬b) ∨ (c ∧ d)",
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
