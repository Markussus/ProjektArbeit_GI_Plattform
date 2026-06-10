import { BitReader, BitWriter } from "./bitStream";

export const TOPIC_IDENTIFIER_LENGTH = 2;
export const TRAINING_CENTER_IDENTIFIER_LENGTH = 3;
export const MAX_TOPIC_STORAGE_ID = 0xfff;
export const MAX_TASK_STORAGE_ID = 0x3e;
export const SIMULATOR_TASK_STORAGE_ID = 0x3f;

const IDENTIFIER_ERROR = "training_center_identifier_invalid";

export interface TrainingCenterIdentifier {
  topicStorageId: number;
  taskStorageId: number;
}

export interface TrainingCenterStorageValue extends TrainingCenterIdentifier {
  identifier: string;
  topicIdentifier: string;
  payload: string;
}

export function createTopicIdentifier(topicStorageId: number): string {
  assertIntegerInRange(topicStorageId, 0, MAX_TOPIC_STORAGE_ID);

  const writer = new BitWriter(IDENTIFIER_ERROR);
  writer.writeBits(topicStorageId, 12);
  return writer.toBase64Url();
}

export function readTopicIdentifier(topicIdentifier: string): number {
  assertIdentifier(topicIdentifier, TOPIC_IDENTIFIER_LENGTH);
  return BitReader.fromBase64Url(topicIdentifier, IDENTIFIER_ERROR).readBits(
    12,
  );
}

export function createTrainingCenterIdentifier(
  topicStorageId: number,
  taskStorageId = SIMULATOR_TASK_STORAGE_ID,
): string {
  assertIntegerInRange(taskStorageId, 0, SIMULATOR_TASK_STORAGE_ID);
  return `${createTopicIdentifier(topicStorageId)}${encodeSixBitValue(
    taskStorageId,
  )}`;
}

export function readTrainingCenterIdentifier(
  identifier: string,
): TrainingCenterIdentifier {
  assertIdentifier(identifier, TRAINING_CENTER_IDENTIFIER_LENGTH);

  return {
    topicStorageId: readTopicIdentifier(
      identifier.slice(0, TOPIC_IDENTIFIER_LENGTH),
    ),
    taskStorageId: decodeSixBitValue(identifier[TOPIC_IDENTIFIER_LENGTH]),
  };
}

export function createTrainingCenterStorageValue(
  identifier: string,
  payload: string,
): string {
  readTrainingCenterIdentifier(identifier);
  return `${identifier}${payload}`;
}

export function parseTrainingCenterStorageValue(
  value: string,
): TrainingCenterStorageValue {
  if (value.length < TRAINING_CENTER_IDENTIFIER_LENGTH) {
    throw new Error(IDENTIFIER_ERROR);
  }

  const identifier = value.slice(0, TRAINING_CENTER_IDENTIFIER_LENGTH);
  const topicIdentifier = identifier.slice(0, TOPIC_IDENTIFIER_LENGTH);

  return {
    ...readTrainingCenterIdentifier(identifier),
    identifier,
    topicIdentifier,
    payload: value.slice(TRAINING_CENTER_IDENTIFIER_LENGTH),
  };
}

export function isSimulatorIdentifier(identifier: string): boolean {
  return (
    readTrainingCenterIdentifier(identifier).taskStorageId ===
    SIMULATOR_TASK_STORAGE_ID
  );
}

function encodeSixBitValue(value: number): string {
  const writer = new BitWriter(IDENTIFIER_ERROR);
  writer.writeBits(value, 6);
  return writer.toBase64Url();
}

function decodeSixBitValue(character: string | undefined): number {
  if (!character) {
    throw new Error(IDENTIFIER_ERROR);
  }
  return BitReader.fromBase64Url(character, IDENTIFIER_ERROR).readBits(6);
}

function assertIdentifier(value: string, length: number): void {
  if (value.length !== length || !/^[A-Za-z0-9_-]+$/u.test(value)) {
    throw new Error(IDENTIFIER_ERROR);
  }
}

function assertIntegerInRange(
  value: number,
  minimum: number,
  maximum: number,
): void {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(IDENTIFIER_ERROR);
  }
}
