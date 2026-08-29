import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { IntegerConverter } from "./IntegerConverter";
import { NegativeNumbers } from "./NegativeNumbers";
import { IEEE754Converter } from "./IEEE754Converter";
import { FractionalConverter } from "./FractionalConverter";
import { ArithmeticMode } from "./arithmetic";
import type { TopicItem } from "@/types/exercise";
import { cn } from "@/lib/utils";
import { useTrainingCenterAutoSave } from "@/hooks/useTrainingCenterAutoSave";
import { useActiveSimulatorTransfer } from "@/hooks/useActiveSimulatorTransfer";
import {
  SIMULATOR_TASK_STORAGE_ID,
  createTrainingCenterIdentifier,
  loadTrainingCenterValue,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import { numberSystemsExercises } from "../../exercises";
import { nsTransferCodec } from "./nsTransferCodec";
import type { NumberSystemState } from "./nsTransferCodec";
import { exerciseStateConfig } from "./exerciseStateConfig";
import {
  resolveRandomInit,
  defaultExerciseState,
} from "./exerciseStateResolver";

export type SimulatorMode =
  | "integers"
  | "negative"
  | "fractional"
  | "ieee754"
  | "arithmetic";

export interface SimulatorHandle {
  resetStoredState: () => void;
}

interface SimulatorProps {
  selectedExercise?: TopicItem | null;
  /** Callback to exit exercise mode from the parent component. */
  onExitExercise?: () => void;
}

export const Simulator = forwardRef<SimulatorHandle, SimulatorProps>(
  function Simulator({ selectedExercise, onExitExercise }, ref) {
    const { t } = useTranslation("translation");
    const getInitialActiveMode = (id: string): SimulatorMode => {
      const config = exerciseStateConfig[id];
      if (config) return config.mode;

      // Fallback prefix logic for unknown IDs
      if (
        id.includes("floatToBin") ||
        id.includes("example_u05_1") ||
        id.includes("example_u05_2")
      )
        return "fractional";
      if (
        id.includes("ieee") ||
        id.includes("example_u05_3") ||
        id.includes("example_u05_4") ||
        id.includes("example_u07_5")
      )
        return "ieee754";
      if (
        id.includes("Add") ||
        id.includes("Sub") ||
        id.includes("mult") ||
        id.includes("example_u06") ||
        id.includes("example_u03_2") ||
        id.includes("example_u07_2") ||
        id.includes("example_u07_4")
      )
        return "arithmetic";
      if (id.includes("example_u07_3")) return "negative";
      return "integers";
    };

    const [simulatorState, setSimulatorState] = useState<NumberSystemState>(
      () => {
        return {
          activeMode: selectedExercise
            ? getInitialActiveMode(selectedExercise.id)
            : "integers",
        };
      },
    );
    const [isStorageReady, setIsStorageReady] = useState(false);
    const [loadVersion, setLoadVersion] = useState(0);
    const activeMode = simulatorState.activeMode;

    const setActiveMode = (mode: SimulatorMode) => {
      setSimulatorState((prev) => ({ ...prev, activeMode: mode }));
    };

    // Exercise mode states
    const [isExerciseMode, setIsExerciseMode] = useState(() => {
      return selectedExercise
        ? !selectedExercise.id.includes(".example")
        : false;
    });
    const [showSolution, setShowSolution] = useState(() => {
      return selectedExercise ? selectedExercise.id.includes(".example") : true;
    });

    // Initial values for converters when launched via exercise
    const [initialValue, setInitialValue] = useState<string>("");
    const [initialBase, setInitialBase] = useState<
      "dec" | "bin" | "oct" | "hex"
    >("dec");
    const [initialTargetBase, setInitialTargetBase] = useState<
      "dec" | "bin" | "oct" | "hex"
    >("bin");
    const [initialValueA, setInitialValueA] = useState<string>("");
    const [initialValueB, setInitialValueB] = useState<string>("");
    const [initialSubMode, setInitialSubMode] = useState<
      | "addition"
      | "subtraction"
      | "multiplication"
      | "division"
      | "shifting"
      | "compare"
    >("addition");
    const [initialConverterMode, setInitialConverterMode] = useState<
      "decToIeee" | "ieeeToDec"
    >("decToIeee");

    useEffect(() => {
      if (selectedExercise) {
        const isExample = selectedExercise.id.includes(".example");

        setIsExerciseMode(!isExample);
        setShowSolution(isExample);

        const config = exerciseStateConfig[selectedExercise.id];
        if (config) {
          const init = resolveRandomInit(config);
          setActiveMode(init.mode);
          if (init.initialValue !== undefined)
            setInitialValue(init.initialValue);
          if (init.initialBase !== undefined) setInitialBase(init.initialBase);
          if (init.initialTargetBase !== undefined)
            setInitialTargetBase(init.initialTargetBase);
          if (init.initialValueA !== undefined)
            setInitialValueA(init.initialValueA);
          if (init.initialValueB !== undefined)
            setInitialValueB(init.initialValueB);
          if (init.initialSubMode !== undefined)
            setInitialSubMode(init.initialSubMode);
          if (init.initialConverterMode !== undefined)
            setInitialConverterMode(init.initialConverterMode);
        }
      } else {
        setIsExerciseMode(false);
        setShowSolution(true);
        setInitialValue(defaultExerciseState.initialValue ?? "");
        setInitialBase(defaultExerciseState.initialBase ?? "dec");
        setInitialTargetBase(defaultExerciseState.initialTargetBase ?? "bin");
        setInitialValueA(defaultExerciseState.initialValueA ?? "");
        setInitialValueB(defaultExerciseState.initialValueB ?? "");
        setInitialSubMode(defaultExerciseState.initialSubMode ?? "addition");
        setInitialConverterMode(
          defaultExerciseState.initialConverterMode ?? "decToIeee",
        );
      }
    }, [selectedExercise]);

    /** Fully exits exercise mode: resets local state and notifies the parent. */
    const handleExitExercise = () => {
      setIsExerciseMode(false);
      setShowSolution(true);
      // Notify parent (ModuleTopicPage) so it clears the active simulation exercise
      onExitExercise?.();
    };

    const isExample = selectedExercise?.id.includes(".example");
    const isStorageEnabled = !isExample;
    const exerciseIndex = selectedExercise
      ? numberSystemsExercises.findIndex(
          (ex) => ex.titleKey === selectedExercise.id,
        )
      : -1;
    const taskStorageId =
      exerciseIndex >= 0 ? exerciseIndex : SIMULATOR_TASK_STORAGE_ID;

    const storageIdentifier = createTrainingCenterIdentifier(
      TOPIC_STORAGE_IDS.numberSystems,
      taskStorageId,
    );

    useActiveSimulatorTransfer({
      identifier: storageIdentifier,
      value: simulatorState,
      codec: nsTransferCodec,
    });

    useEffect(() => {
      let isCancelled = false;

      setIsStorageReady(false);

      if (!isStorageEnabled) {
        return;
      }

      void loadTrainingCenterValue(storageIdentifier, nsTransferCodec)
        .then((storedState) => {
          if (!isCancelled && storedState) {
            setSimulatorState(() => {
              const nextState = { ...storedState };
              if (selectedExercise) {
                nextState.activeMode = getInitialActiveMode(
                  selectedExercise.id,
                );
              }
              return nextState;
            });
            setLoadVersion((v) => v + 1);
          }
        })
        .catch(() => undefined)
        .finally(() => {
          if (!isCancelled) {
            setIsStorageReady(true);
          }
        });

      return () => {
        isCancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStorageEnabled, storageIdentifier]);

    useTrainingCenterAutoSave({
      identifier: storageIdentifier,
      value: simulatorState,
      codec: nsTransferCodec,
      enabled: isStorageEnabled && isStorageReady,
    });

    const handleTabClick = (mode: SimulatorMode) => {
      if (mode === activeMode) return;
      handleExitExercise();
      setActiveMode(mode);
    };

    const resetStoredState = useCallback(() => {
      if (isStorageEnabled) {
        trainingCenterStorage.delete(storageIdentifier);
      }

      setSimulatorState({
        activeMode: selectedExercise
          ? getInitialActiveMode(selectedExercise.id)
          : "integers",
      });
      setLoadVersion((v) => v + 1);
    }, [isStorageEnabled, storageIdentifier, selectedExercise]);

    useImperativeHandle(
      ref,
      () => ({
        resetStoredState,
      }),
      [resetStoredState],
    );

    return (
      <div
        data-testid="ns-simulator"
        className="flex h-full flex-col space-y-6"
      >
        {/* Dashboard Navigation */}
        <div className="border-border flex flex-wrap gap-1 border-b md:pr-24">
          {(
            [
              "integers",
              "fractional",
              "negative",
              "ieee754",
              "arithmetic",
            ] as SimulatorMode[]
          ).map((mode) => (
            <button
              key={mode}
              data-testid={`ns-tab-${mode}`}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium",
                activeMode === mode
                  ? "text-tab-active"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => handleTabClick(mode)}
            >
              {t(`number-systems.simulator.tabs.${mode}`)}
              {activeMode === mode && (
                <span className="bg-tab-indicator absolute inset-x-0 -bottom-px h-0.5" />
              )}
            </button>
          ))}
        </div>

        {/* Simulator Content */}
        <div className="flex-1 overflow-auto">
          {activeMode === "integers" && (
            <IntegerConverter
              key={
                selectedExercise?.id
                  ? `${selectedExercise.id}-${initialValue}-${loadVersion}`
                  : `free-int-${loadVersion}`
              }
              isExerciseMode={isExerciseMode}
              showSolution={showSolution}
              onShowSolution={() => setShowSolution(true)}
              onExitExercise={isExerciseMode ? handleExitExercise : undefined}
              initialValue={initialValue}
              initialBase={initialBase}
              initialTargetBase={initialTargetBase}
              initialState={
                selectedExercise ? undefined : simulatorState.integers
              }
              onChangeState={(state) =>
                setSimulatorState((p) => ({ ...p, integers: state }))
              }
            />
          )}
          {activeMode === "negative" && (
            <NegativeNumbers
              key={
                selectedExercise?.id
                  ? `${selectedExercise.id}-${initialValue}-${loadVersion}`
                  : `free-neg-${loadVersion}`
              }
              isExerciseMode={isExerciseMode}
              showSolution={showSolution}
              onShowSolution={() => setShowSolution(true)}
              onExitExercise={isExerciseMode ? handleExitExercise : undefined}
              initialValue={initialValue}
              initialState={
                selectedExercise ? undefined : simulatorState.negative
              }
              onChangeState={(state) =>
                setSimulatorState((p) => ({ ...p, negative: state }))
              }
            />
          )}
          {activeMode === "fractional" && (
            <FractionalConverter
              key={
                selectedExercise?.id
                  ? `${selectedExercise.id}-${initialValue}-${loadVersion}`
                  : `free-frac-${loadVersion}`
              }
              isExerciseMode={isExerciseMode}
              showSolution={showSolution}
              onShowSolution={() => setShowSolution(true)}
              onExitExercise={isExerciseMode ? handleExitExercise : undefined}
              initialValue={initialValue}
              initialState={
                selectedExercise ? undefined : simulatorState.fractional
              }
              onChangeState={(state) =>
                setSimulatorState((p) => ({ ...p, fractional: state }))
              }
            />
          )}
          {activeMode === "ieee754" && (
            <IEEE754Converter
              key={
                selectedExercise?.id
                  ? `${selectedExercise.id}-${initialValue}-${loadVersion}`
                  : `free-ieee-${loadVersion}`
              }
              isExerciseMode={isExerciseMode}
              showSolution={showSolution}
              onShowSolution={() => setShowSolution(true)}
              onExitExercise={isExerciseMode ? handleExitExercise : undefined}
              initialValue={initialValue}
              initialConverterMode={initialConverterMode}
              initialState={
                selectedExercise ? undefined : simulatorState.ieee754
              }
              onChangeState={(state) =>
                setSimulatorState((p) => ({ ...p, ieee754: state }))
              }
            />
          )}
          {activeMode === "arithmetic" && (
            <ArithmeticMode
              key={
                selectedExercise?.id
                  ? `${selectedExercise.id}-${initialValueA}-${initialValueB}-${loadVersion}`
                  : `free-arith-${loadVersion}`
              }
              isExerciseMode={isExerciseMode}
              showSolution={showSolution}
              onShowSolution={() => setShowSolution(true)}
              onExitExercise={isExerciseMode ? handleExitExercise : undefined}
              initialMode={
                initialSubMode as
                  | "addition"
                  | "subtraction"
                  | "multiplication"
                  | "division"
                  | "shifting"
                  | "compare"
              }
              initialValueA={initialValueA}
              initialValueB={initialValueB}
              initialState={
                selectedExercise ? undefined : simulatorState.arithmetic
              }
              onChangeState={(state) =>
                setSimulatorState((p) => ({ ...p, arithmetic: state }))
              }
            />
          )}
        </div>
      </div>
    );
  },
);
