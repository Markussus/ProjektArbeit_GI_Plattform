import type { LucideIcon } from "lucide-react";
import type { Exercise } from "@/components/shared/ExerciseCard/ExerciseCard";

export interface ExerciseDefinition {
  titleKey: string;
  descriptionKey: string;
  difficulty: Exercise["difficulty"];
  icon: LucideIcon;
}
