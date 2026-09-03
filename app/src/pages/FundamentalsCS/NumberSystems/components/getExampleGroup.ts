import type { ExerciseDefinition } from "@/types/exercise";

export type ExampleGroup = "lecture" | "07";

export function getExampleGroup(
  examples: ExerciseDefinition[],
): Record<ExampleGroup, ExerciseDefinition[]> {
  const groups: Partial<Record<ExampleGroup, ExerciseDefinition[]>> = {};
  for (const ex of examples) {
    const match = ex.titleKey.match(/example_u(\d{2})/);
    if (match) {
      const group = match[1];
      const targetGroup: ExampleGroup = ["03", "04", "05", "06"].includes(group)
        ? "lecture"
        : (group as ExampleGroup);
      if (!groups[targetGroup]) groups[targetGroup] = [];
      groups[targetGroup]!.push(ex);
    }
  }
  return groups as Record<ExampleGroup, ExerciseDefinition[]>;
}
