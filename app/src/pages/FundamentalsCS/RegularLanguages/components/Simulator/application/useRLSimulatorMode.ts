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

export interface RLSimulatorSelection {
  exercise?: RLExerciseDefinition | null;
  example?: RLExample | null;
  importedTaskStorageId?: number;
}

/**
 * An open exercise or example dictates the mode: it is the more specific
 * choice, and `importedTaskStorageId` lingers after an import, so letting the
 * import win here would leave a later task without its editor.
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
 * The active editor mode, kept in step with whatever the page hands down.
 *
 * Both adoptions happen during render rather than in an effect, the same way
 * the input cards adopt seeded values: a freshly imported task brings its own
 * mode, and so does a newly picked exercise or example. Without them the
 * simulator keeps the mode its initialiser computed once, and the task's
 * editor never appears.
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
