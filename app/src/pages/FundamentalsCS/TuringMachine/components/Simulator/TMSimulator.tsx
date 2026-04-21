import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cloneJson } from "@/lib/utils";
import { useTMConfigEditor } from "./application/useTMConfigEditor";
import { useTMSimulator } from "./application/useTMSimulator";
import { defaultTMProgram } from "./config/defaultTMProgram";
import type { TMProgram } from "./domain/tmProgram";
import { TMConfigView } from "./presentation/TMConfigView";
import { TMSimulationView } from "./presentation/TMSimulationView";

export function TMSimulator() {
  const { t } = useTranslation();
  const [program, setProgram] = useState<TMProgram>(() =>
    cloneJson(defaultTMProgram),
  );
  const [isEditMode, setIsEditMode] = useState(true);
  const editor = useTMConfigEditor(program);
  const simulation = useTMSimulator(program);

  const handleApplyProgram = () => {
    const result = editor.applyProgram();
    if (!result.ok) {
      return;
    }

    setProgram(result.program);
    setIsEditMode(false);
  };

  const handleEditProgram = () => {
    simulation.pause();
    editor.resetToProgram(program);
    setIsEditMode(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
      {isEditMode ? (
        <div className="flex flex-col gap-4">
          <TMConfigView editor={editor} />
          <button
            onClick={handleApplyProgram}
            disabled={editor.hasBlockingCellIssue}
            className="bg-primary text-primary-foreground hover:bg-primary/90 self-center rounded-md px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("tm.config.apply")}
          </button>
        </div>
      ) : (
        <TMSimulationView
          program={program}
          runtime={simulation.runtime}
          status={simulation.status}
          speed={simulation.speed}
          error={simulation.error}
          onEditConfig={handleEditProgram}
          onPlay={simulation.play}
          onPause={simulation.pause}
          onStep={simulation.step}
          onStepBack={simulation.stepBack}
          onReset={() => simulation.reset()}
          onSpeedChange={simulation.setSpeed}
        />
      )}
    </div>
  );
}
