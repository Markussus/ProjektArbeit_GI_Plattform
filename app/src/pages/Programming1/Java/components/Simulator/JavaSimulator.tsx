import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ExecutionControls } from "@/components/shared/ExecutionControls";
import type { Exercise } from "@/types/exercise";
import { useJavaExecution } from "./application/useJavaExecution";
import { getJavaFileName, getJavaStarterCode } from "../../exercises";
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
  const { snapshot, run, stop, reset } = useJavaExecution();

  const fileName = useMemo(() => getJavaFileName(exerciseId), [exerciseId]);

  const handleRun = useCallback(() => {
    run({
      source: code,
      exerciseId,
    });
  }, [code, exerciseId, run]);

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
    <div className="flex h-full flex-col gap-4">
      <JavaEditorPanel
        code={code}
        fileName={fileName}
        isFocused={isFocused}
        onCodeChange={setCode}
        onResetCode={handleResetCode}
        onImportCode={handleImportCode}
      />

      <ExecutionControls
        phase={snapshot.phase}
        onRun={handleRun}
        onStop={stop}
        canRun={snapshot.phase !== "running"}
        canStop={snapshot.phase === "running"}
        runLabel={t("simulation.controls.play", "Run")}
        stopLabel={t("simulation.controls.stop", "Stop")}
      />

      <JavaConsolePanel snapshot={snapshot} className="flex-1" />
    </div>
  );
}
