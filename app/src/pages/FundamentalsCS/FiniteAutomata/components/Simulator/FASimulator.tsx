import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { useTranslation } from "react-i18next";
import { Settings, Sparkles, Play } from "lucide-react";
import { TOPIC_STORAGE_IDS } from "@/data/moduleCatalog";
import { useActiveSimulatorTransfer } from "@/hooks/useActiveSimulatorTransfer";
import { useTrainingCenterAutoSave } from "@/hooks/useTrainingCenterAutoSave";
import {
  SIMULATOR_TASK_STORAGE_ID,
  createTrainingCenterIdentifier,
  exportAndStoreTrainingCenterValue,
  loadTrainingCenterValue,
  trainingCenterStorage,
} from "@/lib/trainingCenter";
import { cloneJson, cn } from "@/lib/utils";
import { useFAConfigEditor } from "./application/useFAConfigEditor";
import { useFASimulator } from "./application/useFASimulator";
import { defaultDFAProgram, defaultInputWord } from "./config/defaultFAProgram";
import type { FAProgram } from "./domain/faTypes";
import { faProgramTransferCodec } from "./domain/faProgramTransfer";
import { FAConfigView } from "./presentation/FAConfigView";
import { FAExercisePrompt } from "./presentation/FAExercisePrompt";
import { FASimulationView } from "./presentation/FASimulationView";
import { FAGrammarInput } from "./presentation/FAGrammarInput";
import { findFAExercise } from "../../exercises/faExerciseDefinitions";
import { useFASimulatorStore } from "../../store/faSimulatorStore";

type EditorMode = "manual" | "grammar";

export interface FASimulatorHandle {
  resetStoredState: () => void;
}

interface FASimulatorProps {
  ref?: Ref<FASimulatorHandle>;
}

