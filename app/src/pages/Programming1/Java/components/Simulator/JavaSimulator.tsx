import { useCallback, useEffect, useMemo, useState } from "react";
import { ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExecutionControls } from "@/components/shared/ExecutionControls";
import type { Exercise } from "@/types/exercise";
import { getJavaFileName, getJavaStarterCode } from "../../exercises";
import { JavaCompilerStatusBadge } from "../JavaCompilerStatusBadge";
import { useJavaExecutionContext } from "./application/javaExecutionContextValue";
import { JavaCommandOverview } from "./JavaCommandOverview";
import { JavaConsolePanel } from "./JavaConsolePanel";
import { JavaEditorPanel } from "./JavaEditorPanel";

export interface JavaSimulatorProps {
  selectedExercise: Exercise | null;
  isFocused: boolean;
}

export function JavaSimulator({
  selectedExercise,
  isFocused,
}: JavaSimulatorProps) {
  return (
    <JavaSimulatorSession
      key={selectedExercise?.id ?? "__default-java-session__"}
      exerciseId={selectedExercise?.id}
      isFocused={isFocused}
    />
  );
}

interface JavaSimulatorSessionProps {
  exerciseId?: string;
  isFocused: boolean;
}

function JavaSimulatorSession({
  exerciseId,
  isFocused,
}: JavaSimulatorSessionProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState(() => getJavaStarterCode(exerciseId));
  const [timeoutSeconds, setTimeoutSeconds] = useState(60);
  const [isCommandOverviewOpen, setIsCommandOverviewOpen] = useState(false);
  const { snapshot, preload, run, stop, reset } = useJavaExecutionContext();

  const fileName = useMemo(() => getJavaFileName(exerciseId), [exerciseId]);
  const isBusy =
    snapshot.phase === "loading" ||
    snapshot.phase === "compiling" ||
    snapshot.phase === "running";
  const canRun = snapshot.compilerStatus === "ready" && !isBusy;
  const canStop = isBusy || snapshot.compilerStatus === "loading";

  useEffect(() => {
    preload();
  }, [preload]);

  const handleRun = useCallback(() => {
    run({
      source: code,
      exerciseId,
      timeoutMs: timeoutSeconds * 1000,
    });
  }, [code, exerciseId, run, timeoutSeconds]);

  const handleResetCode = useCallback(() => {
    setCode(getJavaStarterCode(exerciseId));
    reset();
  }, [exerciseId, reset]);

  const handleImportCode = useCallback(
    (nextCode: string) => {
      setCode(nextCode);
      reset();
    },
    [reset],
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
      />

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
          <p className="text-muted-foreground max-w-3xl text-sm">
            {t("java.compilerEnvironmentSummary")}
          </p>
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
}
