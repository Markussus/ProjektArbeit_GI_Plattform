import { FileText, Binary, Clock } from "lucide-react";
import type { ExerciseDefinition, DescriptionParams } from "@/types/exercise";

const PRINTABLE_ASCII =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:',.<>?/`~ ";

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPrintableChar(): string {
  return PRINTABLE_ASCII[randInt(0, PRINTABLE_ASCII.length - 1)];
}

function randomString(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += randomPrintableChar();
  }
  return result;
}

function toBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

function getUtf8Bytes(codePoint: number): number[] {
  if (codePoint <= 0x7f) return [codePoint];
  if (codePoint <= 0x7ff)
    return [0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f)];
  if (codePoint <= 0xffff)
    return [
      0xe0 | (codePoint >> 12),
      0x80 | ((codePoint >> 6) & 0x3f),
      0x80 | (codePoint & 0x3f),
    ];
  return [
    0xf0 | (codePoint >> 18),
    0x80 | ((codePoint >> 12) & 0x3f),
    0x80 | ((codePoint >> 6) & 0x3f),
    0x80 | (codePoint & 0x3f),
  ];
}

function bytesToBinary(bytes: number[]): string {
  return bytes.map((b) => b.toString(2).padStart(8, "0")).join(" ");
}

export type EncodingExerciseType =
  | "ascii_easy"
  | "utf8_easy"
  | "time_easy"
  | "base64_medium"
  | "utf8_medium"
  | "time_medium"
  | "base64_hard"
  | "utf8_hard";

export interface GeneratedExercise extends ExerciseDefinition {
  id: string;
  answer: string;
  exerciseType: EncodingExerciseType;
  mode: "base64" | "utf8";
  converterMode: "encode" | "decode";
  initialValue: string;
}

interface ExerciseDefWithAnswer extends ExerciseDefinition {
  answer: string;
}

function generateAsciiExercise(): ExerciseDefWithAnswer {
  const char = randomPrintableChar();
  const ascii = char.charCodeAt(0);
  const hex = ascii.toString(16).toUpperCase().padStart(2, "0");
  return {
    titleKey: "encoding.ex_ascii_easy",
    descriptionKey: "encoding.ex_ascii_easy_desc",
    descriptionParams: { char, ascii, hex } as DescriptionParams,
    answer: `${ascii}`,
    difficulty: "easy",
    icon: FileText,
  };
}

function generateUtf8EasyExercise(): ExerciseDefWithAnswer {
  const codePoint = randInt(0x0000, 0x007f);
  const hex = codePoint.toString(16).toUpperCase().padStart(4, "0");
  const bytes = getUtf8Bytes(codePoint);
  const binary = bytesToBinary(bytes);
  return {
    titleKey: "encoding.ex_utf8_easy",
    descriptionKey: "encoding.ex_utf8_easy_desc",
    descriptionParams: { hex, binary } as DescriptionParams,
    answer: binary,
    difficulty: "easy",
    icon: Binary,
  };
}

function generateTimeEasyExercise(): ExerciseDefWithAnswer {
  const baseTimestamp = randInt(1000000000, 1700000000);
  const hours = randInt(1, 48);
  const result = baseTimestamp + hours * 3600;
  return {
    titleKey: "encoding.ex_time_easy",
    descriptionKey: "encoding.ex_time_easy_desc",
    descriptionParams: { timestamp: baseTimestamp, hours } as DescriptionParams,
    answer: `${result}`,
    difficulty: "easy",
    icon: Clock,
  };
}

function generateBase64MediumExercise(): ExerciseDefWithAnswer {
  const str = randomString(3);
  const encoded = toBase64(str);
  return {
    titleKey: "encoding.ex_base64_medium",
    descriptionKey: "encoding.ex_base64_medium_desc",
    descriptionParams: { str, encoded } as DescriptionParams,
    answer: encoded,
    difficulty: "medium",
    icon: FileText,
  };
}

function generateUtf8MediumExercise(): ExerciseDefWithAnswer {
  const codePoint = randInt(0x0800, 0xffff);
  const hex = codePoint.toString(16).toUpperCase().padStart(4, "0");
  const bytes = getUtf8Bytes(codePoint);
  const binary = bytesToBinary(bytes);
  return {
    titleKey: "encoding.ex_utf8_medium",
    descriptionKey: "encoding.ex_utf8_medium_desc",
    descriptionParams: { hex, binary } as DescriptionParams,
    answer: binary,
    difficulty: "medium",
    icon: Binary,
  };
}

