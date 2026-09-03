import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
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
import type { NumberSystemState, SimulatorMode } from "./nsTransferCodec";
import {
  resolveExerciseInitialState,
  getInitialActiveMode,
} from "./exerciseStateResolver";

export interface SimulatorHandle {
  resetStoredState: () => void;
}

interface SimulatorProps {
  selectedExercise?: TopicItem | null;
  /** Callback to exit exercise mode from the parent component. */
  onExitExercise?: () => void;
}

const SIMULATOR_MODES: SimulatorMode[] = [
  "integers",
  "fractional",
  "negative",
  "ieee754",
  "arithmetic",
];

interface SimulatorTabsProps {
  modes: SimulatorMode[];
  activeMode: SimulatorMode;
  onTabClick: (mode: SimulatorMode) => void;
  t: TFunction<"translation", undefined>;
}

function SimulatorTabs({
  modes,
  activeMode,
  onTabClick,
  t,
}: SimulatorTabsProps) {
  return (
    <div className="border-border flex flex-wrap gap-1 border-b md:pr-24">
      {modes.map((mode) => (
        <button
          key={mode}
          data-testid={`ns-tab-${mode}`}
          className={cn(
            "relative px-4 py-2.5 text-sm font-medium",
            activeMode === mode
              ? "text-tab-active"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => onTabClick(mode)}
        >
          {t(`number-systems.simulator.tabs.${mode}`)}
          {activeMode === mode && (
            <span className="bg-tab-indicator absolute inset-x-0 -bottom-px h-0.5" />
          )}
        </button>
      ))}
    </div>
  );
}

interface ModeContentProps {
  activeMode: SimulatorMode;
  selectedExercise?: TopicItem | null;
  loadVersion: number;
  resolvedState: ReturnType<typeof resolveExerciseInitialState>;
  simulatorState: NumberSystemState;
  isExerciseMode: boolean;
  showSolution: boolean;
  onShowSolution: () => void;
  onExitExercise: (() => void) | undefined;
  onChangeState: (mode: SimulatorMode, state: unknown) => void;
}

function SimulatorModeContent({
  activeMode,
  selectedExercise,
  loadVersion,
  resolvedState,
  simulatorState,
  isExerciseMode,
  showSolution,
  onShowSolution,
  onExitExercise,
  onChangeState,
}: ModeContentProps) {
  const {
    initialValue,
    initialBase,
    initialTargetBase,
    initialValueA,
    initialValueB,
    initialSubMode,
    initialConverterMode,
  } = resolvedState;

  const exerciseKeyPrefix = selectedExercise?.id
    ? `${selectedExercise.id}-`
    : "free-";

  switch (activeMode) {
    case "integers":
      return (
        <IntegerConverter
          key={`${exerciseKeyPrefix}${initialValue}-${loadVersion}`}
          isExerciseMode={isExerciseMode}
          showSolution={showSolution}
          onShowSolution={onShowSolution}
          onExitExercise={onExitExercise}
          initialValue={initialValue}
          initialBase={initialBase}
          initialTargetBase={initialTargetBase}
          initialState={selectedExercise ? undefined : simulatorState.integers}
          onChangeState={(state) => onChangeState("integers", state)}
        />
      );
    case "negative":
      return (
        <NegativeNumbers
          key={`${exerciseKeyPrefix}${initialValue}-${loadVersion}`}
          isExerciseMode={isExerciseMode}
          showSolution={showSolution}
          onShowSolution={onShowSolution}
          onExitExercise={onExitExercise}
          initialValue={initialValue}
          initialState={selectedExercise ? undefined : simulatorState.negative}
          onChangeState={(state) => onChangeState("negative", state)}
        />
      );
    case "fractional":
      return (
        <FractionalConverter
          key={`${exerciseKeyPrefix}${initialValue}-${loadVersion}`}
          isExerciseMode={isExerciseMode}
          showSolution={showSolution}
          onShowSolution={onShowSolution}
          onExitExercise={onExitExercise}
          initialValue={initialValue}
          initialState={
            selectedExercise ? undefined : simulatorState.fractional
          }
          onChangeState={(state) => onChangeState("fractional", state)}
        />
      );
    case "ieee754":
      return (
        <IEEE754Converter
          key={`${exerciseKeyPrefix}${initialValue}-${loadVersion}`}
          isExerciseMode={isExerciseMode}
          showSolution={showSolution}
          onShowSolution={onShowSolution}
          onExitExercise={onExitExercise}
          initialValue={initialValue}
          initialConverterMode={initialConverterMode}
          initialState={selectedExercise ? undefined : simulatorState.ieee754}
          onChangeState={(state) => onChangeState("ieee754", state)}
        />
      );
    case "arithmetic":
      return (
        <ArithmeticMode
          key={`${exerciseKeyPrefix}${initialValueA}-${initialValueB}-${loadVersion}`}
          isExerciseMode={isExerciseMode}
          showSolution={showSolution}
          onShowSolution={onShowSolution}
          onExitExercise={onExitExercise}
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
          onChangeState={(state) => onChangeState("arithmetic", state)}
        />
      );
    default:
      return null;
  }
}

export const Simulator = forwardRef<SimulatorHandle, SimulatorProps>(
  function Simulator({ selectedExercise, onExitExercise }, ref) {
    const { t } = useTranslation("translation");

    const [resolvedState, setResolvedState] = useState(() =>
      resolveExerciseInitialState(selectedExercise),
    );

    const [simulatorState, setSimulatorState] = useState<NumberSystemState>(
      () => {
        return {
          activeMode: resolvedState.activeMode,
        };
      },
    );
    const [isStorageReady, setIsStorageReady] = useState(false);
    const [loadVersion, setLoadVersion] = useState(0);
    const activeMode = simulatorState.activeMode;

    const setActiveMode = (mode: SimulatorMode) => {
      setSimulatorState((prev) => ({ ...prev, activeMode: mode }));
    };

    useEffect(() => {
      const nextResolved = resolveExerciseInitialState(selectedExercise);
      setResolvedState(nextResolved);
      setSimulatorState((prev) => ({
        ...prev,
        activeMode: nextResolved.activeMode,
      }));
    }, [selectedExercise]);

    const { isExerciseMode, showSolution } = resolvedState;

    const setShowSolution = (show: boolean) => {
      setResolvedState((prev) => ({ ...prev, showSolution: show }));
    };

    /** Fully exits exercise mode: resets local state and notifies the parent. */
    const handleExitExercise = () => {
      setResolvedState((prev) => ({
        ...prev,
        isExerciseMode: false,
        showSolution: true,
      }));
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

    const handleModeStateChange = useCallback(
      (mode: SimulatorMode, state: unknown) => {
        setSimulatorState((p) => ({ ...p, [mode]: state }));
      },
      [],
    );

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
        <SimulatorTabs
          modes={SIMULATOR_MODES}
          activeMode={activeMode}
          onTabClick={handleTabClick}
          t={t}
        />

        <div className="flex-1 overflow-auto">
          <SimulatorModeContent
            activeMode={activeMode}
            selectedExercise={selectedExercise}
            loadVersion={loadVersion}
            resolvedState={resolvedState}
            simulatorState={simulatorState}
            isExerciseMode={isExerciseMode}
            showSolution={showSolution}
            onShowSolution={() => setShowSolution(true)}
            onExitExercise={isExerciseMode ? handleExitExercise : undefined}
            onChangeState={handleModeStateChange}
          />
        </div>
      </div>
    );
  },
);
