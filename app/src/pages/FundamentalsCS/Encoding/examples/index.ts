import { FileText, Binary } from "lucide-react";
import type { ExerciseDefinition } from "@/types/exercise";

export const encodingExamples: ExerciseDefinition[] = [
  {
    titleKey: "encoding.example_base64_2",
    descriptionKey: "encoding.example_base64_2_desc",
    difficulty: "easy",
    icon: FileText,
  },
  {
    titleKey: "encoding.example_base64_3",
    descriptionKey: "encoding.example_base64_3_desc",
    difficulty: "easy",
    icon: FileText,
  },
  {
    titleKey: "encoding.example_utf8_2",
    descriptionKey: "encoding.example_utf8_2_desc",
    difficulty: "medium",
    icon: Binary,
  },
  {
    titleKey: "encoding.example_utf8_3",
    descriptionKey: "encoding.example_utf8_3_desc",
    difficulty: "medium",
    icon: Binary,
  },
];
