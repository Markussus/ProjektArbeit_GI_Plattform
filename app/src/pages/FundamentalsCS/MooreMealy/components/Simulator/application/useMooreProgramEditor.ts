import { useCallback, useMemo, useState } from "react";
import {
  addMooreInputSymbol,
  addMooreState,
  createMooreOutputSymbol,
  getNextMooreOutputCode,
  removeMooreInputSymbol,
  removeMooreState,
  renameMooreInputSymbol,
  renameMooreState,
  setMooreOutputCode,
  setMooreOutputSymbol,
  setMooreTransition,
} from "../domain/mooreProgramUpdates";
import {
  createNextStateName,
  validateMooreProgram,
} from "../domain/mooreProgram";
import { MAX_NAME_LENGTH } from "../domain/programCommon";
import type { MooreProgram } from "../domain/mooreTypes";

export function useMooreProgramEditor(initialProgram: MooreProgram) {
  const [program, setProgram] = useState<MooreProgram>(initialProgram);

  const issues = useMemo(() => validateMooreProgram(program), [program]);

  const handleTransitionChange = useCallback(
    (inputSymbol: string, state: string, targetState: string) => {
      setProgram((current) =>
        setMooreTransition(current, inputSymbol, state, targetState),
      );
    },
    [],
  );

  const handleStateRename = useCallback(
    (previousName: string, nextName: string): boolean => {
      const renamed = renameMooreState(program, previousName, nextName);
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
      const renamed = renameMooreInputSymbol(
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

      setProgram((current) => addMooreState(current, stateName).nextProgram);
      return stateName;
    },
    [program.states],
  );

  const handleRemoveState = useCallback((state: string) => {
    setProgram((current) => removeMooreState(current, state));
  }, []);

  const handleAddInputSymbol = useCallback(() => {
    setProgram((current) => addMooreInputSymbol(current));
  }, []);

  const handleRemoveInputSymbol = useCallback((symbol: string) => {
    setProgram((current) => removeMooreInputSymbol(current, symbol));
  }, []);

  const handleOutputSymbolChange = useCallback(
    (state: string, symbol: string) => {
      setProgram((current) => {
        const existingOutput = current.states
          .filter((candidate) => candidate !== state)
          .map((candidate) => current.outputs[candidate])
          .find((output) => output?.symbol === symbol);
        const code =
          existingOutput?.code ??
          (current.outputs[state]?.symbol === symbol
            ? current.outputs[state]?.code
            : getNextMooreOutputCode(current));
        return {
          ...setMooreOutputSymbol(current, state, symbol),
          outputs: {
            ...current.outputs,
            [state]: { symbol, code },
          },
        };
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
        const existingCode = current.states
          .map((s) => current.outputs[s])
          .find((out) => out?.symbol === trimmed)?.code;

        return {
          ...current,
          outputs: Object.fromEntries(
            current.states.map((s) => {
              const out = current.outputs[s];
              if (!out) return [s, out];
              if (out.symbol === previousSymbol) {
                return [s, { symbol: trimmed, code: existingCode ?? out.code }];
              }
              return [s, out];
            }),
          ),
        };
      });
      return true;
    },
    [],
  );

  const handleOutputCodeChange = useCallback((state: string, code: number) => {
    setProgram((current) => {
      const symbol = current.outputs[state]?.symbol;
      if (!symbol) return setMooreOutputCode(current, state, code);
      const oldCode = current.outputs[state]?.code ?? 0;
      if (oldCode === code) return current;

      const collidingState = current.states.find(
        (s) =>
          current.outputs[s]?.symbol !== symbol &&
          current.outputs[s]?.code === code,
      );
      const collidingSymbol = collidingState
        ? current.outputs[collidingState]?.symbol
        : undefined;

      return {
        ...current,
        outputs: Object.fromEntries(
          current.states.map((candidate) => {
            const currentOutput = current.outputs[candidate];
            if (!currentOutput) return [candidate, currentOutput];
            if (currentOutput.symbol === symbol) {
              return [candidate, { ...currentOutput, code }];
            }
            if (collidingSymbol && currentOutput.symbol === collidingSymbol) {
              return [candidate, { ...currentOutput, code: oldCode }];
            }
            return [candidate, currentOutput];
          }),
        ),
      };
    });
  }, []);

  const handleOutputSymbolCreate = useCallback(
    (state: string, symbol: string) => {
      setProgram((current) => createMooreOutputSymbol(current, state, symbol));
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
    handleOutputCodeChange,
    handleOutputSymbolCreate,
  };
}
