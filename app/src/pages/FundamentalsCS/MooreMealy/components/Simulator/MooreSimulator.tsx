import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { CircuitBoard, Play, TableProperties } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SimulatorStringTransferBox } from "@/components/shared/SimulatorStringTransferBox";
import { TOPIC_STORAGE_IDS } from "@/data/moduleCatalog";
import { useTrainingCenterAutoSave } from "@/hooks/useTrainingCenterAutoSave";
import {
  buildMooreConversion,
  type MooreConversion,
} from "./domain/mooreConversion";
import {
  SIMULATOR_TASK_STORAGE_ID,
  createTrainingCenterIdentifier,
  createTrainingCenterTransferCodec,
  loadTrainingCenterValue,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import { cloneJson } from "@/lib/utils";
import { useMooreSimulator } from "./application/useMooreSimulator";
import { defaultMooreProgram } from "./config/defaultMooreProgram";
import {
  createNextInputSymbol,
  createNextStateName,
  normalizeMooreProgram,
  renameMooreInputSymbol,
  renameMooreState,
  validateMooreProgram,
} from "./domain/mooreProgram";
import { mooreProgramTransferCodec } from "./domain/mooreProgramTransfer";
import type { MooreProgram } from "./domain/mooreTypes";
import { MooreConfigView } from "./presentation/MooreConfigView";
import { MooreConversionView } from "./presentation/MooreConversionView";
import { MooreLogicGateView } from "./presentation/MooreLogicGateView";
import { MooreSimulationView } from "./presentation/MooreSimulationView";

export interface MooreSimulatorHandle {
  resetStoredState: () => void;
}

export const MooreSimulator = forwardRef<MooreSimulatorHandle>(
  function MooreSimulator(_, ref) {
    const { t } = useTranslation();
    const [program, setProgram] = useState<MooreProgram>(() =>
      cloneJson(defaultMooreProgram),
    );
    const [committedProgram, setCommittedProgram] = useState<MooreProgram>(() =>
      cloneJson(defaultMooreProgram),
    );
    const [isEditMode, setIsEditMode] = useState(true);
    const [activeView, setActiveView] = useState<
      "main" | "conversion" | "logic"
    >("main");
    const [isStorageReady, setIsStorageReady] = useState(false);
    const simulation = useMooreSimulator(committedProgram);
    const pauseSimulation = simulation.pause;
    const issues = useMemo(() => validateMooreProgram(program), [program]);
    const conversion = useMemo<MooreConversion | null>(
      () => (issues.length === 0 ? buildMooreConversion(program) : null),
      [issues.length, program],
    );
    const storageIdentifier = useMemo(
      () =>
        createTrainingCenterIdentifier(
          TOPIC_STORAGE_IDS.mooreMealy,
          SIMULATOR_TASK_STORAGE_ID,
        ),
      [],
    );
    const transferCodec = useMemo(
      () =>
        createTrainingCenterTransferCodec(
          storageIdentifier,
          mooreProgramTransferCodec,
        ),
      [storageIdentifier],
    );

    const loadProgram = useCallback(
      (nextProgram: MooreProgram) => {
        pauseSimulation();
        setProgram(normalizeMooreProgram(nextProgram));
        setIsEditMode(true);
        setActiveView("main");
      },
      [pauseSimulation],
    );

    useEffect(() => {
      let cancelled = false;
      void loadTrainingCenterValue(storageIdentifier, mooreProgramTransferCodec)
        .then((storedProgram) => {
          if (!cancelled && storedProgram) {
            loadProgram(storedProgram);
          }
        })
        .catch(() => undefined)
        .finally(() => {
          if (!cancelled) {
            setIsStorageReady(true);
          }
        });

      return () => {
        cancelled = true;
      };
    }, [loadProgram, storageIdentifier]);

    useTrainingCenterAutoSave({
      identifier: storageIdentifier,
      value: program,
      codec: mooreProgramTransferCodec,
      enabled: isStorageReady,
    });

    useImperativeHandle(
      ref,
      () => ({
        resetStoredState() {
          trainingCenterStorage.delete(storageIdentifier);
          pauseSimulation();
          const resetProgram = cloneJson(defaultMooreProgram);
          setProgram(resetProgram);
          setCommittedProgram(resetProgram);
          setIsEditMode(true);
          setActiveView("main");
        },
      }),
      [pauseSimulation, storageIdentifier],
    );

    const handleTransitionChange = (
      inputSymbol: string,
      state: string,
      targetState: string,
    ) => {
      setProgram((current) => ({
        ...current,
        transitions: {
          ...current.transitions,
          [inputSymbol]: {
            ...current.transitions[inputSymbol],
            [state]: targetState,
          },
        },
      }));
    };

    const handleStateRename = (
      previousName: string,
      nextName: string,
    ): boolean => {
      const renamed = renameMooreState(program, previousName, nextName);
      if (!renamed) {
        return false;
      }
      setProgram(renamed);
      return true;
    };

    const handleInputSymbolRename = (
      previousSymbol: string,
      nextSymbol: string,
    ): boolean => {
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
    };

    const handleAddState = (requestedName?: string): string => {
      const trimmedName = requestedName?.trim();
      const stateName =
        trimmedName && !program.states.includes(trimmedName)
          ? trimmedName
          : createNextStateName(program.states);

      setProgram((current) => {
        if (current.states.includes(stateName)) {
          return current;
        }
        const transitions = Object.fromEntries(
          current.inputSymbols.map((inputSymbol) => [
            inputSymbol,
            {
              ...current.transitions[inputSymbol],
              [stateName]: current.initialState,
            },
          ]),
        );
        return {
          ...current,
          states: [...current.states, stateName],
          transitions,
          outputs: {
            ...current.outputs,
            [stateName]: {
              symbol: `OUT_${current.states.length}`,
              code:
                Math.max(
                  -1,
                  ...current.states.map(
                    (state) => current.outputs[state]?.code ?? -1,
                  ),
                ) + 1,
            },
          },
        };
      });
      return stateName;
    };

    const handleRemoveState = (state: string) => {
      setProgram((current) => {
        if (current.states.length <= 1) {
          return current;
        }
        const states = current.states.filter(
          (candidate) => candidate !== state,
        );
        const fallbackState = states[0];
        const transitions = Object.fromEntries(
          current.inputSymbols.map((inputSymbol) => [
            inputSymbol,
            Object.fromEntries(
              states.map((sourceState) => {
                const target =
                  current.transitions[inputSymbol]?.[sourceState] ??
                  fallbackState;
                return [sourceState, target === state ? fallbackState : target];
              }),
            ),
          ]),
        );
        const outputs = { ...current.outputs };
        delete outputs[state];
        return {
          ...current,
          states,
          transitions,
          outputs,
          initialState:
            current.initialState === state
              ? fallbackState
              : current.initialState,
        };
      });
    };

    const handleAddInputSymbol = () => {
      setProgram((current) => {
        const symbol = createNextInputSymbol(current.inputSymbols);
        return {
          ...current,
          inputSymbols: [...current.inputSymbols, symbol],
          transitions: {
            ...current.transitions,
            [symbol]: Object.fromEntries(
              current.states.map((state) => [state, current.initialState]),
            ),
          },
        };
      });
    };

    const handleRemoveInputSymbol = (symbol: string) => {
      setProgram((current) => {
        const transitions = { ...current.transitions };
        delete transitions[symbol];
        return {
          ...current,
          inputSymbols: current.inputSymbols.filter(
            (candidate) => candidate !== symbol,
          ),
          inputWord: current.inputWord.filter(
            (candidate) => candidate !== symbol,
          ),
          transitions,
        };
      });
    };

    const handleOutputSymbolChange = (state: string, symbol: string) => {
      setProgram((current) => {
        const existingOutput = current.states
          .filter((candidate) => candidate !== state)
          .map((candidate) => current.outputs[candidate])
          .find((output) => output.symbol === symbol);
        return {
          ...current,
          outputs: {
            ...current.outputs,
            [state]: {
              symbol,
              code: existingOutput?.code ?? current.outputs[state].code,
            },
          },
        };
      });
    };

    const handleOutputCodeChange = (state: string, code: number) => {
      setProgram((current) => {
        const symbol = current.outputs[state].symbol;
        return {
          ...current,
          outputs: Object.fromEntries(
            current.states.map((candidate) => [
              candidate,
              current.outputs[candidate].symbol === symbol
                ? { ...current.outputs[candidate], code }
                : current.outputs[candidate],
            ]),
          ),
        };
      });
    };

    const startSimulation = () => {
      const normalized = normalizeMooreProgram(program);
      if (validateMooreProgram(normalized).length > 0) {
        return;
      }
      setProgram(normalized);
      setCommittedProgram(normalized);
      setIsEditMode(false);
      setActiveView("main");
    };

    if (activeView === "conversion" && conversion) {
      return (
        <div
          data-testid="moore-simulator"
          className="mx-auto w-full max-w-[100rem]"
        >
          <MooreConversionView
            conversion={conversion}
            onBackToEditor={() => {
              setIsEditMode(true);
              setActiveView("main");
            }}
            onShowSimulator={() => {
              setCommittedProgram(program);
              setIsEditMode(false);
              setActiveView("main");
            }}
            onShowLogic={() => setActiveView("logic")}
          />
        </div>
      );
    }

    if (activeView === "logic" && conversion) {
      return (
        <div
          data-testid="moore-simulator"
          className="mx-auto w-full max-w-[100rem]"
        >
          <MooreLogicGateView
            conversion={conversion}
            onEditDefinition={() => {
              setIsEditMode(true);
              setActiveView("main");
            }}
            onShowSimulator={() => {
              setCommittedProgram(program);
              setIsEditMode(false);
              setActiveView("main");
            }}
            onShowConversion={() => setActiveView("conversion")}
          />
        </div>
      );
    }

    return (
      <div
        data-testid="moore-simulator"
        className="mx-auto w-full max-w-[100rem]"
      >
        {isEditMode ? (
          <div className="space-y-6">
            <MooreConfigView
              program={program}
              issues={issues}
              onChange={setProgram}
              onTransitionChange={handleTransitionChange}
              onStateRename={handleStateRename}
              onInputSymbolRename={handleInputSymbolRename}
              onAddState={handleAddState}
              onRemoveState={handleRemoveState}
              onAddInputSymbol={handleAddInputSymbol}
              onRemoveInputSymbol={handleRemoveInputSymbol}
              onOutputSymbolChange={handleOutputSymbolChange}
              onOutputCodeChange={handleOutputCodeChange}
            />

            <SimulatorStringTransferBox
              value={program}
              codec={transferCodec}
              onLoad={loadProgram}
              testIdPrefix="moore-transfer"
            />

            <button
              type="button"
              onClick={startSimulation}
              disabled={issues.length > 0}
              data-testid="moore-start-simulation"
              className="bg-brand text-brand-foreground mx-auto flex items-center gap-2 rounded-lg px-5 py-3 font-semibold hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="size-4 fill-current" />
              {t("moore.sim.startSimulation")}
            </button>

            <ConversionActions
              disabled={!conversion}
              onOpenConversion={() => setActiveView("conversion")}
              onOpenLogic={() => setActiveView("logic")}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <MooreSimulationView
              program={committedProgram}
              runtime={simulation.runtime}
              status={simulation.status}
              speed={simulation.speed}
              error={simulation.error}
              onEdit={() => {
                simulation.pause();
                setProgram(cloneJson(committedProgram));
                setIsEditMode(true);
              }}
              onPlay={simulation.play}
              onPause={simulation.pause}
              onStep={simulation.step}
              onStepBack={simulation.stepBack}
              onReset={() => simulation.reset()}
              onSpeedChange={simulation.setSpeed}
            />
            <ConversionActions
              disabled={!conversion}
              onOpenConversion={() => {
                simulation.pause();
                setActiveView("conversion");
              }}
              onOpenLogic={() => {
                simulation.pause();
                setActiveView("logic");
              }}
            />
          </div>
        )}
      </div>
    );
  },
);

function ConversionActions({
  disabled,
  onOpenConversion,
  onOpenLogic,
}: {
  disabled: boolean;
  onOpenConversion: () => void;
  onOpenLogic: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap justify-center gap-3">
      <button
        type="button"
        onClick={onOpenConversion}
        disabled={disabled}
        data-testid="moore-open-conversion"
        className="border-brand text-brand hover:bg-brand/10 inline-flex items-center gap-2 rounded-lg border px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        <TableProperties className="size-4" />
        {t("moore.conversion.open")}
      </button>
      <button
        type="button"
        onClick={onOpenLogic}
        disabled={disabled}
        data-testid="moore-open-logic"
        className="border-border bg-secondary text-secondary-foreground hover:bg-muted inline-flex items-center gap-2 rounded-lg border px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CircuitBoard className="size-4" />
        {t("moore.logic.open")}
      </button>
    </div>
  );
}
