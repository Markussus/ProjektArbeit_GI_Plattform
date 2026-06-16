import { create } from "zustand";
import type { SimulationMode } from "../components/Simulator/domain/rlTypes";

/**
 * - mode: which conversion / activity the simulator is currently showing.
 * - pendingGrammarSource / pendingLanguageSource / pendingTestWord:
 *   inputs queued by ExamplesTab or ExercisesTab so the simulator opens
 *   pre-filled with a working scenario.
 */
interface RLSimulatorStore {
  mode: SimulationMode;
  setMode: (mode: SimulationMode) => void;

  pendingGrammarSource: string | null;
  pendingLanguageSource: string | null;
  pendingTestWord: string | null;

  loadScenario: (scenario: {
    mode: SimulationMode;
    grammarSource?: string;
    languageSource?: string;
    testWord?: string;
  }) => void;
  consumePending: () => void;

  activeExerciseId: string | null;
  setActiveExercise: (id: string | null) => void;

  /**
   * Live snapshot of the language the learner is editing in the
   * Language → Grammar mode, published so the exercise "Check solution" action
   * can validate it. Null whenever that mode isn't mounted.
   */
  studentLanguageSource: string | null;
  setStudentLanguageSource: (source: string | null) => void;
}

export const useRLSimulatorStore = create<RLSimulatorStore>((set) => ({
  mode: "grammarToLanguage",
  setMode: (mode) => set({ mode }),

  pendingGrammarSource: null,
  pendingLanguageSource: null,
  pendingTestWord: null,

  loadScenario: ({ mode, grammarSource, languageSource, testWord }) =>
    set({
      mode,
      pendingGrammarSource: grammarSource ?? null,
      pendingLanguageSource: languageSource ?? null,
      pendingTestWord: testWord ?? null,
    }),
  consumePending: () =>
    set({
      pendingGrammarSource: null,
      pendingLanguageSource: null,
      pendingTestWord: null,
    }),

  activeExerciseId: null,
  setActiveExercise: (id) => set({ activeExerciseId: id }),

  studentLanguageSource: null,
  setStudentLanguageSource: (source) => set({ studentLanguageSource: source }),
}));
