import { MEALY_SIMULATOR_TASK_STORAGE_ID } from "./Simulator/MealySimulator";
import type { AutomataExerciseScenario } from "../exercises";
import { defaultMooreProgram } from "./Simulator/config/defaultMooreProgram";

export const MOORE_EXAMPLE_ID = "moore-mealy.examples.mooreDefault";
export const MEALY_EXAMPLE_ID = "moore-mealy.examples.mealyDefault";

export type MachineType = "moore" | "mealy";

export function resolveInitialMachineType({
  exerciseScenario,
  isMealyExample,
  importedTaskStorageId,
}: {
  exerciseScenario: AutomataExerciseScenario | null;
  isMealyExample: boolean;
  importedTaskStorageId?: number;
}): MachineType {
  return exerciseScenario?.machineType === "mealy" ||
    isMealyExample ||
    importedTaskStorageId === MEALY_SIMULATOR_TASK_STORAGE_ID
    ? "mealy"
    : "moore";
}

export function resolveAutomataSimulationContext({
  exerciseScenario,
  selectedItemId,
  machineType,
}: {
  exerciseScenario: AutomataExerciseScenario | null;
  selectedItemId?: string;
  machineType: MachineType;
}) {
  const isMooreExample = selectedItemId === MOORE_EXAMPLE_ID;
  const isMealyExample = selectedItemId === MEALY_EXAMPLE_ID;
  const mooreExerciseScenario =
    exerciseScenario?.machineType === "moore" ? exerciseScenario : null;
  const mealyExerciseScenario =
    exerciseScenario?.machineType === "mealy" ? exerciseScenario : null;

  const lockedMachineType: MachineType | null =
    exerciseScenario?.machineType ??
    (isMooreExample ? "moore" : isMealyExample ? "mealy" : null);

  return {
    isMooreExample,
    isMealyExample,
    mooreExerciseScenario,
    mealyExerciseScenario,
    mooreInitialProgram:
      mooreExerciseScenario?.starterProgram ??
      (isMooreExample ? defaultMooreProgram : undefined),
    storageEnabled: !isMooreExample && !isMealyExample,
    activeMachineType: lockedMachineType ?? machineType,
    isMachineTypeLocked: lockedMachineType !== null,
    lockedMachineType,
  };
}
