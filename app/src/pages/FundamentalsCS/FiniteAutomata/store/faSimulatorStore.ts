import { create } from "zustand";
import type { FAProgram } from "../components/Simulator/domain/faTypes";

/**
 * - activeExerciseId: routing flag indicating which exercise (if any) is
 *   open in the simulator.
 * - pendingProgram / pendingInputWord: a program (and seed input) to load
 *   into the simulator, set by ExamplesTab or by the exercise panel when
 *   the solution is revealed.
 * - pendingInputWordOverride: input-only update; used by the exercise
 *   panel's "Try these words" buttons so they don't re-load the program.
 * - studentProgram: a live snapshot of what the simulator is currently
 *   editing/running, exposed so the lifted exercise panel can validate
 *   against it.
 */
interface FASimulatorStore {
  activeExerciseId: string | null;
  pendingProgram: FAProgram | null;
  pendingInputWord: string;
  pendingInputWordOverride: string | null;
  studentProgram: FAProgram | null;

  /**
   * The learner's in-progress automaton for each exercise, keyed by exercise
   * id. Held in the store so it survives leaving and re-entering exercise mode
   * (re-opening an exercise restores this instead of the blank starter);
   * cleared explicitly by "Reset all exercises".
   */
  exerciseDrafts: Record<string, FAProgram>;

  setActiveExercise: (id: string | null) => void;
  loadExample: (program: FAProgram, inputWord: string) => void;
  consumePending: () => void;
  setPendingInputWord: (word: string) => void;
  consumePendingInputWord: () => void;
  setStudentProgram: (program: FAProgram | null) => void;
  setExerciseDraft: (exerciseId: string, program: FAProgram) => void;
  clearExerciseDraft: (exerciseId: string) => void;
  clearExerciseDrafts: () => void;
}

export const useFASimulatorStore = create<FASimulatorStore>((set) => ({
  activeExerciseId: null,
  pendingProgram: null,
  pendingInputWord: "",
  pendingInputWordOverride: null,
  studentProgram: null,
  exerciseDrafts: {},

  setActiveExercise: (id) => set({ activeExerciseId: id }),

  loadExample: (program, inputWord) =>
    set({ pendingProgram: program, pendingInputWord: inputWord }),
  consumePending: () => set({ pendingProgram: null, pendingInputWord: "" }),

  setPendingInputWord: (word) => set({ pendingInputWordOverride: word }),
  consumePendingInputWord: () => set({ pendingInputWordOverride: null }),

  setStudentProgram: (program) => set({ studentProgram: program }),
  setExerciseDraft: (exerciseId, program) =>
    set((state) => ({
      exerciseDrafts: { ...state.exerciseDrafts, [exerciseId]: program },
    })),
  clearExerciseDraft: (exerciseId) =>
    set((state) => {
      const exerciseDrafts = { ...state.exerciseDrafts };
      delete exerciseDrafts[exerciseId];
      return { exerciseDrafts };
    }),
  clearExerciseDrafts: () => set({ exerciseDrafts: {} }),
}));
