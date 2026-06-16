import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { CircuitBoard, Pencil, Play, TableProperties } from "lucide-react";
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
import {
  runMooreValidation,
  type MooreValidationResult,
} from "./application/mooreSolutionChecker";
import { emptyMooreProgram } from "./config/emptyMooreProgram";
import type { MooreExerciseScenario } from "../../exercises";
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
import { MooreViewActions } from "./presentation/MooreViewActions";

export interface MooreSimulatorHandle {
  resetStoredState: () => void;
  loadSolution: () => void;
  checkSolution: () => Promise<MooreValidationResult>;
}

interface MooreSimulatorProps {
  scenario: MooreExerciseScenario | null;
  initialProgram?: MooreProgram;
  isExample?: boolean;
}

export const MooreSimulator = forwardRef<
  MooreSimulatorHandle,
  MooreSimulatorProps
>(function MooreSimulator(
  { scenario, initialProgram = emptyMooreProgram, isExample = false },
  ref,
) {
  const { t } = useTranslation();
  const scenarioProgram = useMemo(
    () => cloneJson(scenario?.starterProgram ?? initialProgram),
    [initialProgram, scenario],
  );
  const [program, setProgram] = useState<MooreProgram>(() =>
    cloneJson(scenarioProgram),
  );
  const [committedProgram, setCommittedProgram] = useState<MooreProgram>(() =>
    cloneJson(scenarioProgram),
  );
  const [isEditMode, setIsEditMode] = useState(true);
  const [activeView, setActiveView] = useState<"main" | "conversion" | "logic">(
    "main",
  );
  const [isStorageReady, setIsStorageReady] = useState(false);
  const simulation = useMooreSimulator(committedProgram);
  const isStorageEnabled = !isExample;
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
        scenario?.storageId ?? SIMULATOR_TASK_STORAGE_ID,
      ),
    [scenario?.storageId],
  );
  const transferCodec = useMemo(
    () =>
      isStorageEnabled
        ? createTrainingCenterTransferCodec(
            storageIdentifier,
            mooreProgramTransferCodec,
          )
        : mooreProgramTransferCodec,
    [isStorageEnabled, storageIdentifier],
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
    setIsStorageReady(false);
    if (!isStorageEnabled) {
      setIsStorageReady(true);
      return;
    }
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
  }, [isStorageEnabled, loadProgram, storageIdentifier]);

  useTrainingCenterAutoSave({
    identifier: storageIdentifier,
    value: program,
    codec: mooreProgramTransferCodec,
    enabled: isStorageEnabled && isStorageReady,
  });

  useImperativeHandle(
    ref,
    () => ({
      resetStoredState() {
        if (isStorageEnabled) {
          trainingCenterStorage.delete(storageIdentifier);
        }
        pauseSimulation();
        const resetProgram = cloneJson(scenarioProgram);
        setProgram(resetProgram);
        setCommittedProgram(resetProgram);
        setIsEditMode(true);
        setActiveView("main");
      },
      loadSolution() {
        if (!scenario) {
          return;
        }
        loadProgram(cloneJson(scenario.solutionProgram));
      },
      checkSolution: async () => {
        if (!scenario) {
          return {
            rows: [],
            passed: false,
            error: t("moore.exercises.validation.exampleCheckUnavailable"),
          };
        }
        return runMooreValidation(program, scenario.validationCases);
      },
    }),
    [
      isStorageEnabled,
      loadProgram,
      pauseSimulation,
      program,
      scenario,
      scenarioProgram,
      storageIdentifier,
      t,
    ],
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
    const renamed = renameMooreInputSymbol(program, previousSymbol, nextSymbol);
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
      const states = current.states.filter((candidate) => candidate !== state);
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
          current.initialState === state ? fallbackState : current.initialState,
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

          <MooreViewActions
            actions={[
              {
                label: t("moore.conversion.open"),
                onClick: () => setActiveView("conversion"),
                icon: TableProperties,
                testId: "moore-open-conversion",
                disabled: !conversion,
              },
              {
                label: t("moore.sim.startSimulation"),
                onClick: startSimulation,
                icon: Play,
                testId: "moore-start-simulation",
                disabled: issues.length > 0,
              },
              {
                label: t("moore.logic.open"),
                onClick: () => setActiveView("logic"),
                icon: CircuitBoard,
                testId: "moore-open-logic",
                disabled: !conversion,
              },
            ]}
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
          <MooreViewActions
            actions={[
              {
                label: t("moore.navigation.editDefinition"),
                onClick: () => {
                  simulation.pause();
                  setProgram(cloneJson(committedProgram));
                  setIsEditMode(true);
                },
                icon: Pencil,
                testId: "moore-bottom-edit-configuration",
              },
              {
                label: t("moore.navigation.showConversion"),
                onClick: () => {
                  simulation.pause();
                  setActiveView("conversion");
                },
                icon: TableProperties,
                testId: "moore-open-conversion",
                disabled: !conversion,
              },
              {
                label: t("moore.navigation.showLogic"),
                onClick: () => {
                  simulation.pause();
                  setActiveView("logic");
                },
                icon: CircuitBoard,
                testId: "moore-open-logic",
                disabled: !conversion,
              },
            ]}
          />
        </div>
      )}
    </div>
  );
});
