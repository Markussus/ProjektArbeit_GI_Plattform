import { useState, useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Settings, Sparkles, Play } from "lucide-react";
import { SimulatorStringTransferBox } from "@/components/shared/SimulatorStringTransferBox";
import { cloneJson } from "@/lib/utils";
import { useFAConfigEditor } from "./application/useFAConfigEditor";
import { useFASimulator } from "./application/useFASimulator";
import { defaultDFAProgram, defaultInputWord } from "./config/defaultFAProgram";
import type { FAProgram } from "./domain/faTypes";
import { faProgramTransferCodec } from "./domain/faProgramTransfer";
import { FAConfigView } from "./presentation/FAConfigView";
import { FASimulationView } from "./presentation/FASimulationView";
import { FAGrammarInput } from "./presentation/FAGrammarInput";
import { useFASimulatorStore } from "../../store/faSimulatorStore";

type EditorMode = "manual" | "grammar";

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

  // Consume pending example from the store (loaded via ExamplesTab or by the
  // exercise panel revealing a solution).
  const pendingProgram = useFASimulatorStore((s) => s.pendingProgram);
  const pendingInputWord = useFASimulatorStore((s) => s.pendingInputWord);
  const consumePending = useFASimulatorStore((s) => s.consumePending);

  // The exercise panel (rendered at the SimulationTab level) requests
  // input-word changes via this override channel — no program reload.
  const pendingInputWordOverride = useFASimulatorStore(
    (s) => s.pendingInputWordOverride,
  );
  const consumePendingInputWord = useFASimulatorStore(
    (s) => s.consumePendingInputWord,
  );

  // Publish the simulator's current program so the lifted exercise panel can
  // validate against it. While editing this is the in-flight draft; while
  // simulating it is the committed program.
  const setStudentProgram = useFASimulatorStore((s) => s.setStudentProgram);
  const exposedStudentProgram = isEditMode ? editor.draft : program;
  useEffect(() => {
    setStudentProgram(exposedStudentProgram);
    return () => setStudentProgram(null);
  }, [exposedStudentProgram, setStudentProgram]);

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

  const [prevPendingWordOverride, setPrevPendingWordOverride] = useState<
    string | null
  >(null);

  if (
    pendingInputWordOverride !== null &&
    pendingInputWordOverride !== prevPendingWordOverride
  ) {
    setPrevPendingWordOverride(pendingInputWordOverride);
    setInputWord(pendingInputWordOverride);
  }

  useEffect(() => {
    if (pendingInputWordOverride !== null) {
      consumePendingInputWord();
    }
  }, [pendingInputWordOverride, consumePendingInputWord]);

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

  const handleImportProgram = (imported: FAProgram) => {
    simulation.pause();
    setProgram(imported);
    editor.resetToProgram(imported);
    setIsEditMode(true);
    setEditorMode("manual");
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-2 sm:p-4">
      {isEditMode ? (
        <div className="flex flex-col gap-6">
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
          </div>

          {editorMode === "manual" && (
            <div
              key="manual"
              className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-6 duration-300"
            >
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

              <SimulatorStringTransferBox
                value={editor.draft}
                codec={faProgramTransferCodec}
                onLoad={handleImportProgram}
                testIdPrefix="fa-transfer"
              />

              <button
                onClick={handleApplyProgram}
                disabled={!editor.isValid}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 self-center rounded-lg px-6 py-3 font-semibold shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-4 w-4 fill-current" />
                {t("fa.config.apply", "Start Simulation")}
              </button>
            </div>
          )}

          {editorMode === "grammar" && (
            <div
              key="grammar"
              className="bg-card animate-in fade-in slide-in-from-bottom-2 rounded-xl border p-6 shadow-sm duration-300"
            >
              <FAGrammarInput onConvert={handleGrammarConvert} />
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
          onSelectBatchWord={(word) => {
            setInputWord(word);
            simulation.reset({ program, inputWord: word.split("") });
          }}
        />
      )}
    </div>
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
