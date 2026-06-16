import { describe, expect, test } from "vitest";
import {
  generateExercise,
  generateEncodingExercises,
  generateExerciseByDifficulty,
} from "@/pages/FundamentalsCS/Encoding/utils/exerciseGenerator.ts";

describe("exerciseGenerator", () => {
  describe("generateExercise", () => {
    test("generates base64 encode easy correctly", () => {
      const exercise = generateExercise("base64_encode_easy", 0);
      expect(exercise.exerciseType).toBe("base64_encode_easy");
      expect(exercise.mode).toBe("base64");
      expect(exercise.converterMode).toBe("encode");
      expect(exercise.difficulty).toBe("easy");
      expect(typeof exercise.initialValue).toBe("string");
      expect(exercise.initialValue.length).toBe(1);
      expect(typeof exercise.answer).toBe("string");
    });

    test("generates base64 decode hard correctly", () => {
      const exercise = generateExercise("base64_decode_hard", 1);
      expect(exercise.exerciseType).toBe("base64_decode_hard");
      expect(exercise.mode).toBe("base64");
      expect(exercise.converterMode).toBe("decode");
      expect(exercise.difficulty).toBe("hard");
      expect(typeof exercise.initialValue).toBe("string");
      expect(typeof exercise.answer).toBe("string");
    });

    test("generates utf8 encode medium correctly", () => {
      const exercise = generateExercise("utf8_encode_medium", 2);
      expect(exercise.exerciseType).toBe("utf8_encode_medium");
      expect(exercise.mode).toBe("utf8");
      expect(exercise.converterMode).toBe("encode");
      expect(exercise.difficulty).toBe("medium");
      expect(typeof exercise.initialValue).toBe("string");
      expect(exercise.initialValue.length).toBeGreaterThan(0);
      expect(typeof exercise.answer).toBe("string");
    });

    test("generates utf8 decode easy correctly", () => {
      const exercise = generateExercise("utf8_decode_easy", 3);
      expect(exercise.exerciseType).toBe("utf8_decode_easy");
      expect(exercise.mode).toBe("utf8");
      expect(exercise.converterMode).toBe("decode");
      expect(exercise.difficulty).toBe("easy");
      // Initial value for decode is a space separated string of hex bytes
      expect(typeof exercise.initialValue).toBe("string");
      expect(exercise.initialValue.split(" ").length).toBeGreaterThan(0);
      expect(typeof exercise.answer).toBe("string");
    });
  });

  describe("generateEncodingExercises", () => {
    test("generates default count of 12 exercises with mixed difficulty", () => {
      const exercises = generateEncodingExercises(12);
      expect(exercises.length).toBe(12);

      const easyCount = exercises.filter((e) => e.difficulty === "easy").length;
      const mediumCount = exercises.filter(
        (e) => e.difficulty === "medium",
      ).length;
      const hardCount = exercises.filter((e) => e.difficulty === "hard").length;

      expect(easyCount).toBeGreaterThan(0);
      expect(mediumCount).toBeGreaterThan(0);
      expect(hardCount).toBeGreaterThan(0);
    });

    test("generates correct number of exercises if non-default count provided", () => {
      const exercises = generateEncodingExercises(6);
      expect(exercises.length).toBe(6);
    });
  });

  describe("generateExerciseByDifficulty", () => {
    test("generates an easy exercise", () => {
      const exercise = generateExerciseByDifficulty("easy", 0);
      expect(exercise.difficulty).toBe("easy");
    });

    test("generates a medium exercise", () => {
      const exercise = generateExerciseByDifficulty("medium", 1);
      expect(exercise.difficulty).toBe("medium");
    });

    test("generates a hard exercise", () => {
      const exercise = generateExerciseByDifficulty("hard", 2);
      expect(exercise.difficulty).toBe("hard");
    });
  });
});
