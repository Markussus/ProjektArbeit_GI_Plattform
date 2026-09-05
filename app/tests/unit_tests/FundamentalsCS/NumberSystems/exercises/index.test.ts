import { describe, expect, it } from "vitest";
import { numberSystemsExercises } from "../../../../../src/pages/FundamentalsCS/NumberSystems/exercises";

describe("Number Systems exercises", () => {
  describe("exercise definitions", () => {
    it("exports 10 exercises", () => {
      expect(numberSystemsExercises).toHaveLength(10);
    });

    it("defines ex_u03_decToBin as easy difficulty", () => {
      const exercise = numberSystemsExercises.find(
        (ex) => ex.titleKey === "number-systems.ex_u03_decToBin",
      );

      expect(exercise).toBeDefined();
      expect(exercise?.difficulty).toBe("easy");
    });

    it("defines ex_u03_binAdd as medium difficulty", () => {
      const exercise = numberSystemsExercises.find(
        (ex) => ex.titleKey === "number-systems.ex_u03_binAdd",
      );

      expect(exercise).toBeDefined();
      expect(exercise?.difficulty).toBe("medium");
    });

    it("defines ex_u04_binToHexOct as easy difficulty", () => {
      const exercise = numberSystemsExercises.find(
        (ex) => ex.titleKey === "number-systems.ex_u04_binToHexOct",
      );

      expect(exercise).toBeDefined();
      expect(exercise?.difficulty).toBe("easy");
    });

    it("defines ex_u04_octToHex as medium difficulty", () => {
      const exercise = numberSystemsExercises.find(
        (ex) => ex.titleKey === "number-systems.ex_u04_octToHex",
      );

      expect(exercise).toBeDefined();
      expect(exercise?.difficulty).toBe("medium");
    });

    it("defines ex_u04_hexToBin as easy difficulty", () => {
      const exercise = numberSystemsExercises.find(
        (ex) => ex.titleKey === "number-systems.ex_u04_hexToBin",
      );

      expect(exercise).toBeDefined();
      expect(exercise?.difficulty).toBe("easy");
    });

    it("defines ex_u05_floatToBin as medium difficulty", () => {
      const exercise = numberSystemsExercises.find(
        (ex) => ex.titleKey === "number-systems.ex_u05_floatToBin",
      );

      expect(exercise).toBeDefined();
      expect(exercise?.difficulty).toBe("medium");
    });

    it("defines ex_u05_ieeeEncode as hard difficulty", () => {
      const exercise = numberSystemsExercises.find(
        (ex) => ex.titleKey === "number-systems.ex_u05_ieeeEncode",
      );

      expect(exercise).toBeDefined();
      expect(exercise?.difficulty).toBe("hard");
    });

    it("defines ex_u05_ieeeDecode as hard difficulty", () => {
      const exercise = numberSystemsExercises.find(
        (ex) => ex.titleKey === "number-systems.ex_u05_ieeeDecode",
      );

      expect(exercise).toBeDefined();
      expect(exercise?.difficulty).toBe("hard");
    });

    it("defines ex_u06_addSub as medium difficulty", () => {
      const exercise = numberSystemsExercises.find(
        (ex) => ex.titleKey === "number-systems.ex_u06_addSub",
      );

      expect(exercise).toBeDefined();
      expect(exercise?.difficulty).toBe("medium");
    });

    it("defines ex_u06_mult as hard difficulty", () => {
      const exercise = numberSystemsExercises.find(
        (ex) => ex.titleKey === "number-systems.ex_u06_mult",
      );

      expect(exercise).toBeDefined();
      expect(exercise?.difficulty).toBe("hard");
    });

    it("all exercises have a title key and description key", () => {
      for (const exercise of numberSystemsExercises) {
        expect(exercise.titleKey).toBeTruthy();
        expect(exercise.descriptionKey).toBeTruthy();
        expect(exercise.icon).toBeTruthy();
      }
    });

    it("all difficulty values are valid", () => {
      const validDifficulties = ["easy", "medium", "hard"];
      for (const exercise of numberSystemsExercises) {
        expect(validDifficulties).toContain(exercise.difficulty);
      }
    });
  });
});
