import { useState } from "react";
import type { RLExerciseDefinition } from "../../../exercises/rlExerciseDefinitions";
import type { RLExample } from "../config/rlExamples";
import type { SimulationMode } from "../domain/rlTypes";
import { RL_STORAGE_TASK_IDS } from "../useRLPersistedSource";

/** The mode a freshly imported task belongs to, if its id maps to one. */
export function modeForImportedTask(
  importedTaskStorageId: number | undefined,
): SimulationMode | undefined {
  if (!importedTaskStorageId) return undefined;
  return Object.entries(RL_STORAGE_TASK_IDS).find(
    ([, taskStorageId]) => taskStorageId === importedTaskStorageId,
  )?.[0] as SimulationMode | undefined;
}

/** Whatever the page currently has open; any of it can dictate the mode. */
export interface RLSimulatorSelection {
  exercise?: RLExerciseDefinition | null;
  example?: RLExample | null;
  importedTaskStorageId?: number;
}

/**
 * An exercise or example outranks `importedTaskStorageId`, which is never
 * cleared — otherwise a later exercise would open in the imported task's mode.
 */
export function resolveInitialMode(
  selection: RLSimulatorSelection,
): SimulationMode {
  return (
    selection.exercise?.mode ??
    selection.example?.mode ??
    modeForImportedTask(selection.importedTaskStorageId) ??
    "grammarToLanguage"
  );
}

/**
 * The active editor mode, kept in step with what the page hands down. Both
 * adoptions happen during render rather than in an effect: without them the mode
 * stays whatever the initialiser computed once, and the new task's editor never
 * appears.
 */
export function useRLSimulatorMode(selection: RLSimulatorSelection) {
  const { exercise, example, importedTaskStorageId } = selection;
  const [mode, setMode] = useState<SimulationMode>(() =>
    resolveInitialMode(selection),
  );

  const [appliedImportId, setAppliedImportId] = useState(importedTaskStorageId);
  if (importedTaskStorageId !== appliedImportId) {
    setAppliedImportId(importedTaskStorageId);
    const importedMode = modeForImportedTask(importedTaskStorageId);
    if (importedMode) setMode(importedMode);
  }

  const selectionId = exercise?.id ?? example?.id ?? null;
  const [appliedSelectionId, setAppliedSelectionId] = useState(selectionId);
  if (selectionId !== appliedSelectionId) {
    setAppliedSelectionId(selectionId);
    const selectionMode = exercise?.mode ?? example?.mode;
    if (selectionMode) setMode(selectionMode);
  }

  return { mode, setMode };
}
