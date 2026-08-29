export const TOPIC_STORAGE_IDS = {
  turingMachine: 0,
  finiteAutomata: 1,
  regularLanguages: 2,
  numberSystems: 3,
  mooreMealy: 4,
  dnf: 5,
  encoding: 6,
  javaProgramming: 7,
} as const;

export type TopicStorageIdKey = keyof typeof TOPIC_STORAGE_IDS;
export type TopicStorageId =
  (typeof TOPIC_STORAGE_IDS)[keyof typeof TOPIC_STORAGE_IDS];
