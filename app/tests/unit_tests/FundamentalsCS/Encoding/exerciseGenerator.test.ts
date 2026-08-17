import { describe, expect, test } from "vitest";
import {
  generateExercise,
  generateEncodingExercises,
  generateExerciseByDifficulty,
  type EncodingExerciseType,
} from "@/pages/FundamentalsCS/Encoding/utils/exerciseGenerator.ts";

const ALL_TYPES: EncodingExerciseType[] = [
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

interface TypeExpectations {
  mode: "base64" | "utf8";
  converterMode: "encode" | "decode";
  difficulty: "easy" | "medium" | "hard";
  minCodePoint?: number;
  maxCodePoint?: number;
  byteCount?: number;
  textLength?: number;
}

const TYPE_EXPECTATIONS: Record<EncodingExerciseType, TypeExpectations> = {
  base64_encode_easy: {
    mode: "base64",
    converterMode: "encode",
    difficulty: "easy",
    textLength: 1,
  },
  base64_encode_medium: {
    mode: "base64",
    converterMode: "encode",
    difficulty: "medium",
    textLength: 3,
  },
  base64_encode_hard: {
    mode: "base64",
    converterMode: "encode",
    difficulty: "hard",
    textLength: 5,
  },
  base64_decode_easy: {
    mode: "base64",
    converterMode: "decode",
    difficulty: "easy",
    textLength: 1,
  },
  base64_decode_medium: {
    mode: "base64",
    converterMode: "decode",
    difficulty: "medium",
    textLength: 3,
  },
  base64_decode_hard: {
    mode: "base64",
    converterMode: "decode",
    difficulty: "hard",
    textLength: 5,
  },
  utf8_encode_easy: {
    mode: "utf8",
    converterMode: "encode",
    difficulty: "easy",
    minCodePoint: 0x0000,
    maxCodePoint: 0x007f,
    byteCount: 1,
  },
  utf8_encode_medium: {
    mode: "utf8",
    converterMode: "encode",
    difficulty: "medium",
    minCodePoint: 0x0080,
    maxCodePoint: 0x07ff,
    byteCount: 2,
  },
  utf8_encode_hard: {
    mode: "utf8",
    converterMode: "encode",
    difficulty: "hard",
    minCodePoint: 0x0800,
    maxCodePoint: 0xd7ff,
    byteCount: 3,
  },
  utf8_encode_4byte: {
    mode: "utf8",
    converterMode: "encode",
    difficulty: "hard",
    minCodePoint: 0x10000,
    maxCodePoint: 0x10ffff,
    byteCount: 4,
  },
  utf8_decode_easy: {
    mode: "utf8",
    converterMode: "decode",
    difficulty: "easy",
    minCodePoint: 0x0000,
    maxCodePoint: 0x007f,
    byteCount: 1,
  },
  utf8_decode_medium: {
    mode: "utf8",
    converterMode: "decode",
    difficulty: "medium",
    minCodePoint: 0x0080,
    maxCodePoint: 0x07ff,
    byteCount: 2,
  },
  utf8_decode_hard: {
    mode: "utf8",
    converterMode: "decode",
    difficulty: "hard",
    minCodePoint: 0x0800,
    maxCodePoint: 0xd7ff,
    byteCount: 3,
  },
  utf8_decode_4byte: {
    mode: "utf8",
    converterMode: "decode",
    difficulty: "hard",
    minCodePoint: 0x10000,
    maxCodePoint: 0x10ffff,
    byteCount: 4,
  },
};

function utf8BytesOf(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

function bytesToBinary(bytes: number[]): string {
  return bytes.map((b) => b.toString(2).padStart(8, "0")).join(" ");
}

function decodeUtf8(hexBytes: string): string {
  const bytes = hexBytes.split(" ").map((b) => parseInt(b, 16));
  return new TextDecoder().decode(new Uint8Array(bytes));
}

describe("exerciseGenerator", () => {
  describe("generateExercise", () => {
    test("generates all 14 exercise types with the correct structure", () => {
      for (const type of ALL_TYPES) {
        const exercise = generateExercise(type, 0);
        const expectations = TYPE_EXPECTATIONS[type];

        expect(exercise.exerciseType).toBe(type);
        expect(exercise.mode).toBe(expectations.mode);
        expect(exercise.converterMode).toBe(expectations.converterMode);
        expect(exercise.difficulty).toBe(expectations.difficulty);
        expect(exercise.id.startsWith(`encoding.ex_generated_${type}_`)).toBe(
          true,
        );
        expect(exercise.initialValue.length).toBeGreaterThan(0);
        expect(exercise.answer.length).toBeGreaterThan(0);
        expect(typeof exercise.descriptionKey).toBe("string");
        expect(exercise.descriptionParams).toBeTruthy();
        expect(exercise.icon).toBeTruthy();
      }
    });

    test("generates correct base64 encode answers", () => {
      for (const type of ALL_TYPES.filter((t) =>
        t.startsWith("base64_encode"),
      )) {
        const exercise = generateExercise(type, 0);
        const expectations = TYPE_EXPECTATIONS[type];
        const expected = btoa(exercise.initialValue);

        expect(exercise.answer).toBe(expected);
        expect(exercise.initialValue.length).toBeGreaterThanOrEqual(
          expectations.textLength!,
        );
        expect(exercise.initialValue.length).toBeLessThanOrEqual(
          expectations.textLength! + 3,
        );
        expect(exercise.answer.length).toBe(
          Math.ceil(exercise.initialValue.length / 3) * 4,
        );
        expect(
          exercise.descriptionParams as Record<string, unknown>,
        ).toMatchObject({ str: exercise.initialValue });
      }
    });

    test("generates correct base64 decode answers", () => {
      for (const type of ALL_TYPES.filter((t) =>
        t.startsWith("base64_decode"),
      )) {
        const exercise = generateExercise(type, 0);
        const expectations = TYPE_EXPECTATIONS[type];

        expect(exercise.answer.length).toBeGreaterThanOrEqual(
          expectations.textLength!,
        );
        expect(exercise.answer.length).toBeLessThanOrEqual(
          expectations.textLength! + 3,
        );
        expect(atob(exercise.initialValue)).toBe(exercise.answer);
        expect(/^[A-Za-z0-9+/=]+$/.test(exercise.initialValue)).toBe(true);
        expect(
          exercise.descriptionParams as Record<string, unknown>,
        ).toMatchObject({ encoded: exercise.initialValue });
      }
    });

    test("generates correct utf8 encode answers with matching byte counts", () => {
      for (const type of ALL_TYPES.filter((t) => t.startsWith("utf8_encode"))) {
        const exercise = generateExercise(type, 0);
        const expectations = TYPE_EXPECTATIONS[type];
        const codePoint = exercise.initialValue.codePointAt(0)!;

        expect(Array.from(exercise.initialValue).length).toBe(1);
        expect(codePoint).toBeGreaterThanOrEqual(expectations.minCodePoint!);
        expect(codePoint).toBeLessThanOrEqual(expectations.maxCodePoint!);
        expect(utf8BytesOf(exercise.initialValue).length).toBe(
          expectations.byteCount,
        );
        expect(exercise.answer).toBe(
          bytesToBinary(utf8BytesOf(exercise.initialValue)),
        );
        expect(
          exercise.descriptionParams as Record<string, unknown>,
        ).toMatchObject({
          hex: codePoint.toString(16).toUpperCase().padStart(4, "0"),
        });
      }
    });

    test("generates emoji characters for 4-byte utf8 encode exercises", () => {
      const exercise = generateExercise("utf8_encode_4byte", 0);
      const params = exercise.descriptionParams as Record<string, unknown>;
      expect(params.char).toBe(exercise.initialValue);
      expect(exercise.initialValue.codePointAt(0)!).toBeGreaterThan(0xffff);
    });

    test("generates correct utf8 decode answers with matching byte counts", () => {
      for (const type of ALL_TYPES.filter((t) => t.startsWith("utf8_decode"))) {
        const exercise = generateExercise(type, 0);
        const expectations = TYPE_EXPECTATIONS[type];
        const hexBytes = exercise.initialValue;
        const byteCount = hexBytes.split(" ").length;
        const codePoint = parseInt(exercise.answer, 16);

        expect(byteCount).toBe(expectations.byteCount);
        expect(codePoint).toBeGreaterThanOrEqual(expectations.minCodePoint!);
        expect(codePoint).toBeLessThanOrEqual(expectations.maxCodePoint!);
        expect(exercise.answer).toBe(
          codePoint.toString(16).toUpperCase().padStart(4, "0"),
        );
        expect(decodeUtf8(hexBytes)).toBe(String.fromCodePoint(codePoint));
        expect(
          exercise.descriptionParams as Record<string, unknown>,
        ).toMatchObject({ hexBytes });
      }
    });

    test("generates unique ids for different indices", () => {
      const a = generateExercise("base64_encode_easy", 1);
      const b = generateExercise("base64_encode_easy", 2);
      expect(a.id).not.toBe(b.id);
    });

    test("generates base64 encode easy with single character input", () => {
      const exercise = generateExercise("base64_encode_easy", 0);
      expect(exercise.exerciseType).toBe("base64_encode_easy");
      expect(exercise.mode).toBe("base64");
      expect(exercise.converterMode).toBe("encode");
      expect(exercise.difficulty).toBe("easy");
      expect(exercise.initialValue.length).toBe(1);
      expect(exercise.answer).toBe(btoa(exercise.initialValue));
    });

    test("generates base64 decode hard correctly", () => {
      const exercise = generateExercise("base64_decode_hard", 1);
      expect(exercise.exerciseType).toBe("base64_decode_hard");
      expect(exercise.mode).toBe("base64");
      expect(exercise.converterMode).toBe("decode");
      expect(exercise.difficulty).toBe("hard");
      expect(typeof exercise.initialValue).toBe("string");
      expect(exercise.answer.length).toBeGreaterThanOrEqual(5);
      expect(atob(exercise.initialValue)).toBe(exercise.answer);
    });

    test("generates utf8 encode medium correctly", () => {
      const exercise = generateExercise("utf8_encode_medium", 2);
      expect(exercise.exerciseType).toBe("utf8_encode_medium");
      expect(exercise.mode).toBe("utf8");
      expect(exercise.converterMode).toBe("encode");
      expect(exercise.difficulty).toBe("medium");
      expect(utf8BytesOf(exercise.initialValue).length).toBe(2);
    });

    test("generates utf8 decode easy correctly", () => {
      const exercise = generateExercise("utf8_decode_easy", 3);
      expect(exercise.exerciseType).toBe("utf8_decode_easy");
      expect(exercise.mode).toBe("utf8");
      expect(exercise.converterMode).toBe("decode");
      expect(exercise.difficulty).toBe("easy");
      expect(exercise.initialValue.split(" ").length).toBe(1);
      expect(decodeUtf8(exercise.initialValue)).toBe(
        String.fromCodePoint(parseInt(exercise.answer, 16)),
      );
    });

    test("never generates surrogate code points for utf8 hard exercises", () => {
      for (let i = 0; i < 500; i++) {
        const encode = generateExercise("utf8_encode_hard", i);
        const decode = generateExercise("utf8_decode_hard", i);
        const cpEncode = encode.initialValue.codePointAt(0)!;
        const cpDecode = parseInt(decode.answer, 16);
        expect(cpEncode).toBeGreaterThanOrEqual(0x0800);
        expect(cpEncode).toBeLessThanOrEqual(0xd7ff);
        expect(cpDecode).toBeGreaterThanOrEqual(0x0800);
        expect(cpDecode).toBeLessThanOrEqual(0xd7ff);
      }
    });
  });

  describe("generateEncodingExercises", () => {
    test("generates one exercise of every type in order", () => {
      const exercises = generateEncodingExercises();
      expect(exercises.length).toBe(14);
      expect(exercises.map((e) => e.exerciseType)).toEqual(ALL_TYPES);
    });

    test("generates unique ids", () => {
      const exercises = generateEncodingExercises();
      const ids = exercises.map((e) => e.id);
      expect(new Set(ids).size).toBe(14);
    });

    test("contains all three difficulties", () => {
      const exercises = generateEncodingExercises();
      const difficulties = new Set(exercises.map((e) => e.difficulty));
      expect(difficulties).toEqual(new Set(["easy", "medium", "hard"]));
    });

    test("generates exercises that can be validated against their own answers", () => {
      for (const exercise of generateEncodingExercises()) {
        if (exercise.exerciseType.startsWith("base64_encode")) {
          expect(btoa(exercise.initialValue)).toBe(exercise.answer);
        } else if (exercise.exerciseType.startsWith("base64_decode")) {
          expect(atob(exercise.initialValue)).toBe(exercise.answer);
        } else if (exercise.exerciseType.startsWith("utf8_encode")) {
          expect(bytesToBinary(utf8BytesOf(exercise.initialValue))).toBe(
            exercise.answer,
          );
        } else {
          const codePoint = parseInt(exercise.answer, 16);
          expect(decodeUtf8(exercise.initialValue)).toBe(
            String.fromCodePoint(codePoint),
          );
        }
      }
    });
  });

  describe("generateExerciseByDifficulty", () => {
    test("generates an easy exercise", () => {
      const exercise = generateExerciseByDifficulty("easy", 0);
      expect(exercise.difficulty).toBe("easy");
      expect([
        "base64_encode_easy",
        "base64_decode_easy",
        "utf8_encode_easy",
        "utf8_decode_easy",
      ]).toContain(exercise.exerciseType);
    });

    test("generates a medium exercise", () => {
      const exercise = generateExerciseByDifficulty("medium", 1);
      expect(exercise.difficulty).toBe("medium");
      expect([
        "base64_encode_medium",
        "base64_decode_medium",
        "utf8_encode_medium",
        "utf8_decode_medium",
      ]).toContain(exercise.exerciseType);
    });

    test("generates a hard exercise", () => {
      const exercise = generateExerciseByDifficulty("hard", 2);
      expect(exercise.difficulty).toBe("hard");
      expect([
        "base64_encode_hard",
        "base64_decode_hard",
        "utf8_encode_hard",
        "utf8_decode_hard",
        "utf8_encode_4byte",
        "utf8_decode_4byte",
      ]).toContain(exercise.exerciseType);
    });
  });
});
