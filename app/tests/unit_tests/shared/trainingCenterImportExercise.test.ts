import { describe, expect, it } from "vitest";
import type { TFunction } from "i18next";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import {
  SIMULATOR_TASK_STORAGE_ID,
  createTrainingCenterIdentifier,
  createTrainingCenterStorageValue,
  parseTrainingCenterStorageValue,
} from "@/lib/trainingCenter";
import { createTrainingCenterExerciseFromImport } from "@/lib/trainingCenter/trainingCenterImportNavigation";
import { allFAExercises } from "@/pages/FundamentalsCS/FiniteAutomata/exercises/faExerciseDefinitions";
import { rlExercises } from "@/pages/FundamentalsCS/RegularLanguages/exercises/rlExerciseDefinitions";

/** Echoes the key back, so assertions read against translation keys. */
const t = ((key: string) => key) as unknown as TFunction;

function parsedImport(topicStorageId: number, taskStorageId: number) {
  return parseTrainingCenterStorageValue(
    createTrainingCenterStorageValue(
      createTrainingCenterIdentifier(topicStorageId, taskStorageId),
      "AA",
    ),
  );
}

describe("createTrainingCenterExerciseFromImport", () => {
  it("resolves a Finite Automata exercise from its slot", () => {
    const expected = allFAExercises[3];

    const exercise = createTrainingCenterExerciseFromImport(
      parsedImport(TOPIC_STORAGE_IDS.finiteAutomata, expected.storageId),
      t,
    );

    expect(exercise).toMatchObject({
      id: expected.titleKey,
      kind: "exercise",
      difficulty: expected.difficulty,
    });
  });

  it("resolves a Regular Languages exercise from its slot", () => {
    const expected = rlExercises[5];

    const exercise = createTrainingCenterExerciseFromImport(
      parsedImport(TOPIC_STORAGE_IDS.regularLanguages, expected.storageId),
      t,
    );

    expect(exercise).toMatchObject({
      id: expected.titleKey,
      kind: "exercise",
      difficulty: expected.difficulty,
    });
  });

  it.each([
    ["finiteAutomata", TOPIC_STORAGE_IDS.finiteAutomata],
    ["regularLanguages", TOPIC_STORAGE_IDS.regularLanguages],
  ])("treats a %s free-simulator import as no exercise", (_name, topic) => {
    expect(
      createTrainingCenterExerciseFromImport(
        parsedImport(topic, SIMULATOR_TASK_STORAGE_ID),
        t,
      ),
    ).toBeNull();
  });

  it("returns null for a slot no exercise claims", () => {
    // One past the last Regular Languages exercise, and below the free-mode
    // slots — an id nothing in the topic answers to.
    expect(
      createTrainingCenterExerciseFromImport(
        parsedImport(TOPIC_STORAGE_IDS.regularLanguages, rlExercises.length),
        t,
      ),
    ).toBeNull();
  });

  it("round-trips every exercise slot in both topics", () => {
    const topics = [
      { topic: TOPIC_STORAGE_IDS.finiteAutomata, exercises: allFAExercises },
      { topic: TOPIC_STORAGE_IDS.regularLanguages, exercises: rlExercises },
    ];

    for (const { topic, exercises } of topics) {
      for (const expected of exercises) {
        expect(
          createTrainingCenterExerciseFromImport(
            parsedImport(topic, expected.storageId),
            t,
          ),
        ).toMatchObject({ id: expected.titleKey });
      }
    }
  });
});
