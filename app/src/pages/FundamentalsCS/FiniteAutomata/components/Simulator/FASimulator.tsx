import { useState, useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Settings, Sparkles, Wand2, Play } from "lucide-react";
import { cloneJson } from "@/lib/utils";
import { useFAConfigEditor } from "./application/useFAConfigEditor";
import { useFASimulator } from "./application/useFASimulator";
import { defaultDFAProgram, defaultInputWord } from "./config/defaultFAProgram";
import type { FAProgram } from "./domain/faTypes";
import { FAConfigView } from "./presentation/FAConfigView";
import { FASimulationView } from "./presentation/FASimulationView";
import { FAGrammarInput } from "./presentation/FAGrammarInput";
import { FAGeneratorInput } from "./presentation/FAGeneratorInput";
import { FAHelpButton } from "./presentation/FAHelpButton";
import { FAExerciseWorkspacePanel } from "./presentation/FAExerciseWorkspacePanel";
import { useFAExampleStore } from "../../store/faExampleStore";
import { useFAExerciseStore } from "../../store/faExerciseStore";
import { findFAExercise } from "../../exercises/faExerciseDefinitions";

type EditorMode = "manual" | "grammar" | "generator";

export function FASimulator() {
  const { t } = useTranslation();
  const [program, setProgram] = useState<FAProgram>(() =>
    cloneJson(defaultDFAProgram),
  );
  const [inputWord, setInputWord] = useState(defaultInputWord);
  const [isEditMode, setIsEditMode] = useState(true);
  const [editorMode, setEditorMode] = useState<EditorMode>("manual");

  const editor = useFAConfigEditor(program);
  const simulation = useFASimulator(program, inputWord);

  // Consume pending example from the store (loaded via ExamplesTab)
  const pendingProgram = useFAExampleStore((s) => s.pendingProgram);
  const pendingInputWord = useFAExampleStore((s) => s.pendingInputWord);
  const consumePending = useFAExampleStore((s) => s.consumePending);

  // Exercise mode — when set, we render the workspace panel above the editor.
  const activeExerciseId = useFAExerciseStore((s) => s.activeExerciseId);
  const setActiveExercise = useFAExerciseStore((s) => s.setActiveExercise);
  const activeExercise = activeExerciseId
    ? findFAExercise(activeExerciseId)
    : undefined;

  // Track which pending program has already been applied to avoid double-processing.
  const [prevPendingProgram, setPrevPendingProgram] =
    useState<typeof pendingProgram>(null);
  if (pendingProgram !== null && pendingProgram !== prevPendingProgram) {
    const loaded = cloneJson(pendingProgram);
    setPrevPendingProgram(pendingProgram);
    setProgram(loaded);
    setInputWord(pendingInputWord);
    setIsEditMode(true);
    setEditorMode("manual");
    editor.resetToProgram(loaded);
  }

  // Clear the store entry after the pending program has been applied.
  useEffect(() => {
    if (pendingProgram) {
      consumePending();
    }
  }, [pendingProgram, consumePending]);

  const handleApplyProgram = () => {
    const result = editor.applyProgram();
    if (!result.ok) return;
    setProgram(result.program);
    setIsEditMode(false);
  };

  const handleEditProgram = () => {
    simulation.pause();
    editor.resetToProgram(program);
    setIsEditMode(true);
  };

  const handleGrammarConvert = (converted: FAProgram) => {
    setProgram(converted);
    editor.resetToProgram(converted);
    setEditorMode("manual");
  };

  const handleGeneratorConvert = (
    converted: FAProgram,
    suggestedInputWord?: string,
  ) => {
    setProgram(converted);
    editor.resetToProgram(converted);
    if (suggestedInputWord !== undefined) {
      setInputWord(suggestedInputWord);
    }
    setEditorMode("manual");
  };

  const handleLoadExerciseSolution = (solution: FAProgram) => {
    const cloned = cloneJson(solution);
    setProgram(cloned);
    editor.resetToProgram(cloned);
    setEditorMode("manual");
  };

  const handleExitExercise = () => {
    setActiveExercise(null);
  };

  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-2 sm:p-4">
        {isEditMode ? (
          <div className="flex flex-col gap-6">
            {activeExercise && (
              <FAExerciseWorkspacePanel
                exercise={activeExercise}
                studentProgram={editor.draft}
                onLoadSolution={handleLoadExerciseSolution}
                onExit={handleExitExercise}
              />
            )}

            {/* Mode Toggle */}
            <div className="bg-muted/40 inline-flex w-fit items-center gap-1 rounded-lg p-1">
              <ModeButton
                active={editorMode === "manual"}
                onClick={() => setEditorMode("manual")}
                icon={<Settings className="h-4 w-4" />}
                label={t("fa.editor.manual", "Manual Editor")}
              />
              <ModeButton
                active={editorMode === "grammar"}
                onClick={() => setEditorMode("grammar")}
                icon={<Sparkles className="h-4 w-4" />}
                label={t("fa.editor.grammar", "From Grammar")}
              />
              <ModeButton
                active={editorMode === "generator"}
                onClick={() => setEditorMode("generator")}
                icon={<Wand2 className="h-4 w-4" />}
                label={t("fa.editor.generator", "Generator")}
              />
            </div>

            {editorMode === "manual" && (
              <>
                <div className="bg-card rounded-xl border p-6 shadow-sm">
                  <FAConfigView editor={editor} />
                </div>

                <div className="bg-card flex flex-col gap-3 rounded-xl border p-6 shadow-sm">
                  <label className="text-sm font-semibold">
                    {t("fa.config.inputWord", "Input Word")}
                  </label>
                  <input
                    type="text"
                    value={inputWord}
                    onChange={(e) => setInputWord(e.target.value)}
                    className="border-input bg-background focus:ring-primary w-full rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
                    placeholder="aab"
                  />
                  <p className="text-muted-foreground text-xs">
                    {t(
                      "fa.config.inputWordHelp",
                      "Each character is treated as one input symbol.",
                    )}
                  </p>
                </div>

                <button
                  onClick={handleApplyProgram}
                  disabled={!editor.isValid}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 self-center rounded-lg px-6 py-3 font-semibold shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Play className="h-4 w-4 fill-current" />
                  {t("fa.config.apply", "Start Simulation")}
                </button>
              </>
            )}

            {editorMode === "grammar" && (
              <div className="bg-card rounded-xl border p-6 shadow-sm">
                <FAGrammarInput onConvert={handleGrammarConvert} />
              </div>
            )}

            {editorMode === "generator" && (
              <div className="bg-card rounded-xl border p-6 shadow-sm">
                <FAGeneratorInput onConvert={handleGeneratorConvert} />
              </div>
            )}
          </div>
        ) : (
          <FASimulationView
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
            onJumpToStep={simulation.jumpToStep}
            onJumpToEnd={simulation.jumpToEnd}
            onSelectBatchWord={(word) => {
              setInputWord(word);
              simulation.reset({ program, inputWord: word.split("") });
            }}
          />
        )}
      </div>

      <FAHelpButton />
    </>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
