import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { useTranslation } from "react-i18next";
import { Play, Settings, Sparkles } from "lucide-react";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
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
import { emptyFAProgram, emptyInputWord } from "./config/emptyFAProgram";
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
  const rootRef = useRef<HTMLDivElement>(null);
  const activeExerciseId = useFASimulatorStore((s) => s.activeExerciseId);
  const pendingProgram = useFASimulatorStore((s) => s.pendingProgram);
  const pendingInputWord = useFASimulatorStore((s) => s.pendingInputWord);
  const pendingInputWordOverride = useFASimulatorStore(
    (s) => s.pendingInputWordOverride,
  );
  const consumePending = useFASimulatorStore((s) => s.consumePending);
  const consumePendingInputWord = useFASimulatorStore(
    (s) => s.consumePendingInputWord,
  );
  const setStudentProgram = useFASimulatorStore((s) => s.setStudentProgram);
  const clearExerciseDraft = useFASimulatorStore((s) => s.clearExerciseDraft);

  const isPendingMount = useRef(
    useFASimulatorStore.getState().pendingProgram !== null,
  );

  const [program, setProgram] = useState<FAProgram>(
    () => useFASimulatorStore.getState().pendingProgram ?? emptyFAProgram,
  );
  const [inputWord, setInputWord] = useState(
    () => useFASimulatorStore.getState().pendingInputWord || emptyInputWord,
  );
  const [isEditMode, setIsEditMode] = useState(true);
  const [editorMode, setEditorMode] = useState<EditorMode>("manual");

  // Keep studentProgram in the store up to date so the parent SimulationTab can
  // read it when the learner clicks "Check Solution".
  useEffect(() => {
    setStudentProgram(program);
  }, [program, setStudentProgram]);

  const storageIdentifier = activeExerciseId
    ? createTrainingCenterIdentifier(
        TOPIC_STORAGE_IDS.finiteAutomata,
        SIMULATOR_TASK_STORAGE_ID,
      )
    : createTrainingCenterIdentifier(
        TOPIC_STORAGE_IDS.finiteAutomata,
        SIMULATOR_TASK_STORAGE_ID,
      );

  const [isStorageReady, setIsStorageReady] = useState(false);

  const editor = useFAConfigEditor(program);
  const simulation = useFASimulator(program, inputWord);

  const scrollWorkspaceIntoView = () => {
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Adopt freshly queued programs (from an example or exercise) into state.
  // Must run during render so the editor is initialized with the example's
  // program on the very frame the simulation tab opens, not one frame later.
  const [prevPendingProgram, setPrevPendingProgram] =
    useState<FAProgram | null>(null);
  const [prevPendingWord, setPrevPendingWord] = useState<string | null>(null);

  if (
    pendingProgram !== null &&
    (pendingProgram !== prevPendingProgram ||
      pendingInputWord !== prevPendingWord)
  ) {
    setPrevPendingProgram(pendingProgram);
    setPrevPendingWord(pendingInputWord);
    setProgram(pendingProgram);
    editor.resetToProgram(pendingProgram);
    if (pendingInputWord !== null) {
      setInputWord(pendingInputWord);
    }
    setIsEditMode(true);
    setEditorMode("manual");
  }

  useEffect(() => {
    if (pendingProgram !== null) {
      consumePending();
    }
  }, [pendingProgram, consumePending]);

  // Synchronize an example-provided input word into state on the frame it arrives.
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

    // A pending program will be applied; don't restore over it.
    if (
      isPendingMount.current ||
      useFASimulatorStore.getState().pendingProgram !== null
    ) {
      setIsStorageReady(true);
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

  useActiveSimulatorTransfer({
    identifier: storageIdentifier,
    value: isEditMode ? editor.draft : program,
    codec: faProgramTransferCodec,
  });

  // While an exercise is active its work persists to the per-exercise draft
  // above, so the shared free-mode slot is only autosaved outside exercises.
  useTrainingCenterAutoSave({
    identifier: storageIdentifier,
    value: editor.draft,
    codec: faProgramTransferCodec,
    enabled: isStorageReady && activeExerciseId === null,
  });

  const handleStartSimulation = () => {
    const result = editor.applyProgram();
    if (!result.ok) return;
    setProgram(result.program);
    setIsEditMode(false);
    scrollWorkspaceIntoView();
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
    const resetProgram = cloneJson(exercise?.starter ?? emptyFAProgram);

    if (activeExerciseId) {
      clearExerciseDraft(activeExerciseId);
    } else {
      trainingCenterStorage.delete(storageIdentifier);
    }

    setProgram(resetProgram);
    editor.resetToProgram(resetProgram);
    setInputWord(
      exercise?.exampleWords?.accept.find((word) => word.length > 0) ??
        emptyInputWord,
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

  useImperativeHandle(ref, () => ({
    resetStoredState,
  }));

  const handleGrammarConvert = (converted: FAProgram) => {
    setProgram(converted);
    editor.resetToProgram(converted);
    setIsEditMode(true);
    setEditorMode("manual");
  };

  const activeExercise = activeExerciseId
    ? findFAExercise(activeExerciseId)
    : undefined;

  return (
    <div
      ref={rootRef}
      className={cn(
        "mx-auto flex w-full flex-col gap-6 p-2 sm:p-4",
        isEditMode ? "max-w-none" : "max-w-7xl",
      )}
    >
      {activeExercise && <FAExercisePrompt exercise={activeExercise} />}

      {isEditMode ? (
        <div className="flex flex-col gap-6">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between gap-2 md:mr-24">
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
                type="button"
                onClick={handleStartSimulation}
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
