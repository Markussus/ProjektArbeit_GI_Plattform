import {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import { useTranslation } from "react-i18next";
import { Play, Settings, Sparkles } from "lucide-react";
import { TOPIC_STORAGE_IDS } from "@/data/topicStorageIds";
import { useTrainingCenterPersistence } from "@/hooks/useTrainingCenterPersistence";
import { exportAndStoreTrainingCenterValue } from "@/lib/trainingCenter";
import { cloneJson, cn } from "@/lib/utils";
import { InlineTabNavigation } from "@/components/shared/InlineTabNavigation";
import { useFAConfigEditor } from "./application/useFAConfigEditor";
import { useFASimulator } from "./application/useFASimulator";
import { emptyFAProgram, emptyInputWord } from "./config/emptyFAProgram";
import type { FAExample } from "./config/faExamples";
import type { FAProgram } from "./domain/faTypes";
import { faProgramTransferCodec } from "./domain/faProgramTransfer";
import {
  validateAgainstSolution,
  type ValidationResult,
} from "./domain/faExerciseValidation";
import { FAConfigView } from "./presentation/FAConfigView";
import { FASimulationView } from "./presentation/FASimulationView";
import { FAGrammarInput } from "./presentation/FAGrammarInput";
import type { FAExerciseDefinition } from "../../exercises/faExerciseDefinitions";

type EditorMode = "manual" | "grammar";

export type FACheckResult = ValidationResult | "unbuilt";

export interface FASimulatorHandle {
  resetStoredState: () => void;
  loadSolution: () => void;
  checkSolution: () => FACheckResult;
  getCurrentProgram: () => FAProgram;
}

export interface FASimulatorProps {
  exercise?: FAExerciseDefinition | null;
  example?: FAExample | null;
  ref?: Ref<FASimulatorHandle>;
}

export function FASimulator({ exercise, example, ref }: FASimulatorProps) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);

  const initialProgram =
    exercise?.starter ?? example?.program ?? emptyFAProgram;
  const initialInputWord =
    exercise?.exampleWords?.accept.find((w) => w.length > 0) ??
    example?.inputWord ??
    emptyInputWord;

  const [program, setProgram] = useState<FAProgram>(initialProgram);
  const [inputWord, setInputWord] = useState<string>(initialInputWord);
  const [isEditMode, setIsEditMode] = useState(true);
  const [editorMode, setEditorMode] = useState<EditorMode>("manual");

  // Examples are pristine demonstrations, so they are the one scenario that
  // neither restores nor saves — every other topic draws the line in the same
  // place.
  const isStorageEnabled = !example;

  const editor = useFAConfigEditor(program);
  const simulation = useFASimulator(program, inputWord);

  const scrollWorkspaceIntoView = () => {
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

  // Each exercise gets its own slot, so work on one never overwrites another;
  // the free simulator keeps the topic's default slot.
  const { identifier: storageIdentifier, clear: clearStoredState } =
    useTrainingCenterPersistence({
      topicStorageId: TOPIC_STORAGE_IDS.finiteAutomata,
      taskStorageId: exercise?.storageId,
      codec: faProgramTransferCodec,
      value: editor.draft,
      transferValue: isEditMode ? editor.draft : program,
      onRestore: handleImportProgram,
      enabled: isStorageEnabled,
    });

  const handleStartSimulation = () => {
    const result = editor.applyProgram();
    if (!result.ok) return;
    setProgram(result.program);
    setIsEditMode(false);
    scrollWorkspaceIntoView();
    if (isStorageEnabled) {
      void exportAndStoreTrainingCenterValue(
        storageIdentifier,
        result.program,
        faProgramTransferCodec,
      );
    }
  };

  const handleEditProgram = () => {
    simulation.pause();
    editor.resetToProgram(program);
    setIsEditMode(true);
  };

  const resetStoredState = useCallback(() => {
    simulation.pause();
    const resetProgram = cloneJson(initialProgram);

    clearStoredState();

    setProgram(resetProgram);
    editor.resetToProgram(resetProgram);
    setInputWord(initialInputWord);
    setIsEditMode(true);
    setEditorMode("manual");
  }, [initialProgram, initialInputWord, clearStoredState, editor, simulation]);

  const loadSolution = useCallback(() => {
    if (!exercise) return;
    simulation.pause();
    const seedInput =
      exercise.exampleWords?.accept.find((w) => w.length > 0) ?? "";
    setProgram(exercise.solution);
    editor.resetToProgram(exercise.solution);
    setInputWord(seedInput);
    setIsEditMode(true);
    setEditorMode("manual");
  }, [exercise, simulation, editor]);

  const checkSolution = useCallback((): FACheckResult => {
    if (!exercise) return "unbuilt";
    const currentProg = isEditMode ? editor.draft : program;
    const noAccept = currentProg.acceptStates.length === 0;
    const noTransitions = Object.values(currentProg.transitions).every(
      (row) => Object.keys(row).length === 0,
    );
    if (noAccept && noTransitions) {
      return "unbuilt";
    }
    return validateAgainstSolution(currentProg, exercise.solution, {
      maxLen: exercise.maxTestLen ?? 4,
    });
  }, [exercise, isEditMode, editor.draft, program]);

  const getCurrentProgram = useCallback(
    () => (isEditMode ? editor.draft : program),
    [isEditMode, editor.draft, program],
  );

  useImperativeHandle(
    ref,
    () => ({
      resetStoredState,
      loadSolution,
      checkSolution,
      getCurrentProgram,
    }),
    [resetStoredState, loadSolution, checkSolution, getCurrentProgram],
  );

  const handleGrammarConvert = (converted: FAProgram) => {
    setProgram(converted);
    editor.resetToProgram(converted);
    setIsEditMode(true);
    setEditorMode("manual");
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "mx-auto flex w-full flex-col gap-6 p-2 sm:p-4",
        isEditMode ? "max-w-none" : "max-w-7xl",
      )}
    >
      {isEditMode ? (
        <div className="flex flex-col gap-6">
          {/* Mode Toggle */}
          <div className="mx-auto w-full md:pr-24">
            <InlineTabNavigation<EditorMode>
              activeTab={editorMode}
              onTabChange={setEditorMode}
              ariaLabel={t("finite-automata.editor.mode", "Editor Mode")}
              tabs={[
                {
                  id: "manual",
                  label: (
                    <span className="flex items-center gap-2">
                      <Settings className="size-4" />
                      {t("finite-automata.editor.manual", "Manual Editor")}
                    </span>
                  ),
                  testId: "fa-mode-tab-manual",
                },
                {
                  id: "grammar",
                  label: (
                    <span className="flex items-center gap-2">
                      <Sparkles className="size-4" />
                      {t("finite-automata.editor.grammar", "From Grammar")}
                    </span>
                  ),
                  testId: "fa-mode-tab-grammar",
                },
              ]}
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
                type="button"
                data-testid="fa-start-simulation"
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