export function FASimulator({ ref }: FASimulatorProps) {
  const { t } = useTranslation();
  const [program, setProgram] = useState<FAProgram>(() =>
    cloneJson(defaultDFAProgram),
  );
  const [inputWord, setInputWord] = useState(defaultInputWord);
  const [isEditMode, setIsEditMode] = useState(true);
  const [editorMode, setEditorMode] = useState<EditorMode>("manual");

  // A pending program (queued by an example/exercise) takes priority over the
  // saved draft, so storage is considered ready immediately in that case.
  const [isStorageReady, setIsStorageReady] = useState(
    () => useFASimulatorStore.getState().pendingProgram !== null,
  );

  const editor = useFAConfigEditor(program);
  const simulation = useFASimulator(program, inputWord);

  // Persist the edited automaton to local storage using the same Training
  // Center mechanism as the Turing Machine module: the simulator slot for this
  // topic (no per-exercise scenario, so the shared simulator task id is used).
  const storageIdentifier = useMemo(
    () =>
      createTrainingCenterIdentifier(
        TOPIC_STORAGE_IDS.finiteAutomata,
        SIMULATOR_TASK_STORAGE_ID,
      ),
    [],
  );

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
  useActiveSimulatorTransfer({
    identifier: storageIdentifier,
    value: exposedStudentProgram,
    codec: faProgramTransferCodec,
  });
  useEffect(() => {
    setStudentProgram(exposedStudentProgram);
    return () => setStudentProgram(null);
  }, [exposedStudentProgram, setStudentProgram]);

  // Persist the in-progress automaton per exercise so re-opening the exercise
  // restores the learner's work instead of the blank starter.
  const activeExerciseId = useFASimulatorStore((s) => s.activeExerciseId);
  const setExerciseDraft = useFASimulatorStore((s) => s.setExerciseDraft);
  const clearExerciseDraft = useFASimulatorStore((s) => s.clearExerciseDraft);
  useEffect(() => {
    if (activeExerciseId) {
      setExerciseDraft(activeExerciseId, exposedStudentProgram);
    }
  }, [activeExerciseId, exposedStudentProgram, setExerciseDraft]);

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

  const pauseSimulation = simulation.pause;
  const resetEditorToProgram = editor.resetToProgram;

  const handleImportProgram = useCallback(
    (imported: FAProgram) => {
      pauseSimulation();
      setProgram(imported);
      resetEditorToProgram(imported);
      setIsEditMode(true);
      setEditorMode("manual");
    },
    [pauseSimulation, resetEditorToProgram],
  );

  // Restore the most recently saved automaton on mount. A pending program
  // queued by an example/exercise takes priority, so skip the restore then.
  const hasInitializedStorage = useRef(false);
  useEffect(() => {
    if (hasInitializedStorage.current) {
      return;
    }
    hasInitializedStorage.current = true;

    // A pending program will be applied this render; don't restore over it.
    if (useFASimulatorStore.getState().pendingProgram !== null) {
      return;
    }

    let isCancelled = false;
    void loadTrainingCenterValue(storageIdentifier, faProgramTransferCodec)
      .then((storedProgram) => {
        if (!isCancelled && storedProgram) {
          handleImportProgram(storedProgram);
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
  }, [handleImportProgram, storageIdentifier]);

  // While an exercise is active its work persists to the per-exercise draft
  // above, so the shared free-mode slot is only autosaved outside exercises.
  useTrainingCenterAutoSave({
    identifier: storageIdentifier,
    value: editor.draft,
    codec: faProgramTransferCodec,
    enabled: isStorageReady && activeExerciseId === null,
  });

  const handleApplyProgram = () => {
    const result = editor.applyProgram();
    if (!result.ok) return;
    setProgram(result.program);
    setIsEditMode(false);
    void exportAndStoreTrainingCenterValue(
      storageIdentifier,
      result.program,
      faProgramTransferCodec,
    );
  };

  const handleEditProgram = () => {
    simulation.pause();
    editor.resetToProgram(program);
    setIsEditMode(true);
  };

  const resetStoredState = useCallback(() => {
    simulation.pause();

    const exercise = activeExerciseId
      ? findFAExercise(activeExerciseId)
      : undefined;
    const resetProgram = cloneJson(exercise?.starter ?? defaultDFAProgram);

    if (activeExerciseId) {
      clearExerciseDraft(activeExerciseId);
    } else {
      trainingCenterStorage.delete(storageIdentifier);
    }

    setProgram(resetProgram);
    editor.resetToProgram(resetProgram);
    setInputWord(
      exercise?.exampleWords?.accept.find((word) => word.length > 0) ??
        defaultInputWord,
    );
    setIsEditMode(true);
    setEditorMode("manual");
  }, [
    activeExerciseId,
    clearExerciseDraft,
    editor,
    simulation,
    storageIdentifier,
  ]);

  useImperativeHandle(ref, () => ({ resetStoredState }), [resetStoredState]);

  const handleGrammarConvert = (converted: FAProgram) => {
    setProgram(converted);
    editor.resetToProgram(converted);
    setEditorMode("manual");
  };

  // The open exercise's problem statement stays visible while building and
  // while simulating — the grammar family cannot be solved without it.
  const activeExercise = activeExerciseId
    ? findFAExercise(activeExerciseId)
    : undefined;

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col gap-6 p-2 sm:p-4",
        isEditMode ? "max-w-none" : "max-w-7xl",
      )}
    >
      {activeExercise && <FAExercisePrompt exercise={activeExercise} />}

      {isEditMode ? (
        <div className="flex flex-col gap-6">
          {/* Mode Toggle */}
          <div className="bg-muted/40 inline-flex w-fit items-center gap-1 rounded-lg p-1">
            <ModeButton
              active={editorMode === "manual"}
              onClick={() => setEditorMode("manual")}
              icon={<Settings className="h-4 w-4" />}
              label={t("finite-automata.editor.manual", "Manual Editor")}
            />
            <ModeButton
              active={editorMode === "grammar"}
              onClick={() => setEditorMode("grammar")}
              icon={<Sparkles className="h-4 w-4" />}
              label={t("finite-automata.editor.grammar", "From Grammar")}
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
                  {t("finite-automata.config.inputWord", "Input Word")}
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
                    "finite-automata.config.inputWordHelp",
                    "Each character is treated as one input symbol.",
                  )}
                </p>
              </div>

              <button
                onClick={handleApplyProgram}
                disabled={!editor.isValid}
                className="bg-brand text-brand-foreground inline-flex items-center justify-center gap-2 self-center rounded-lg px-6 py-3 font-semibold shadow-md transition-all hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-4 w-4 fill-current" />
                {t("finite-automata.config.apply", "Start Simulation")}
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
