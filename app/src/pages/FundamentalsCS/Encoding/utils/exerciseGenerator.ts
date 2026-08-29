import { FileText, Binary } from "lucide-react";
import type { ExerciseDefinition, DescriptionParams } from "@/types/exercise";

const PRINTABLE_ASCII =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:',.<>?/`~ ";

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPrintableChar(): string {
  return PRINTABLE_ASCII[randInt(0, PRINTABLE_ASCII.length - 1)];
}

const EMOJI_CHARS = [
  "😀",
  "🚀",
  "🌍",
  "🎉",
  "🔥",
  "💡",
  "🎯",
  "📚",
  "💻",
  "🧠",
  "🔋",
  "🛡",
  "🎨",
  "🎵",
  "🌟",
  "🐛",
  "🔧",
  "🚦",
  "🧪",
  "📡",
];

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
  | "base64_encode_easy"
  | "base64_encode_medium"
  | "base64_encode_hard"
  | "base64_decode_easy"
  | "base64_decode_medium"
  | "base64_decode_hard"
  | "utf8_encode_easy"
  | "utf8_encode_medium"
  | "utf8_encode_hard"
  | "utf8_encode_4byte"
  | "utf8_decode_easy"
  | "utf8_decode_medium"
  | "utf8_decode_hard"
  | "utf8_decode_4byte";

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

// ==========================================
// Base64 Encode
// ==========================================
function generateBase64EncodeEasy(): ExerciseDefWithAnswer {
  const str = randomString(1);
  const encoded = toBase64(str);
  return {
    titleKey: "encoding.ex_base64_encode_easy",
    descriptionKey: "encoding.ex_base64_encode_easy_desc",
    descriptionParams: { str } as DescriptionParams,
    answer: encoded,
    difficulty: "easy",
    icon: FileText,
  };
}

function generateBase64EncodeMedium(): ExerciseDefWithAnswer {
  const str = randomString(3);
  const encoded = toBase64(str);
  return {
    titleKey: "encoding.ex_base64_encode_medium",
    descriptionKey: "encoding.ex_base64_encode_medium_desc",
    descriptionParams: { str } as DescriptionParams,
    answer: encoded,
    difficulty: "medium",
    icon: FileText,
  };
}

function generateBase64EncodeHard(): ExerciseDefWithAnswer {
  const str = randomString(randInt(5, 8));
  const encoded = toBase64(str);
  return {
    titleKey: "encoding.ex_base64_encode_hard",
    descriptionKey: "encoding.ex_base64_encode_hard_desc",
    descriptionParams: { str } as DescriptionParams,
    answer: encoded,
    difficulty: "hard",
    icon: FileText,
  };
}

// ==========================================
// Base64 Decode
// ==========================================
function generateBase64DecodeEasy(): ExerciseDefWithAnswer {
  const str = randomString(1);
  const encoded = toBase64(str);
  return {
    titleKey: "encoding.ex_base64_decode_easy",
    descriptionKey: "encoding.ex_base64_decode_easy_desc",
    descriptionParams: { encoded } as DescriptionParams,
    answer: str,
    difficulty: "easy",
    icon: FileText,
  };
}

function generateBase64DecodeMedium(): ExerciseDefWithAnswer {
  const str = randomString(3);
  const encoded = toBase64(str);
  return {
    titleKey: "encoding.ex_base64_decode_medium",
    descriptionKey: "encoding.ex_base64_decode_medium_desc",
    descriptionParams: { encoded } as DescriptionParams,
    answer: str,
    difficulty: "medium",
    icon: FileText,
  };
}

function generateBase64DecodeHard(): ExerciseDefWithAnswer {
  const str = randomString(randInt(5, 8));
  const encoded = toBase64(str);
  return {
    titleKey: "encoding.ex_base64_decode_hard",
    descriptionKey: "encoding.ex_base64_decode_hard_desc",
    descriptionParams: { encoded } as DescriptionParams,
    answer: str,
    difficulty: "hard",
    icon: FileText,
  };
}

