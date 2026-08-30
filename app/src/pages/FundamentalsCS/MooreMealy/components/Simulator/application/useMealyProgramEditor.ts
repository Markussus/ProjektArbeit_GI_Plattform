import { useCallback, useMemo, useState } from "react";
import {
  addMealyInputSymbol,
  addMealyState,
  removeMealyInputSymbol,
  removeMealyState,
  renameMealyInputSymbol,
  renameMealyState,
  setMealyOutput,
  setMealyTransition,
} from "../domain/mealyProgramUpdates";
import {
  createNextStateName,
  validateMealyProgram,
} from "../domain/mealyProgram";
import type { MealyProgram } from "../domain/mealyTypes";

export function useMealyProgramEditor(initialProgram: MealyProgram) {
  const [program, setProgram] = useState<MealyProgram>(initialProgram);

  const issues = useMemo(() => validateMealyProgram(program), [program]);

  const handleTransitionChange = useCallback(
    (inputSymbol: string, state: string, targetState: string) => {
      setProgram((current) =>
        setMealyTransition(current, inputSymbol, state, targetState),
      );
    },
    [],
  );

  const handleStateRename = useCallback(
    (previousName: string, nextName: string): boolean => {
      const renamed = renameMealyState(program, previousName, nextName);
      if (!renamed) {
        return false;
      }
      setProgram(renamed);
      return true;
    },
    [program],
  );

  const handleInputSymbolRename = useCallback(
    (previousSymbol: string, nextSymbol: string): boolean => {
      const renamed = renameMealyInputSymbol(
        program,
        previousSymbol,
        nextSymbol,
      );
      if (!renamed) {
        return false;
      }
      setProgram(renamed);
      return true;
    },
    [program],
  );

  const handleAddState = useCallback(
    (requestedName?: string): string => {
      const trimmedName = requestedName?.trim();
      const stateName =
        trimmedName && !program.states.includes(trimmedName)
          ? trimmedName
          : createNextStateName(program.states);

      setProgram((current) => addMealyState(current, stateName).nextProgram);
      return stateName;
    },
    [program.states],
  );

  const handleRemoveState = useCallback((state: string) => {
    setProgram((current) => removeMealyState(current, state));
  }, []);

  const handleAddInputSymbol = useCallback(() => {
    setProgram((current) => addMealyInputSymbol(current));
  }, []);

  const handleRemoveInputSymbol = useCallback((symbol: string) => {
    setProgram((current) => removeMealyInputSymbol(current, symbol));
  }, []);

  const handleOutputSymbolChange = useCallback(
    (inputSymbol: string, state: string, symbol: string) => {
      setProgram((current) =>
        setMealyOutput(current, inputSymbol, state, { symbol }),
      );
    },
    [],
  );

  const handleOutputCodeChange = useCallback(
    (inputSymbol: string, state: string, code: number) => {
      setProgram((current) =>
        setMealyOutput(current, inputSymbol, state, { code }),
      );
    },
    [],
  );

  return {
    program,
    setProgram,
    issues,
    handleTransitionChange,
    handleStateRename,
    handleInputSymbolRename,
    handleAddState,
    handleRemoveState,
    handleAddInputSymbol,
    handleRemoveInputSymbol,
    handleOutputSymbolChange,
    handleOutputCodeChange,
  };
}
