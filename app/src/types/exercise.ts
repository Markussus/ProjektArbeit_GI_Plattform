import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/types/i18n";

export type ExerciseDifficulty = "easy" | "medium" | "hard";
type TopicItemKind = "exercise" | "example";

export interface DescriptionParams {
  [key: string]: string | number | boolean;
}

interface BaseTopicItem {
  id: TranslationKey;
  title: string;
  description: string;
  titleKey?: TranslationKey;
  descriptionKey?: TranslationKey;
  descriptionParams?: DescriptionParams;
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
  descriptionParams?: DescriptionParams;
  icon: LucideIcon;
}

export interface ExerciseDefinition extends BaseTopicItemDefinition {
  difficulty: ExerciseDifficulty;
}

export type ExampleDefinition = BaseTopicItemDefinition;

export type TopicItem = Exercise | Example;