// ==========================================
// UTF-8 Encode
// ==========================================
function generateUtf8EncodeEasy(): ExerciseDefWithAnswer {
  const codePoint = randInt(0x0000, 0x007f);
  const hex = codePoint.toString(16).toUpperCase().padStart(4, "0");
  const bytes = getUtf8Bytes(codePoint);
  const binary = bytesToBinary(bytes);
  return {
    titleKey: "encoding.ex_utf8_encode_easy",
    descriptionKey: "encoding.ex_utf8_encode_easy_desc",
    descriptionParams: { hex } as DescriptionParams,
    answer: binary,
    difficulty: "easy",
    icon: Binary,
  };
}

function generateUtf8EncodeMedium(): ExerciseDefWithAnswer {
  const codePoint = randInt(0x0080, 0x07ff);
  const hex = codePoint.toString(16).toUpperCase().padStart(4, "0");
  const bytes = getUtf8Bytes(codePoint);
  const binary = bytesToBinary(bytes);
  return {
    titleKey: "encoding.ex_utf8_encode_medium",
    descriptionKey: "encoding.ex_utf8_encode_medium_desc",
    descriptionParams: { hex } as DescriptionParams,
    answer: binary,
    difficulty: "medium",
    icon: Binary,
  };
}

function generateUtf8EncodeHard(): ExerciseDefWithAnswer {
  const codePoint = randInt(0x0800, 0xd7ff);
  const hex = codePoint.toString(16).toUpperCase().padStart(4, "0");
  const bytes = getUtf8Bytes(codePoint);
  const binary = bytesToBinary(bytes);
  return {
    titleKey: "encoding.ex_utf8_encode_hard",
    descriptionKey: "encoding.ex_utf8_encode_hard_desc",
    descriptionParams: { hex } as DescriptionParams,
    answer: binary,
    difficulty: "hard",
    icon: Binary,
  };
}

function generateUtf8Encode4Byte(): ExerciseDefWithAnswer {
  const char = EMOJI_CHARS[randInt(0, EMOJI_CHARS.length - 1)];
  const codePoint = char.codePointAt(0)!;
  const hex = codePoint.toString(16).toUpperCase().padStart(4, "0");
  const bytes = getUtf8Bytes(codePoint);
  const binary = bytesToBinary(bytes);
  return {
    titleKey: "encoding.ex_utf8_encode_4byte",
    descriptionKey: "encoding.ex_utf8_encode_4byte_desc",
    descriptionParams: { char, hex } as DescriptionParams,
    answer: binary,
    difficulty: "hard",
    icon: Binary,
  };
}

// ==========================================
// UTF-8 Decode
// ==========================================
function generateUtf8DecodeEasy(): ExerciseDefWithAnswer {
  const codePoint = randInt(0x0000, 0x007f);
  const hex = codePoint.toString(16).toUpperCase().padStart(4, "0");
  const bytes = getUtf8Bytes(codePoint);
  const hexBytes = bytes
    .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
    .join(" ");
  return {
    titleKey: "encoding.ex_utf8_decode_easy",
    descriptionKey: "encoding.ex_utf8_decode_easy_desc",
    descriptionParams: { hexBytes } as DescriptionParams,
    answer: hex,
    difficulty: "easy",
    icon: Binary,
  };
}

function generateUtf8DecodeMedium(): ExerciseDefWithAnswer {
  const codePoint = randInt(0x0080, 0x07ff);
  const hex = codePoint.toString(16).toUpperCase().padStart(4, "0");
  const bytes = getUtf8Bytes(codePoint);
  const hexBytes = bytes
    .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
    .join(" ");
  return {
    titleKey: "encoding.ex_utf8_decode_medium",
    descriptionKey: "encoding.ex_utf8_decode_medium_desc",
    descriptionParams: { hexBytes } as DescriptionParams,
    answer: hex,
    difficulty: "medium",
    icon: Binary,
  };
}

