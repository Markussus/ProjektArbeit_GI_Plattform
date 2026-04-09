import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/types/i18n";

export type ExerciseDifficulty = "easy" | "medium" | "hard";

export interface Exercise {
  id: TranslationKey;
  title: string;
  description: string;
  difficulty: ExerciseDifficulty;
  icon: LucideIcon;
}

export interface ExerciseDefinition {
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  difficulty: ExerciseDifficulty;
  icon: LucideIcon;
}
