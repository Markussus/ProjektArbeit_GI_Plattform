import type { LucideIcon } from "lucide-react";

export type ExerciseDifficulty = "easy" | "medium" | "hard";

export interface Exercise {
  title: string;
  description: string;
  difficulty: ExerciseDifficulty;
  icon: LucideIcon;
}

export interface ExerciseDefinition {
  titleKey: string;
  descriptionKey: string;
  difficulty: ExerciseDifficulty;
  icon: LucideIcon;
}