function generateUtf8DecodeHard(): ExerciseDefWithAnswer {
  const codePoint = randInt(0x0800, 0xd7ff);
  const hex = codePoint.toString(16).toUpperCase().padStart(4, "0");
  const bytes = getUtf8Bytes(codePoint);
  const hexBytes = bytes
    .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
    .join(" ");
  return {
    titleKey: "encoding.ex_utf8_decode_hard",
    descriptionKey: "encoding.ex_utf8_decode_hard_desc",
    descriptionParams: { hexBytes } as DescriptionParams,
    answer: hex,
    difficulty: "hard",
    icon: Binary,
  };
}

function generateUtf8Decode4Byte(): ExerciseDefWithAnswer {
  const char = EMOJI_CHARS[randInt(0, EMOJI_CHARS.length - 1)];
  const codePoint = char.codePointAt(0)!;
  const hex = codePoint.toString(16).toUpperCase().padStart(4, "0");
  const bytes = getUtf8Bytes(codePoint);
  const hexBytes = bytes
    .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
    .join(" ");
  return {
    titleKey: "encoding.ex_utf8_decode_4byte",
    descriptionKey: "encoding.ex_utf8_decode_4byte_desc",
    descriptionParams: { hexBytes } as DescriptionParams,
    answer: hex,
    difficulty: "hard",
    icon: Binary,
  };
}

const generators: Record<EncodingExerciseType, () => ExerciseDefWithAnswer> = {
  base64_encode_easy: generateBase64EncodeEasy,
  base64_encode_medium: generateBase64EncodeMedium,
  base64_encode_hard: generateBase64EncodeHard,
  base64_decode_easy: generateBase64DecodeEasy,
  base64_decode_medium: generateBase64DecodeMedium,
  base64_decode_hard: generateBase64DecodeHard,
  utf8_encode_easy: generateUtf8EncodeEasy,
  utf8_encode_medium: generateUtf8EncodeMedium,
  utf8_encode_hard: generateUtf8EncodeHard,
  utf8_encode_4byte: generateUtf8Encode4Byte,
  utf8_decode_easy: generateUtf8DecodeEasy,
  utf8_decode_medium: generateUtf8DecodeMedium,
  utf8_decode_hard: generateUtf8DecodeHard,
  utf8_decode_4byte: generateUtf8Decode4Byte,
};

const easyTypes: EncodingExerciseType[] = [
  "base64_encode_easy",
  "base64_decode_easy",
  "utf8_encode_easy",
  "utf8_decode_easy",
];
const mediumTypes: EncodingExerciseType[] = [
  "base64_encode_medium",
  "base64_decode_medium",
  "utf8_encode_medium",
  "utf8_decode_medium",
];
const hardTypes: EncodingExerciseType[] = [
  "base64_encode_hard",
  "base64_decode_hard",
  "utf8_encode_hard",
  "utf8_decode_hard",
  "utf8_encode_4byte",
  "utf8_decode_4byte",
];

export function generateExercise(
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
    converterMode = type.includes("decode") ? "decode" : "encode";
    initialValue = type.includes("decode")
      ? String(params.encoded ?? "")
      : String(params.str ?? "");
  } else if (type.includes("utf8")) {
    mode = "utf8";
    converterMode = type.includes("decode") ? "decode" : "encode";

    if (type.includes("decode")) {
      const hex = def.answer; // for decode, the answer is hex.
      const codePoint = parseInt(hex, 16);
      const bytes = getUtf8Bytes(codePoint);
      initialValue = bytes
        .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
        .join(" ");
    } else {
      const hex = String(params.hex ?? "0");
      const codePoint = parseInt(hex, 16);
      initialValue = String.fromCodePoint(codePoint);
    }
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

export function generateEncodingExercises(): GeneratedExercise[] {
  const allTypes: EncodingExerciseType[] = [
    "base64_encode_easy",
    "base64_encode_medium",
    "base64_encode_hard",
    "base64_decode_easy",
    "base64_decode_medium",
    "base64_decode_hard",
    "utf8_encode_easy",
    "utf8_encode_medium",
    "utf8_encode_hard",
    "utf8_encode_4byte",
    "utf8_decode_easy",
    "utf8_decode_medium",
    "utf8_decode_hard",
    "utf8_decode_4byte",
  ];
  return allTypes.map((type, index) => generateExercise(type, index));
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
