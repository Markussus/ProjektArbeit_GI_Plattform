import { useEffect, useMemo } from "react";
import { useSimulationEngine } from "@/hooks/useSimulationEngine";
import { MealyMachineSimulator } from "../domain/mealyMachine";
import type { MealyProgram } from "../domain/mealyTypes";

export function useMealySimulator(program: MealyProgram) {
  const simulator = useMemo(() => new MealyMachineSimulator(), []);
  const engine = useSimulationEngine(simulator, program);
  const reset = engine.reset;
  useEffect(() => reset(program), [program, reset]);
  return { ...engine, runtime: engine.currentState, reset };
}
