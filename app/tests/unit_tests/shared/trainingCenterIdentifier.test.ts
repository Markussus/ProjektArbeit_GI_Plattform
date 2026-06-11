import { describe, expect, it } from "vitest";
import {
  MAX_TASK_STORAGE_ID,
  MAX_TOPIC_STORAGE_ID,
  SIMULATOR_TASK_STORAGE_ID,
  createTopicIdentifier,
  createTrainingCenterIdentifier,
  createTrainingCenterStorageValue,
  isSimulatorIdentifier,
  parseTrainingCenterStorageValue,
  readTopicIdentifier,
  readTrainingCenterIdentifier,
} from "@/lib/trainingCenter";

describe("training center identifiers", () => {
  it.each([0, 1, 63, 64, MAX_TOPIC_STORAGE_ID])(
    "round-trips topic storage id %i through two Base64URL characters",
    (topicStorageId) => {
      const identifier = createTopicIdentifier(topicStorageId);

      expect(identifier).toHaveLength(2);
      expect(identifier).toMatch(/^[A-Za-z0-9_-]{2}$/u);
      expect(readTopicIdentifier(identifier)).toBe(topicStorageId);
    },
  );

  it("encodes task and simulator identifiers as the third character", () => {
    const taskIdentifier = createTrainingCenterIdentifier(
      MAX_TOPIC_STORAGE_ID,
      MAX_TASK_STORAGE_ID,
    );
    const simulatorIdentifier = createTrainingCenterIdentifier(0);

    expect(taskIdentifier).toHaveLength(3);
    expect(readTrainingCenterIdentifier(taskIdentifier)).toEqual({
      topicStorageId: MAX_TOPIC_STORAGE_ID,
      taskStorageId: MAX_TASK_STORAGE_ID,
    });
    expect(readTrainingCenterIdentifier(simulatorIdentifier)).toEqual({
      topicStorageId: 0,
      taskStorageId: SIMULATOR_TASK_STORAGE_ID,
    });
    expect(isSimulatorIdentifier(taskIdentifier)).toBe(false);
    expect(isSimulatorIdentifier(simulatorIdentifier)).toBe(true);
  });

  it("combines and parses the three-character prefix and custom payload", () => {
    const identifier = createTrainingCenterIdentifier(7, 12);
    const value = createTrainingCenterStorageValue(identifier, "payload-_");

    expect(parseTrainingCenterStorageValue(value)).toEqual({
      identifier,
      topicIdentifier: identifier.slice(0, 2),
      topicStorageId: 7,
      taskStorageId: 12,
      payload: "payload-_",
    });
  });

  it.each([
    () => createTopicIdentifier(-1),
    () => createTopicIdentifier(MAX_TOPIC_STORAGE_ID + 1),
    () => createTrainingCenterIdentifier(0, MAX_TASK_STORAGE_ID + 2),
    () => readTopicIdentifier("A"),
    () => readTrainingCenterIdentifier("AAA="),
  ])("rejects identifiers outside the defined bit layout", (operation) => {
    expect(operation).toThrow("training_center_identifier_invalid");
  });
});
