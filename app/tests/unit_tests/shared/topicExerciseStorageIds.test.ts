import { describe, expect, it } from "vitest";
import {
  MAX_TASK_STORAGE_ID,
  SIMULATOR_TASK_STORAGE_ID,
  createTrainingCenterIdentifier,
} from "@/lib/trainingCenter";
import { allFAExercises } from "@/pages/FundamentalsCS/FiniteAutomata/exercises/faExerciseDefinitions";
import { rlExercises } from "@/pages/FundamentalsCS/RegularLanguages/exercises/rlExerciseDefinitions";
import { RL_STORAGE_TASK_IDS } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/useRLPersistedSource";

/**
 * Two exercises sharing a slot would silently overwrite each other's saved
 * draft, and an exercise sitting on a free-simulator slot would collide with
 * the simulator. Neither failure is visible until a learner loses work, so the
 * layout is asserted here.
 */
const topics = [
  { name: "Finite Automata", exercises: allFAExercises },
  { name: "Regular Languages", exercises: rlExercises },
];

describe.each(topics)("$name exercise storage ids", ({ exercises }) => {
  it("gives every exercise its own slot", () => {
    const storageIds = exercises.map((exercise) => exercise.storageId);

    expect(new Set(storageIds).size).toBe(storageIds.length);
  });

  it("keeps every slot inside the addressable task range", () => {
    for (const exercise of exercises) {
      expect(exercise.storageId).toBeGreaterThanOrEqual(0);
      expect(exercise.storageId).toBeLessThanOrEqual(MAX_TASK_STORAGE_ID);
      expect(exercise.storageId).not.toBe(SIMULATOR_TASK_STORAGE_ID);
    }
  });

  it("produces a usable identifier for every exercise", () => {
    for (const exercise of exercises) {
      expect(() =>
        createTrainingCenterIdentifier(0, exercise.storageId),
      ).not.toThrow();
    }
  });
});

describe("Regular Languages free-mode slots", () => {
  it("never collides with an exercise slot", () => {
    const exerciseIds = new Set(
      rlExercises.map((exercise) => exercise.storageId),
    );

    for (const taskStorageId of Object.values(RL_STORAGE_TASK_IDS)) {
      expect(exerciseIds.has(taskStorageId)).toBe(false);
    }
  });

  it("gives each of the three modes a distinct slot", () => {
    const modeIds = Object.values(RL_STORAGE_TASK_IDS);

    expect(new Set(modeIds).size).toBe(modeIds.length);
  });

  it("is non-zero, so the imported-task mode lookup can tell it apart", () => {
    // `modeForImportedTask` treats a falsy id as "no import", so slot 0 would
    // leave a shared free-mode grammar without its editor.
    for (const taskStorageId of Object.values(RL_STORAGE_TASK_IDS)) {
      expect(taskStorageId).toBeGreaterThan(0);
    }
  });
});
