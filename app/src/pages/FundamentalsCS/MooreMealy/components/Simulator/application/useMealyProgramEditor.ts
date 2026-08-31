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
  getNextMealyOutputCode,
  validateMealyProgram,
} from "../domain/mealyProgram";
import { MAX_NAME_LENGTH } from "../domain/programCommon";
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
      setProgram((current) => {
        let existingCode: number | undefined;
        for (const input of current.inputSymbols) {
          for (const s of current.states) {
            const out = current.outputs[input]?.[s];
            if (out && out.symbol === symbol) {
              existingCode = out.code;
              break;
            }
          }
          if (existingCode !== undefined) break;
        }
        const code = existingCode ?? getNextMealyOutputCode(current);
        return setMealyOutput(current, inputSymbol, state, { symbol, code });
      });
    },
    [],
  );

  const handleOutputSymbolRename = useCallback(
    (previousSymbol: string, nextSymbol: string): boolean => {
      const trimmed = nextSymbol.trim();
      if (!trimmed || trimmed.length > MAX_NAME_LENGTH) {
        return false;
      }
      if (trimmed === previousSymbol) {
        return true;
      }

      setProgram((current) => {
        let existingCode: number | undefined;
        for (const input of current.inputSymbols) {
          for (const s of current.states) {
            const out = current.outputs[input]?.[s];
            if (out && out.symbol === trimmed) {
              existingCode = out.code;
              break;
            }
          }
          if (existingCode !== undefined) break;
        }

        const nextOutputs = { ...current.outputs };
        for (const input of current.inputSymbols) {
          if (!current.outputs[input]) continue;
          nextOutputs[input] = { ...current.outputs[input] };
          for (const s of current.states) {
            const out = nextOutputs[input][s];
            if (!out) continue;
            if (out.symbol === previousSymbol) {
              nextOutputs[input][s] = {
                symbol: trimmed,
                code: existingCode ?? out.code,
              };
            }
          }
        }
        return {
          ...current,
          outputs: nextOutputs,
        };
      });
      return true;
    },
    [],
  );

  const handleOutputSymbolCreate = useCallback(
    (inputSymbol: string, state: string, symbol: string) => {
      setProgram((current) => {
        const code = getNextMealyOutputCode(current);
        const nextSymbol = symbol.trim() || `OUT_${code}`;
        return setMealyOutput(current, inputSymbol, state, {
          symbol: nextSymbol,
          code,
        });
      });
    },
    [],
  );

  const handleOutputCodeChange = useCallback(
    (inputSymbol: string, state: string, code: number) => {
      setProgram((current) => {
        const targetSymbol = current.outputs[inputSymbol]?.[state]?.symbol;
        if (!targetSymbol) {
          return setMealyOutput(current, inputSymbol, state, { code });
        }
        const oldCode = current.outputs[inputSymbol]?.[state]?.code ?? 0;
        if (oldCode === code) {
          return current;
        }

        // Check if another symbol already has this code (collision -> swap)
        let collidingSymbol: string | undefined;
        for (const input of current.inputSymbols) {
          for (const s of current.states) {
            const out = current.outputs[input]?.[s];
            if (out && out.symbol !== targetSymbol && out.code === code) {
              collidingSymbol = out.symbol;
              break;
            }
          }
          if (collidingSymbol) break;
        }

        const nextOutputs = { ...current.outputs };
        for (const input of current.inputSymbols) {
          if (!current.outputs[input]) continue;
          nextOutputs[input] = { ...current.outputs[input] };
          for (const s of current.states) {
            const currentCell = nextOutputs[input][s];
            if (!currentCell) continue;
            if (currentCell.symbol === targetSymbol) {
              nextOutputs[input][s] = {
                ...currentCell,
                code,
              };
            } else if (
              collidingSymbol &&
              currentCell.symbol === collidingSymbol
            ) {
              nextOutputs[input][s] = {
                ...currentCell,
                code: oldCode,
              };
            }
          }
        }
        return {
          ...current,
          outputs: nextOutputs,
        };
      });
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
    handleOutputSymbolRename,
    handleOutputSymbolCreate,
    handleOutputCodeChange,
  };
}
