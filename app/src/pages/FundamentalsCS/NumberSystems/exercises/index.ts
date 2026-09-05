import { Binary, Calculator, Cpu, Shuffle } from "lucide-react";
import type { ExerciseDefinition, ExerciseDifficulty } from "@/types/exercise";

const exerciseDifficultyOrder: Record<ExerciseDifficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

export const numberSystemsExercises: ExerciseDefinition[] = (
  [
    {
      titleKey: "number-systems.ex_u03_decToBin",
      descriptionKey: "number-systems.ex_u03_decToBinDesc",
      difficulty: "easy",
      icon: Binary,
    },
    {
      titleKey: "number-systems.ex_u03_binAdd",
      descriptionKey: "number-systems.ex_u03_binAddDesc",
      difficulty: "medium",
      icon: Calculator,
    },
    {
      titleKey: "number-systems.ex_u04_binToHexOct",
      descriptionKey: "number-systems.ex_u04_binToHexOctDesc",
      difficulty: "easy",
      icon: Shuffle,
    },
    {
      titleKey: "number-systems.ex_u04_octToHex",
      descriptionKey: "number-systems.ex_u04_octToHexDesc",
      difficulty: "medium",
      icon: Shuffle,
    },
    {
      titleKey: "number-systems.ex_u04_hexToBin",
      descriptionKey: "number-systems.ex_u04_hexToBinDesc",
      difficulty: "easy",
      icon: Shuffle,
    },
    {
      titleKey: "number-systems.ex_u05_floatToBin",
      descriptionKey: "number-systems.ex_u05_floatToBinDesc",
      difficulty: "medium",
      icon: Cpu,
    },
    {
      titleKey: "number-systems.ex_u05_ieeeEncode",
      descriptionKey: "number-systems.ex_u05_ieeeEncodeDesc",
      difficulty: "hard",
      icon: Cpu,
    },
    {
      titleKey: "number-systems.ex_u05_ieeeDecode",
      descriptionKey: "number-systems.ex_u05_ieeeDecodeDesc",
      difficulty: "hard",
      icon: Cpu,
    },
    {
      titleKey: "number-systems.ex_u06_addSub",
      descriptionKey: "number-systems.ex_u06_addSubDesc",
      difficulty: "medium",
      icon: Calculator,
    },
    {
      titleKey: "number-systems.ex_u06_mult",
      descriptionKey: "number-systems.ex_u06_multDesc",
      difficulty: "hard",
      icon: Calculator,
    },
  ] satisfies ExerciseDefinition[]
).sort(
  (left, right) =>
    exerciseDifficultyOrder[left.difficulty] -
    exerciseDifficultyOrder[right.difficulty],
);
