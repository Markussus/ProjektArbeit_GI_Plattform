import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/types/i18n";

export type ExerciseDifficulty = "easy" | "medium" | "hard";
export type TopicItemKind = "exercise" | "example";

interface BaseTopicItem {
  id: TranslationKey;
  title: string;
  description: string;
  titleKey?: TranslationKey;
  descriptionKey?: TranslationKey;
  icon: LucideIcon;
  kind: TopicItemKind;
}

export interface Exercise extends BaseTopicItem {
  kind: "exercise";
  difficulty: ExerciseDifficulty;
}

export interface Example extends BaseTopicItem {
  kind: "example";
}

interface BaseTopicItemDefinition {
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: LucideIcon;
}

export interface ExerciseDefinition extends BaseTopicItemDefinition {
  difficulty: ExerciseDifficulty;
}

export type ExampleDefinition = BaseTopicItemDefinition;

export type TopicItem = Exercise | Example;
