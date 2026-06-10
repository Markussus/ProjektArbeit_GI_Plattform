import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExecutionControls } from "@/components/shared/ExecutionControls";
import { TOPIC_STORAGE_IDS } from "@/data/moduleCatalog";
import { useTrainingCenterAutoSave } from "@/hooks/useTrainingCenterAutoSave";
import {
  SIMULATOR_TASK_STORAGE_ID,
  createTrainingCenterIdentifier,
  createTrainingCenterTransferCodec,
  loadTrainingCenterValue,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import type { Exercise, TopicItem } from "@/types/exercise";
import {
  getJavaFileName,
  getJavaScenario,
  getJavaStarterCode,
} from "../../exercises";
import { JavaCompilerStatusBadge } from "../JavaCompilerStatusBadge";
import { useJavaExecutionContext } from "./application/javaExecutionContextValue";
import { JavaCommandOverview } from "./JavaCommandOverview";
import { JavaConsolePanel } from "./JavaConsolePanel";
import { JavaEditorPanel } from "./JavaEditorPanel";
import { javaCodeTransferCodec } from "./domain/javaCodeTransfer";

export interface JavaValidationRunRow {
  id: string;
  passed: boolean;
  output: string;
  expectedOutput: string;
  phase: string;
}

export interface JavaValidationRunResult {
  rows: JavaValidationRunRow[];
  error?: string;
}

export interface JavaSimulatorHandle {
  loadSolution: () => void;
  checkSolution: () => Promise<JavaValidationRunResult>;
  resetStoredState: () => void;
}

export interface JavaSimulatorProps {
  selectedExercise: Exercise | null;
  selectedItem?: TopicItem | null;
  isFocused: boolean;
}

export const JavaSimulator = forwardRef<
  JavaSimulatorHandle,
  JavaSimulatorProps
>(function JavaSimulator({ selectedExercise, selectedItem, isFocused }, ref) {
  const activeItem = selectedItem ?? selectedExercise;

  return (
    <JavaSimulatorSession
      key={activeItem?.id ?? "__default-java-session__"}
      ref={ref}
      itemId={activeItem?.id}
      isFocused={isFocused}
    />
  );
});

interface JavaSimulatorSessionProps {
  itemId?: string;
  isFocused: boolean;
}

const JavaSimulatorSession = forwardRef<
  JavaSimulatorHandle,
  JavaSimulatorSessionProps
>(function JavaSimulatorSession({ itemId, isFocused }, ref) {
  const { t } = useTranslation();
  const scenario = useMemo(() => getJavaScenario(itemId), [itemId]);
  const exerciseScenario = scenario?.kind === "exercise" ? scenario : null;
  const isStorageEnabled = scenario?.kind !== "example";
  const [code, setCode] = useState(() => getJavaStarterCode(itemId));
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [standardInput, setStandardInput] = useState("");
  const [timeoutSeconds, setTimeoutSeconds] = useState(60);
  const [isCommandOverviewOpen, setIsCommandOverviewOpen] = useState(false);
  const { snapshot, preload, run, runAsync, stop, reset } =
    useJavaExecutionContext();

  const fileName = useMemo(() => getJavaFileName(itemId), [itemId]);
  const isBusy =
    snapshot.phase === "loading" ||
    snapshot.phase === "compiling" ||
    snapshot.phase === "running";
  const canRun = snapshot.compilerStatus === "ready" && !isBusy;
  const canStop = isBusy || snapshot.compilerStatus === "loading";
  const storageIdentifier = useMemo(
    () =>
      createTrainingCenterIdentifier(
        TOPIC_STORAGE_IDS.javaProgramming,
        exerciseScenario?.storageId ?? SIMULATOR_TASK_STORAGE_ID,
      ),
    [exerciseScenario?.storageId],
  );
  const storageTransferCodec = useMemo(
    () =>
      isStorageEnabled
        ? createTrainingCenterTransferCodec(
            storageIdentifier,
            javaCodeTransferCodec,
          )
        : javaCodeTransferCodec,
    [isStorageEnabled, storageIdentifier],
  );

  useEffect(() => {
    preload();
  }, [preload]);

  useEffect(() => {
    let isCancelled = false;
    setIsStorageReady(false);

    if (!isStorageEnabled) {
      return;
    }

    void loadTrainingCenterValue(storageIdentifier, javaCodeTransferCodec)
      .then((storedCode) => {
        if (!isCancelled && storedCode !== null) {
          setCode(storedCode);
          reset();
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
  }, [isStorageEnabled, reset, storageIdentifier]);

  const saveCode = useTrainingCenterAutoSave({
    identifier: storageIdentifier,
    value: code,
    codec: javaCodeTransferCodec,
    enabled: isStorageEnabled && isStorageReady,
  });

  const handleRun = useCallback(() => {
    if (isStorageEnabled) {
      void saveCode().catch(() => undefined);
    }
    run({
      source: code,
      exerciseId: exerciseScenario?.id,
      timeoutMs: timeoutSeconds * 1000,
      stdin: standardInput,
    });
  }, [
    code,
    exerciseScenario?.id,
    isStorageEnabled,
    run,
    saveCode,
    standardInput,
    timeoutSeconds,
  ]);

  const handleResetCode = useCallback(() => {
    setCode(getJavaStarterCode(itemId));
    reset();
  }, [itemId, reset]);

  const handleImportCode = useCallback(
    (nextCode: string) => {
      setCode(nextCode);
      reset();
    },
    [reset],
  );

  useImperativeHandle(
    ref,
    () => ({
      resetStoredState: () => {
        if (isStorageEnabled) {
          trainingCenterStorage.delete(storageIdentifier);
        }

        setCode(getJavaStarterCode(itemId));
        setStandardInput("");
        setTimeoutSeconds(60);
        reset();
      },
      loadSolution: () => {
        if (!exerciseScenario) {
          return;
        }

        setCode(exerciseScenario.solutionCode);
        reset();
      },
      checkSolution: async () => {
        if (!exerciseScenario) {
          return {
            rows: [],
            error: t("java.validation.exampleCheckUnavailable"),
          };
        }

        const rows: JavaValidationRunRow[] = [];

        for (const validationCase of exerciseScenario.validationCases) {
          const source = validationCase.sourceTransform?.(code) ?? code;
          const result = await runAsync({
            source,
            exerciseId: exerciseScenario.id,
            timeoutMs: timeoutSeconds * 1000,
            stdin: validationCase.stdin ?? standardInput,
          });
          const output = result.stdout.join("");

          rows.push({
            id: validationCase.id,
            passed:
              result.phase === "done" &&
              normalizeOutput(output) ===
                normalizeOutput(validationCase.expectedStdout),
            output,
            expectedOutput: validationCase.expectedStdout,
            phase: result.phase,
          });
        }

        return { rows };
      },
    }),
    [
      code,
      exerciseScenario,
      isStorageEnabled,
      itemId,
      reset,
      runAsync,
      standardInput,
      storageIdentifier,
      t,
      timeoutSeconds,
    ],
  );

  return (
    <div data-testid="java-simulator" className="flex h-full flex-col gap-4">
      <JavaEditorPanel
        code={code}
        fileName={fileName}
        isFocused={isFocused}
        onCodeChange={setCode}
        onResetCode={handleResetCode}
        onImportCode={handleImportCode}
        transferCodec={storageTransferCodec}
        issues={snapshot.issues}
      />

      <div className="bg-card text-card-foreground rounded-xl border p-4 shadow-sm">
        <label className="block space-y-2">
          <span className="text-muted-foreground text-xs font-bold tracking-[0.18em] uppercase">
            {t("java.stdin.label")}
          </span>
          <textarea
            value={standardInput}
            onChange={(event) => setStandardInput(event.target.value)}
            data-testid="java-stdin-input"
            placeholder={t("java.stdin.placeholder")}
            className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 font-mono text-sm"
          />
        </label>
        <p className="text-muted-foreground mt-2 text-xs">
          {t("java.stdin.help")}
        </p>
      </div>

      <div className="bg-card text-card-foreground flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 shadow-sm">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-bold tracking-[0.18em] uppercase">
            {t("java.compilerLabel")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <JavaCompilerStatusBadge
              status={snapshot.compilerStatus}
              testId="java-compiler-status"
            />
            <p className="text-muted-foreground text-sm">
              {t(`java.compilerStatusText.${snapshot.compilerStatus}`)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCommandOverviewOpen(true)}
            data-testid="java-command-overview-button"
            className="border-border text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
          >
            <ListChecks className="size-4" />
            {t("java.commandOverview.button")}
          </button>

          <label className="flex items-center gap-3 text-sm font-medium">
            <span>{t("java.timeoutLabel")}</span>
            <input
              type="number"
              min={1}
              max={300}
              step={1}
              value={timeoutSeconds}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                if (Number.isNaN(nextValue)) {
                  return;
                }

                setTimeoutSeconds(Math.min(300, Math.max(1, nextValue)));
              }}
              data-testid="java-timeout-input"
              className="border-input bg-background w-20 rounded-md border px-3 py-2 text-sm"
            />
            <span className="text-muted-foreground">
              {t("java.timeoutUnit")}
            </span>
          </label>
        </div>
      </div>

      <JavaCommandOverview
        open={isCommandOverviewOpen}
        onClose={() => setIsCommandOverviewOpen(false)}
      />

      <ExecutionControls
        phase={snapshot.phase}
        onRun={handleRun}
        onStop={stop}
        canRun={canRun}
        canStop={canStop}
        runLabel={
          snapshot.compilerStatus !== "ready"
            ? t("java.runWhileLoading")
            : t("simulation.controls.play", "Run")
        }
        stopLabel={t("simulation.controls.stop", "Stop")}
        runTestId="java-run-button"
        stopTestId="java-stop-button"
        phaseTestId="java-execution-phase"
      />

      <JavaConsolePanel snapshot={snapshot} className="flex-1" />
    </div>
  );
});

function normalizeOutput(output: string) {
  return output.replace(/\r\n/g, "\n").trimEnd();
}
