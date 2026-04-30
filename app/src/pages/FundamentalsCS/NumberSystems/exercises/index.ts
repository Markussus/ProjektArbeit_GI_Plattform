import { Binary, Calculator, Cpu, Shuffle } from "lucide-react";
import type { ExerciseDefinition } from "@/types/exercise";

export const numberSystemsExercises: ExerciseDefinition[] = [
  {
    titleKey: "number.ex_u03_decToBin",
    descriptionKey: "number.ex_u03_decToBinDesc",
    difficulty: "easy",
    icon: Binary,
  },
  {
    titleKey: "number.ex_u03_binAdd",
    descriptionKey: "number.ex_u03_binAddDesc",
    difficulty: "medium",
    icon: Calculator,
  },
  {
    titleKey: "number.ex_u04_binToHexOct",
    descriptionKey: "number.ex_u04_binToHexOctDesc",
    difficulty: "easy",
    icon: Shuffle,
  },
  {
    titleKey: "number.ex_u04_octToHex",
    descriptionKey: "number.ex_u04_octToHexDesc",
    difficulty: "medium",
    icon: Shuffle,
  },
  {
    titleKey: "number.ex_u04_hexToBin",
    descriptionKey: "number.ex_u04_hexToBinDesc",
    difficulty: "easy",
    icon: Shuffle,
  },
  {
    titleKey: "number.ex_u05_floatToBin",
    descriptionKey: "number.ex_u05_floatToBinDesc",
    difficulty: "medium",
    icon: Cpu,
  },
  {
    titleKey: "number.ex_u05_ieeeEncode",
    descriptionKey: "number.ex_u05_ieeeEncodeDesc",
    difficulty: "hard",
    icon: Cpu,
  },
  {
    titleKey: "number.ex_u05_ieeeDecode",
    descriptionKey: "number.ex_u05_ieeeDecodeDesc",
    difficulty: "hard",
    icon: Cpu,
  },
  {
    titleKey: "number.ex_u06_addSub",
    descriptionKey: "number.ex_u06_addSubDesc",
    difficulty: "medium",
    icon: Calculator,
  },
  {
    titleKey: "number.ex_u06_mult",
    descriptionKey: "number.ex_u06_multDesc",
    difficulty: "hard",
    icon: Calculator,
  },
];