function generateTimeMediumExercise(): ExerciseDefWithAnswer {
  const now = Math.floor(Date.now() / 1000);
  const yearsAgo = randInt(16, 25);
  const birthTimestamp = now - yearsAgo * 365.25 * 24 * 3600;
  const isAdult = yearsAgo >= 18;
  return {
    titleKey: "encoding.ex_time_medium",
    descriptionKey: "encoding.ex_time_medium_desc",
    descriptionParams: {
      birthTimestamp: Math.floor(birthTimestamp),
      nowTimestamp: now,
      isAdult: isAdult ? "Ja" : "Nein",
    } as DescriptionParams,
    answer: isAdult ? "Ja" : "Nein",
    difficulty: "medium",
    icon: Clock,
  };
}

function generateBase64HardExercise(): ExerciseDefWithAnswer {
  const str = randomString(2);
  const encoded = toBase64(str);
  return {
    titleKey: "encoding.ex_base64_hard",
    descriptionKey: "encoding.ex_base64_hard_desc",
    descriptionParams: { encoded } as DescriptionParams,
    answer: str,
    difficulty: "hard",
    icon: FileText,
  };
}

function generateUtf8HardExercise(): ExerciseDefWithAnswer {
  const codePoint = randInt(0x0800, 0xffff);
  const hex = codePoint.toString(16).toUpperCase().padStart(4, "0");
  const bytes = getUtf8Bytes(codePoint);
  const binary = bytesToBinary(bytes);
  return {
    titleKey: "encoding.ex_utf8_hard",
    descriptionKey: "encoding.ex_utf8_hard_desc",
    descriptionParams: { binary, hex } as DescriptionParams,
    answer: hex,
    difficulty: "hard",
    icon: Binary,
  };
}

const generators: Record<EncodingExerciseType, () => ExerciseDefWithAnswer> = {
  ascii_easy: generateAsciiExercise,
  utf8_easy: generateUtf8EasyExercise,
  time_easy: generateTimeEasyExercise,
  base64_medium: generateBase64MediumExercise,
  utf8_medium: generateUtf8MediumExercise,
  time_medium: generateTimeMediumExercise,
  base64_hard: generateBase64HardExercise,
  utf8_hard: generateUtf8HardExercise,
};

const easyTypes: EncodingExerciseType[] = [
  "ascii_easy",
  "utf8_easy",
  "time_easy",
];
const mediumTypes: EncodingExerciseType[] = [
  "base64_medium",
  "utf8_medium",
  "time_medium",
];
const hardTypes: EncodingExerciseType[] = ["base64_hard", "utf8_hard"];

function generateExercise(
  type: EncodingExerciseType,
  index: number,
): GeneratedExercise {
  const def = generators[type]();
  const id = `encoding.ex_generated_${type}_${index}_${Date.now()}`;
  let mode: "base64" | "utf8" = "base64";
  let converterMode: "encode" | "decode" = "encode";
  let initialValue = "";
  const params = def.descriptionParams as Record<string, string | number>;

  if (type.includes("base64")) {
    mode = "base64";
    converterMode = type.includes("hard") ? "decode" : "encode";
    initialValue = type.includes("hard")
      ? String(params.encoded ?? "")
      : String(params.str ?? "");
  } else if (type.includes("utf8")) {
    mode = "utf8";
    converterMode = type.includes("hard") ? "decode" : "encode";
    const codePoint = parseInt(String(params.hex ?? "0"), 16);
    const char = String.fromCodePoint(codePoint);
    if (type.includes("hard")) {
      const bytes = getUtf8Bytes(codePoint);
      initialValue = bytes
        .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
        .join(" ");
    } else {
      initialValue = char;
    }
  } else if (type.includes("ascii")) {
    mode = "utf8";
    converterMode = "encode";
    initialValue = String(params.char ?? "");
  }

  return {
    ...def,
    id,
    exerciseType: type,
    mode,
    converterMode,
    initialValue,
  };
}

export function generateEncodingExercises(
  count: number = 6,
): GeneratedExercise[] {
  const exercises: GeneratedExercise[] = [];
  const types = [...easyTypes, ...mediumTypes, ...hardTypes];

  for (let i = 0; i < count; i++) {
    const type = types[randInt(0, types.length - 1)];
    exercises.push(generateExercise(type, i));
  }

  return exercises;
}

export function generateExerciseByDifficulty(
  difficulty: "easy" | "medium" | "hard",
  index: number = 0,
): GeneratedExercise {
  const pool =
    difficulty === "easy"
      ? easyTypes
      : difficulty === "medium"
        ? mediumTypes
        : hardTypes;
  const type = pool[randInt(0, pool.length - 1)];
  return generateExercise(type, index);
}
