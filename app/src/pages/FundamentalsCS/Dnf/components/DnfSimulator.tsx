import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useTranslation } from "react-i18next";
import type { Example, Exercise } from "@/types/exercise";
import { cn } from "@/lib/utils";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import {
  SIMULATOR_TASK_STORAGE_ID,
  exportAndStoreTrainingCenterValue,
} from "@/lib/trainingCenter";
import { useTrainingCenterPersistence } from "@/hooks/useTrainingCenterPersistence";
import { DnfBuilder, type DnfBuilderHandle } from "./DnfBuilder/DnfBuilder";
import {
  createDnfAttemptDraft,
  dnfTransferCodec,
  type DnfExerciseTransferDraft,
  type DnfExpressionTransferDraft,
  type DnfTransferValue,
  type DnfTruthTableTransferDraft,
} from "./DnfBuilder/domain/dnfTransfer";
import { ExpressionBuilder } from "./ExpressionBuilder/ExpressionBuilder";
import { TableToDnfBuilder } from "./TableToDnfBuilder/TableToDnfBuilder";
import { buildDnfResetValue, type DnfSimulatorMode } from "./dnfSimulatorReset";
import {
  buildDnfExpressionWalkthroughValue,
  buildDnfTruthTableWalkthroughValue,
} from "./dnfWalkthroughSeed";
import { getDnfExerciseDefinition } from "../exercises";
import {
  getDnfWalkthroughExample,
  type DnfWalkthroughExample,
} from "../examples/walkthroughExamples";

const simulatorModes: DnfSimulatorMode[] = [
  "expression_to_truth_table",
  "truth_table_to_dnf",
];

export interface DnfSimulatorHandle {
  resetStoredState: () => void;
  loadSolution: () => void;
}

interface DnfSimulatorProps {
  selectedExercise?: Exercise | null;
  selectedExample?: Example | null;
  onExitExercise?: () => void;
  onExitExample?: () => void;
  onStorageReadyChange?: (isReady: boolean) => void;
}

function getInitialExpressionValue(
  storedValue: DnfTransferValue | null,
  walkthroughExample: DnfWalkthroughExample | null,
) {
  if (storedValue?.mode === "expression_to_truth_table") {
    return storedValue;
  }
  if (walkthroughExample?.mode === "expression_to_truth_table") {
    return buildDnfExpressionWalkthroughValue(walkthroughExample);
  }
  return undefined;
}

function getInitialTruthTableValue(
  storedValue: DnfTransferValue | null,
  walkthroughExample: DnfWalkthroughExample | null,
) {
  if (storedValue?.mode === "truth_table_to_dnf") {
    return storedValue;
  }
  if (walkthroughExample?.mode === "truth_table_to_dnf") {
    return buildDnfTruthTableWalkthroughValue(walkthroughExample);
  }
  return undefined;
}

