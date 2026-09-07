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
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import { useTrainingCenterPersistence } from "@/hooks/useTrainingCenterPersistence";
import type { Exercise, TopicItem } from "@/types/exercise";
import {
  getJavaDefaultStdin,
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
import {
  type JavaValidationRunResult,
  runExerciseValidation,
} from "./domain/javaValidationRunner";

export type { JavaValidationRunResult };

export interface JavaSimulatorHandle {
  loadSolution: () => void;
  checkSolution: () => Promise<JavaValidationRunResult>;
  resetStoredState: () => void;
}

interface JavaSimulatorProps {
  selectedExercise: Exercise | null;
  selectedItem?: TopicItem | null;
  isFocused: boolean;
}

function computeSessionControlState(snapshot: {
  phase: string;
  compilerStatus: string;
}) {
  const isBusy =
    snapshot.phase === "loading" ||
    snapshot.phase === "compiling" ||
    snapshot.phase === "running";
  const canRun = snapshot.compilerStatus === "ready" && !isBusy;
  const canStop = isBusy || snapshot.compilerStatus === "loading";
  return { canRun, canStop };
}

function parseTimeoutSeconds(rawValue: string): number | null {
  if (!rawValue.trim()) {
    return null;
  }
  const nextValue = Number(rawValue);
  if (Number.isNaN(nextValue)) {
    return null;
  }
  return Math.min(300, Math.max(1, nextValue));
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
  const [standardInput, setStandardInput] = useState(() =>
    getJavaDefaultStdin(itemId),
  );
  const [timeoutSeconds, setTimeoutSeconds] = useState(60);
  const [isCommandOverviewOpen, setIsCommandOverviewOpen] = useState(false);
  const { snapshot, preload, run, runAsync, stop, reset } =
    useJavaExecutionContext();

  const fileName = useMemo(() => getJavaFileName(itemId), [itemId]);
  const { canRun, canStop } = useMemo(
    () => computeSessionControlState(snapshot),
    [snapshot],
  );

  useEffect(() => {
    preload();
  }, [preload]);

  const restoreCode = useCallback(
    (storedCode: string) => {
      setCode(storedCode);
      reset();
    },
    [reset],
  );
  const { clear: clearStoredCode, save: saveCode } =
    useTrainingCenterPersistence({
      topicStorageId: TOPIC_STORAGE_IDS.javaProgramming,
      taskStorageId: exerciseScenario?.storageId,
      codec: javaCodeTransferCodec,
      value: code,
      onRestore: restoreCode,
      enabled: isStorageEnabled,
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

  const handleTimeoutChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseTimeoutSeconds(event.target.value);
      if (parsed !== null) {
        setTimeoutSeconds(parsed);
      }
    },
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      resetStoredState: () => {
        clearStoredCode();

        setCode(getJavaStarterCode(itemId));
        setStandardInput(getJavaDefaultStdin(itemId));
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
      checkSolution: () =>
        runExerciseValidation({
          exerciseScenario,
          code,
          standardInput,
          timeoutSeconds,
          runAsync,
          exampleCheckUnavailableError: t(
            "java-programming.validation.exampleCheckUnavailable",
          ),
        }),
    }),
    [
      code,
      clearStoredCode,
      exerciseScenario,
      itemId,
      reset,
      runAsync,
      standardInput,
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
        issues={snapshot.issues}
      />

      <div className="bg-card text-card-foreground rounded-xl border p-4 shadow-sm">
        <label className="block space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-bold tracking-[0.18em] uppercase">
              {t("java-programming.stdin.label")}
            </span>
            <span className="text-muted-foreground font-mono text-xs">
              Scanner (System.in)
            </span>
          </div>
          <textarea
            value={standardInput}
            onChange={(event) => setStandardInput(event.target.value)}
            data-testid="java-stdin-input"
            placeholder={t("java-programming.stdin.placeholder")}
            className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 font-mono text-sm"
          />
        </label>
        <p className="text-muted-foreground mt-2 text-xs">
          {t("java-programming.stdin.help")}
        </p>
      </div>

      <div className="bg-card text-card-foreground flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 shadow-sm">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-bold tracking-[0.18em] uppercase">
            {t("java-programming.compilerLabel")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <JavaCompilerStatusBadge
              status={snapshot.compilerStatus}
              testId="java-compiler-status"
            />
            <p className="text-muted-foreground text-sm">
              {t(
                `java-programming.compilerStatusText.${snapshot.compilerStatus}`,
              )}
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
            {t("java-programming.commandOverview.button")}
          </button>

          <label className="flex items-center gap-3 text-sm font-medium">
            <span>{t("java-programming.timeoutLabel")}</span>
            <input
              type="number"
              min={1}
              max={300}
              step={1}
              value={timeoutSeconds}
              onChange={handleTimeoutChange}
              data-testid="java-timeout-input"
              className="border-input bg-background w-20 rounded-md border px-3 py-2 text-sm"
            />
            <span className="text-muted-foreground">
              {t("java-programming.timeoutUnit")}
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
        onStop={() => stop()}
        canRun={canRun}
        canStop={canStop}
        runLabel={
          snapshot.compilerStatus !== "ready"
            ? t("java-programming.runWhileLoading")
            : t("common.simulation.controls.play", "Run")
        }
        stopLabel={t("common.simulation.controls.stop", "Stop")}
        runTestId="java-run-button"
        stopTestId="java-stop-button"
        phaseTestId="java-execution-phase"
      />

      <JavaConsolePanel snapshot={snapshot} className="flex-1" />
    </div>
  );
});
