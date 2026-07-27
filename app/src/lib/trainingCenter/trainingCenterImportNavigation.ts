import type { TFunction } from "i18next";
import type { Exercise, ExerciseDefinition } from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";
import {
  findTopicByPath,
  findTopicByStorageId,
  TOPIC_STORAGE_IDS,
} from "@/data/moduleCatalog";
import { dnfExercises } from "@/pages/FundamentalsCS/Dnf/exercises";
import { mooreExerciseScenarios } from "@/pages/FundamentalsCS/MooreMealy/exercises";
import { numberSystemsExercises } from "@/pages/FundamentalsCS/NumberSystems/exercises";
import { turingMachineExercises } from "@/pages/FundamentalsCS/TuringMachine/scenarios";
import { javaProgrammingExercises } from "@/pages/Programming1/Java/exercises";
import {
  parseTrainingCenterStorageValue,
  readTrainingCenterIdentifier,
  SIMULATOR_TASK_STORAGE_ID,
  TRAINING_CENTER_IDENTIFIER_LENGTH,
  type TrainingCenterStorageValue,
} from "./trainingCenterIdentifier";
import { trainingCenterStorage } from "./trainingCenterStorage";

export interface TrainingCenterImportRouteState {
  trainingCenterImport?: {
    storageValue: string;
  };
}

export interface TrainingCenterImportTarget {
  path: string;
  storageValue: string;
  parsed: TrainingCenterStorageValue;
}

export function resolveTrainingCenterImportTarget(
  rawValue: string,
): TrainingCenterImportTarget {
  const trimmedValue = rawValue.trim();
  if (!trimmedValue) {
    throw new Error("training_center_import_empty");
  }

  const storageValue =
    trimmedValue.length === TRAINING_CENTER_IDENTIFIER_LENGTH
      ? trainingCenterStorage.load(trimmedValue)
      : trimmedValue;

  if (!storageValue) {
    readTrainingCenterIdentifier(trimmedValue);
    throw new Error("training_center_import_not_found");
  }

  const parsed = parseTrainingCenterStorageValue(storageValue);
  const topic = findTopicByStorageId(parsed.topicStorageId);

  if (!topic) {
    throw new Error("training_center_import_topic_not_found");
  }

  trainingCenterStorage.store(storageValue);

  return {
    path: topic.path,
    storageValue,
    parsed,
  };
}

export function resolveTrainingCenterImportForPath(
  pathname: string,
  storageValue: string,
): TrainingCenterStorageValue | null {
  const topic = findTopicByPath(pathname);
  const parsed = parseTrainingCenterStorageValue(storageValue);

  if (!topic || topic.storageId !== parsed.topicStorageId) {
    return null;
  }

  return parsed;
}

export function createTrainingCenterExerciseFromImport(
  parsed: TrainingCenterStorageValue,
  t: TFunction,
): Exercise | null {
  if (parsed.taskStorageId === SIMULATOR_TASK_STORAGE_ID) {
    return null;
  }

  const definition = findExerciseDefinitionByStorageId(
    parsed.topicStorageId,
    parsed.taskStorageId,
  );

  return definition ? createExercise(definition, t) : null;
}

function findExerciseDefinitionByStorageId(
  topicStorageId: number,
  taskStorageId: number,
): ExerciseDefinition | null {
  switch (topicStorageId) {
    case TOPIC_STORAGE_IDS.turingMachine:
      return (
        turingMachineExercises.find(
          (exercise) => exercise.storageId === taskStorageId,
        )?.definition ?? null
      );
    case TOPIC_STORAGE_IDS.numberSystems:
      return numberSystemsExercises[taskStorageId] ?? null;
    case TOPIC_STORAGE_IDS.mooreMealy:
      return (
        mooreExerciseScenarios.find(
          (exercise) => exercise.storageId === taskStorageId,
        )?.definition ?? null
      );
    case TOPIC_STORAGE_IDS.dnf:
      return (
        dnfExercises.find((exercise) => exercise.storageId === taskStorageId) ??
        null
      );
    case TOPIC_STORAGE_IDS.javaProgramming:
      return (
        javaProgrammingExercises.find(
          (exercise) => exercise.storageId === taskStorageId,
        )?.definition ?? null
      );
    default:
      return null;
  }
}

function createExercise(
  definition: ExerciseDefinition,
  t: TFunction,
): Exercise {
  return {
    id: definition.titleKey as TranslationKey,
    title: t(definition.titleKey),
    description: t(definition.descriptionKey),
    titleKey: definition.titleKey,
    descriptionKey: definition.descriptionKey,
    descriptionParams: definition.descriptionParams,
    difficulty: definition.difficulty,
    icon: definition.icon,
    kind: "exercise",
  };
}
