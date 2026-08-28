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

  /**
   * The learner's in-progress answer for each exercise, keyed by exercise id
   * (an enumerated word list for Grammar → Language, a grammar for Language →
   * Grammar). Held in the store so it survives leaving and re-entering exercise
   * mode; cleared explicitly by "Reset all exercises".
   */
  exerciseDrafts: Record<string, string>;
  setExerciseDraft: (exerciseId: string, value: string) => void;
  clearExerciseDraft: (exerciseId: string) => void;
  clearExerciseDrafts: () => void;

  /**
   * One-shot payload used by "Load solution" in a Grammar → Language exercise:
   * the revealed enumeration (comma-separated) to drop into the student input.
   */
  revealedEnumeration: string | null;
  revealEnumeration: (words: string) => void;
  consumeRevealedEnumeration: () => void;

  /**
   * One-shot payload used by "Load solution" in a Language → Grammar exercise:
   * the revealed reference grammar to drop into the student grammar input.
   */
  revealedGrammar: string | null;
  revealGrammar: (grammar: string) => void;
  consumeRevealedGrammar: () => void;
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

  exerciseDrafts: {},
  setExerciseDraft: (exerciseId, value) =>
    set((state) => ({
      exerciseDrafts: { ...state.exerciseDrafts, [exerciseId]: value },
    })),
  clearExerciseDraft: (exerciseId) =>
    set((state) => {
      const exerciseDrafts = { ...state.exerciseDrafts };
      delete exerciseDrafts[exerciseId];
      return { exerciseDrafts };
    }),
  clearExerciseDrafts: () => set({ exerciseDrafts: {} }),

  revealedEnumeration: null,
  revealEnumeration: (words) => set({ revealedEnumeration: words }),
  consumeRevealedEnumeration: () => set({ revealedEnumeration: null }),

  revealedGrammar: null,
  revealGrammar: (grammar) => set({ revealedGrammar: grammar }),
  consumeRevealedGrammar: () => set({ revealedGrammar: null }),
}));
