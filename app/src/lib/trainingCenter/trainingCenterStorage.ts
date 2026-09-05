import {
  parseTrainingCenterStorageValue,
  readTopicIdentifier,
  readTrainingCenterIdentifier,
  TOPIC_IDENTIFIER_LENGTH,
  TRAINING_CENTER_IDENTIFIER_LENGTH,
} from "./trainingCenterIdentifier";

export const TRAINING_CENTER_STORAGE_KEY = "TrainingCenterStorage";

export interface ITrainingCenterStorage {
  store: (value: string) => void;
  load: (identifier: string) => string;
  delete: (identifier: string) => void;
  deleteAll: (topicIdentifier?: string) => void;
}

export const trainingCenterStorage: ITrainingCenterStorage = {
  store(value) {
    const storage = getLocalStorage();
    if (!storage) {
      return;
    }

    const { identifier } = parseTrainingCenterStorageValue(value);
    const entries = readEntries(storage);
    const existingIndex = entries.findIndex((entry) =>
      entry.startsWith(identifier),
    );

    if (existingIndex === -1) {
      entries.push(value);
    } else {
      entries[existingIndex] = value;
    }

    writeEntries(storage, entries);
  },

  load(identifier) {
    readTrainingCenterIdentifier(identifier);
    const storage = getLocalStorage();
    if (!storage) {
      return "";
    }

    return (
      readEntries(storage).find((entry) => entry.startsWith(identifier)) ?? ""
    );
  },

  delete(identifier) {
    readTrainingCenterIdentifier(identifier);
    const storage = getLocalStorage();
    if (!storage) {
      return;
    }

    writeEntries(
      storage,
      readEntries(storage).filter((entry) => !entry.startsWith(identifier)),
    );
  },

  deleteAll(topicIdentifier) {
    const storage = getLocalStorage();
    if (!storage) {
      return;
    }

    if (topicIdentifier === undefined) {
      storage.removeItem(TRAINING_CENTER_STORAGE_KEY);
      return;
    }

    readTopicIdentifier(topicIdentifier);
    writeEntries(
      storage,
      readEntries(storage).filter(
        (entry) => !entry.startsWith(topicIdentifier),
      ),
    );
  },
};

function getLocalStorage(): Storage | undefined {
  try {
    return globalThis.window?.localStorage ?? globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function readEntries(storage: Storage): string[] {
  const serializedEntries = storage.getItem(TRAINING_CENTER_STORAGE_KEY);
  if (!serializedEntries) {
    return [];
  }

  try {
    const entries: unknown = JSON.parse(serializedEntries);
    if (!Array.isArray(entries)) {
      return [];
    }

    return entries.filter(isStorageEntry);
  } catch {
    return [];
  }
}

function writeEntries(storage: Storage, entries: string[]): void {
  if (entries.length === 0) {
    storage.removeItem(TRAINING_CENTER_STORAGE_KEY);
    return;
  }

  storage.setItem(TRAINING_CENTER_STORAGE_KEY, JSON.stringify(entries));
}

function isStorageEntry(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length < TRAINING_CENTER_IDENTIFIER_LENGTH
  ) {
    return false;
  }

  try {
    readTrainingCenterIdentifier(
      value.slice(0, TRAINING_CENTER_IDENTIFIER_LENGTH),
    );
    readTopicIdentifier(value.slice(0, TOPIC_IDENTIFIER_LENGTH));
    return true;
  } catch {
    return false;
  }
}