export const DnfSimulator = forwardRef<DnfSimulatorHandle, DnfSimulatorProps>(
  function DnfSimulator(
    {
      selectedExercise,
      selectedExample,
      onExitExercise,
      onExitExample,
      onStorageReadyChange,
    },
    ref,
  ) {
    const { t } = useTranslation();

    const walkthroughExample = selectedExample
      ? getDnfWalkthroughExample(selectedExample.id)
      : null;

    const selectedExerciseDefinition = selectedExercise
      ? getDnfExerciseDefinition(selectedExercise.id)
      : null;
    const selectedExerciseMode =
      selectedExerciseDefinition?.mode ??
      (selectedExercise ? "expression_to_truth_table" : null);
    const isStorageEnabled = walkthroughExample === null;

    const [storedValue, setStoredValue] = useState<DnfTransferValue | null>(
      null,
    );
    const [hasStoredState, setHasStoredState] = useState(false);
    const [hasUserChanges, setHasUserChanges] = useState(false);
    const [resetVersion, setResetVersion] = useState(0);
    const dnfBuilderRef = useRef<DnfBuilderHandle | null>(null);

    const [activeMode, setActiveMode] = useState<DnfSimulatorMode>(
      walkthroughExample?.mode ?? "expression_to_truth_table",
    );

    const visibleMode = selectedExerciseMode ?? activeMode;

    const restoreDnfState = useCallback(
      (restored: DnfTransferValue) => {
        setStoredValue(restored);
        setHasStoredState(true);
        if (!selectedExercise && restored.mode !== "exercise_attempt") {
          setActiveMode(restored.mode);
        }
      },
      [selectedExercise],
    );

    const fallbackValue = useMemo<DnfTransferValue>(() => {
      if (selectedExercise) {
        return {
          mode: "exercise_attempt",
          ...createDnfAttemptDraft(),
        };
      }
      if (visibleMode === "truth_table_to_dnf") {
        return {
          mode: "truth_table_to_dnf",
          variableCount: 3,
          resultValues: Array.from({ length: 8 }, () => false),
          committed: false,
          ...createDnfAttemptDraft(),
        };
      }
      return {
        mode: "expression_to_truth_table",
        expression: "",
        committed: false,
        ...createDnfAttemptDraft(),
      };
    }, [selectedExercise, visibleMode]);

    const persistenceValue = useMemo<DnfTransferValue>(() => {
      if (selectedExercise) {
        return storedValue?.mode === "exercise_attempt"
          ? storedValue
          : fallbackValue;
      }
      if (storedValue?.mode === visibleMode) {
        return storedValue;
      }
      return fallbackValue;
    }, [fallbackValue, selectedExercise, storedValue, visibleMode]);

    const {
      identifier: storageIdentifier,
      clear: clearStoredState,
      isReady: isStorageReady,
    } = useTrainingCenterPersistence<DnfTransferValue>({
      topicStorageId: TOPIC_STORAGE_IDS.dnf,
      taskStorageId:
        selectedExerciseDefinition?.storageId ?? SIMULATOR_TASK_STORAGE_ID,
      codec: dnfTransferCodec,
      value: persistenceValue,
      onRestore: restoreDnfState,
      enabled: isStorageEnabled,
      autoSaveEnabled: hasStoredState || hasUserChanges,
    });

    const buildResetValue = useCallback((): DnfTransferValue | null => {
      return buildDnfResetValue({
        hasSelectedExercise: Boolean(selectedExercise),
        storedValue,
        visibleMode,
        walkthroughExample,
      });
    }, [selectedExercise, storedValue, visibleMode, walkthroughExample]);

    useEffect(() => {
      onStorageReadyChange?.(isStorageReady);
    }, [isStorageReady, onStorageReadyChange]);

    useImperativeHandle(
      ref,
      () => ({
        resetStoredState: () => {
          clearStoredState();
          const resetValue = buildResetValue();
          setStoredValue(resetValue);
          setHasStoredState(false);
          setHasUserChanges(false);
          setResetVersion((current) => current + 1);
        },
        loadSolution: () => {
          if (!isStorageReady) {
            return;
          }
          const solved = dnfBuilderRef.current?.loadSolution();
          if (solved) {
            const nextValue: DnfTransferValue = {
              mode: "exercise_attempt",
              ...solved,
            };
            setStoredValue(nextValue);
            setHasStoredState(true);
            setHasUserChanges(true);
            if (isStorageEnabled) {
              void exportAndStoreTrainingCenterValue(
                storageIdentifier,
                nextValue,
                dnfTransferCodec,
              );
            }
          }
        },
      }),
      [
        buildResetValue,
        clearStoredState,
        isStorageEnabled,
        isStorageReady,
        storageIdentifier,
      ],
    );

    const handleExpressionChange = useCallback(
      (value: DnfExpressionTransferDraft) => {
        setStoredValue({ mode: "expression_to_truth_table", ...value });
      },
      [],
    );
    const handleTruthTableChange = useCallback(
      (value: DnfTruthTableTransferDraft) => {
        setStoredValue({ mode: "truth_table_to_dnf", ...value });
      },
      [],
    );
    const handleExerciseChange = useCallback(
      (value: DnfExerciseTransferDraft) => {
        setStoredValue({ mode: "exercise_attempt", ...value });
      },
      [],
    );
    const handleUserChange = useCallback(() => {
      setHasUserChanges(true);
    }, []);
    const handleModeClick = (mode: DnfSimulatorMode) => {
      if (mode === visibleMode) return;

      setActiveMode(mode);
      if (!selectedExercise && !walkthroughExample) {
        setHasUserChanges(true);
      }
      if (selectedExercise) {
        onExitExercise?.();
      } else if (walkthroughExample) {
        onExitExample?.();
      }
    };

    const contentKey = `${resetVersion}-${isStorageReady ? "ready" : "loading"}`;
    const activeWalkthroughExample =
      walkthroughExample?.mode === visibleMode ? walkthroughExample : null;

    return (
      <div
        data-testid="dnf-simulator"
        data-mode={visibleMode}
        className="flex h-full flex-col space-y-6"
      >
        <div className="border-border flex gap-1 border-b">
          {simulatorModes.map((mode) => (
            <button
              key={mode}
              type="button"
              data-testid={`dnf-mode-tab-${mode}`}
              className={cn(
                "relative shrink-0 px-4 py-2.5 text-sm font-medium",
                visibleMode === mode
                  ? "text-tab-active"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => handleModeClick(mode)}
            >
              {t(`dnf.simulator.tabs.${mode}`)}
              {visibleMode === mode && (
                <span className="bg-tab-indicator absolute inset-x-0 -bottom-px h-0.5" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1">
          {renderSimulatorBuilder({
            selectedExercise,
            visibleMode,
            activeWalkthroughExample,
            contentKey,
            dnfBuilderRef,
            storedValue,
            handleUserChange,
            isStorageReady,
            handleExpressionChange,
            handleTruthTableChange,
            handleExerciseChange,
          })}
        </div>
      </div>
    );
  },
);

interface RenderSimulatorBuilderProps {
  selectedExercise?: Exercise | null;
  visibleMode: DnfSimulatorMode;
  activeWalkthroughExample: DnfWalkthroughExample | null;
  contentKey: string;
  dnfBuilderRef: RefObject<DnfBuilderHandle | null>;
  storedValue: DnfTransferValue | null;
  handleUserChange: () => void;
  isStorageReady: boolean;
  handleExpressionChange: (value: DnfExpressionTransferDraft) => void;
  handleTruthTableChange: (value: DnfTruthTableTransferDraft) => void;
  handleExerciseChange: (value: DnfExerciseTransferDraft) => void;
}

function renderSimulatorBuilder({
  selectedExercise,
  visibleMode,
  activeWalkthroughExample,
  contentKey,
  dnfBuilderRef,
  storedValue,
  handleUserChange,
  isStorageReady,
  handleExpressionChange,
  handleTruthTableChange,
  handleExerciseChange,
}: RenderSimulatorBuilderProps) {
  if (selectedExercise) {
    return (
      <DnfBuilder
        key={`${selectedExercise.id}-${contentKey}`}
        ref={dnfBuilderRef}
        selectedExercise={selectedExercise}
        initialAttempt={
          storedValue?.mode === "exercise_attempt" ? storedValue : undefined
        }
        onTransferValueChange={
          isStorageReady ? handleExerciseChange : undefined
        }
        onUserChange={handleUserChange}
      />
    );
  }

  if (visibleMode === "expression_to_truth_table") {
    return (
      <ExpressionBuilder
        key={`${activeWalkthroughExample?.id ?? "free-expression"}-${contentKey}`}
        initialValue={getInitialExpressionValue(
          storedValue,
          activeWalkthroughExample,
        )}
        onTransferValueChange={
          isStorageReady ? handleExpressionChange : undefined
        }
        onUserChange={handleUserChange}
        seedInitialFeedback={activeWalkthroughExample !== null}
      />
    );
  }

  return (
    <TableToDnfBuilder
      key={`${activeWalkthroughExample?.id ?? "free-table"}-${contentKey}`}
      initialValue={getInitialTruthTableValue(
        storedValue,
        activeWalkthroughExample,
      )}
      onTransferValueChange={
        isStorageReady ? handleTruthTableChange : undefined
      }
      onUserChange={handleUserChange}
      seedInitialFeedback={activeWalkthroughExample !== null}
    />
  );
}
