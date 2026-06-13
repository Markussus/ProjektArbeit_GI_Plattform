import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import type { Example, Exercise } from "@/types/exercise";
import { cn } from "@/lib/utils";
import { TOPIC_STORAGE_IDS } from "@/data/moduleCatalog";
import {
  SIMULATOR_TASK_STORAGE_ID,
  createTrainingCenterIdentifier,
  createTrainingCenterTransferCodec,
  loadTrainingCenterValue,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import { DnfBuilder } from "./DnfBuilder/DnfBuilder";
import {
  dnfExerciseTransferCodec,
  dnfExpressionTransferCodec,
  dnfTransferCodec,
  dnfTruthTableTransferCodec,
  type DnfExpressionTransferDraft,
  type DnfTransferValue,
  type DnfTruthTableTransferDraft,
} from "./DnfBuilder/domain/dnfTransfer";
import { ExpressionBuilder } from "./ExpressionBuilder/ExpressionBuilder";
import { TableToDnfBuilder } from "./TableToDnfBuilder/TableToDnfBuilder";
import { getDnfExerciseDefinition } from "../exercises";
import { getDnfWalkthroughExample } from "../examples/walkthroughExamples";

type DnfSimulatorMode = "expression_to_truth_table" | "truth_table_to_dnf";

const simulatorModes: DnfSimulatorMode[] = [
  "expression_to_truth_table",
  "truth_table_to_dnf",
];

interface DnfSimulatorProps {
  selectedExercise?: Exercise | null;
  selectedExample?: Example | null;
  onExitExercise?: () => void;
  onExitExample?: () => void;
}

export interface DnfSimulatorHandle {
  resetStoredState: () => void;
}

export const DnfSimulator = forwardRef<DnfSimulatorHandle, DnfSimulatorProps>(
  function DnfSimulator(
    { selectedExercise, selectedExample, onExitExercise, onExitExample },
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
    const storageIdentifier = useMemo(
      () =>
        createTrainingCenterIdentifier(
          TOPIC_STORAGE_IDS.dnf,
          selectedExerciseDefinition?.storageId ?? SIMULATOR_TASK_STORAGE_ID,
        ),
      [selectedExerciseDefinition?.storageId],
    );
    const [storedValue, setStoredValue] = useState<DnfTransferValue | null>(
      null,
    );
    const [isStorageReady, setIsStorageReady] = useState(!isStorageEnabled);
    const [hasStoredState, setHasStoredState] = useState(false);
    const [hasUserChanges, setHasUserChanges] = useState(false);
    const [resetVersion, setResetVersion] = useState(0);

    // Seed the active mode from a walkthrough example (if any) so the example
    // opens in its native mode, but let the user override by clicking a tab.
    // The component remounts when the example changes (parent uses a keyed
    // mount), so this initial value is recomputed for each new example.
    const [activeMode, setActiveMode] = useState<DnfSimulatorMode>(
      walkthroughExample?.mode ?? "expression_to_truth_table",
    );

    const visibleMode = selectedExerciseMode ?? activeMode;
    const expressionTransferCodec = useMemo(
      () =>
        isStorageEnabled
          ? createTrainingCenterTransferCodec(
              storageIdentifier,
              dnfExpressionTransferCodec,
            )
          : dnfExpressionTransferCodec,
      [isStorageEnabled, storageIdentifier],
    );
    const truthTableTransferCodec = useMemo(
      () =>
        isStorageEnabled
          ? createTrainingCenterTransferCodec(
              storageIdentifier,
              dnfTruthTableTransferCodec,
            )
          : dnfTruthTableTransferCodec,
      [isStorageEnabled, storageIdentifier],
    );
    const exerciseTransferCodec = useMemo(
      () =>
        isStorageEnabled
          ? createTrainingCenterTransferCodec(
              storageIdentifier,
              dnfExerciseTransferCodec,
            )
          : dnfExerciseTransferCodec,
      [isStorageEnabled, storageIdentifier],
    );

    useEffect(() => {
      let isCancelled = false;
      setStoredValue(null);
      setIsStorageReady(false);
      setHasStoredState(false);
      setHasUserChanges(false);

      if (!isStorageEnabled) {
        setIsStorageReady(true);
        return;
      }

      void loadTrainingCenterValue(storageIdentifier, dnfTransferCodec)
        .then((value) => {
          if (isCancelled || !value) {
            return;
          }

          setStoredValue(value);
          setHasStoredState(true);
          if (!selectedExercise && value.mode !== "exercise_attempt") {
            setActiveMode(value.mode);
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
    }, [isStorageEnabled, selectedExercise, storageIdentifier]);

    useEffect(() => {
      if (resetVersion === 0 || !isStorageEnabled) {
        return;
      }

      const timeoutId = window.setTimeout(() => {
        trainingCenterStorage.delete(storageIdentifier);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }, [isStorageEnabled, resetVersion, storageIdentifier]);

    useImperativeHandle(
      ref,
      () => ({
        resetStoredState: () => {
          if (isStorageEnabled) {
            trainingCenterStorage.delete(storageIdentifier);
          }

          setStoredValue(null);
          setHasStoredState(false);
          setHasUserChanges(false);
          setResetVersion((current) => current + 1);
        },
      }),
      [isStorageEnabled, storageIdentifier],
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
        // Switching tabs while a walkthrough example is active drops the
        // example: the other mode has no seed data for it and the header would
        // otherwise still advertise the example as "selected".
        onExitExample?.();
      }
    };

    const renderContent = () => {
      const contentKey = `${resetVersion}-${isStorageReady ? "ready" : "loading"}`;
      const commonStorageProps = {
        storageIdentifier,
        storageEnabled: isStorageEnabled && (hasStoredState || hasUserChanges),
        storageReady: isStorageReady,
      };

      if (selectedExercise) {
        return (
          <DnfBuilder
            key={`${selectedExercise.id}-${contentKey}`}
            selectedExercise={selectedExercise}
            initialAttempt={
              storedValue?.mode === "exercise_attempt" ? storedValue : undefined
            }
            transferCodec={exerciseTransferCodec}
            onUserChange={handleUserChange}
            {...commonStorageProps}
          />
        );
      }

      if (
        walkthroughExample?.mode === "expression_to_truth_table" &&
        visibleMode === "expression_to_truth_table"
      ) {
        return (
          <ExpressionBuilder
            key={`${walkthroughExample.id}-${contentKey}`}
            initialValue={{
              expression: walkthroughExample.expression,
              committed: false,
              ...emptyAttempt,
            }}
            transferCodec={expressionTransferCodec}
            onTransferValueChange={
              isStorageReady ? handleExpressionChange : undefined
            }
            onUserChange={handleUserChange}
            {...commonStorageProps}
          />
        );
      }

      if (
        walkthroughExample?.mode === "truth_table_to_dnf" &&
        visibleMode === "truth_table_to_dnf"
      ) {
        return (
          <TableToDnfBuilder
            key={`${walkthroughExample.id}-${contentKey}`}
            initialValue={{
              variableCount: walkthroughExample.variables.length,
              resultValues: walkthroughExample.resultValues,
              committed: false,
              ...emptyAttempt,
            }}
            transferCodec={truthTableTransferCodec}
            onTransferValueChange={
              isStorageReady ? handleTruthTableChange : undefined
            }
            onUserChange={handleUserChange}
            {...commonStorageProps}
          />
        );
      }

      return visibleMode === "expression_to_truth_table" ? (
        <ExpressionBuilder
          key={`free-expression-${contentKey}`}
          initialValue={
            storedValue?.mode === "expression_to_truth_table"
              ? storedValue
              : undefined
          }
          transferCodec={expressionTransferCodec}
          onTransferValueChange={
            isStorageReady ? handleExpressionChange : undefined
          }
          onUserChange={handleUserChange}
          {...commonStorageProps}
        />
      ) : (
        <TableToDnfBuilder
          key={`free-table-${contentKey}`}
          initialValue={
            storedValue?.mode === "truth_table_to_dnf" ? storedValue : undefined
          }
          transferCodec={truthTableTransferCodec}
          onTransferValueChange={
            isStorageReady ? handleTruthTableChange : undefined
          }
          onUserChange={handleUserChange}
          {...commonStorageProps}
        />
      );
    };

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

        <div className="flex-1">{renderContent()}</div>
      </div>
    );
  },
);

const emptyAttempt = {
  truthTableAnswers: [],
  dnfAnswer: "",
  simplificationAnswer: "",
};
