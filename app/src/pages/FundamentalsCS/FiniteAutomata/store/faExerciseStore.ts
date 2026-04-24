import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FAExerciseStatus = "not_started" | "in_progress" | "completed";

export interface FAExerciseProgress {
  status: FAExerciseStatus;
  /** How many hints the user has revealed (0..hintKeys.length). */
  hintsRevealed: number;
  /** True once the user has opted to see the full reference solution. */
  solutionRevealed: boolean;
}

interface FAExerciseStore {
  activeExerciseId: string | null;
  progress: Record<string, FAExerciseProgress>;
  setActiveExercise: (id: string | null) => void;
  markInProgress: (id: string) => void;
  markCompleted: (id: string) => void;
  revealNextHint: (id: string) => void;
  revealSolution: (id: string) => void;
  resetExercise: (id: string) => void;
  getProgress: (id: string) => FAExerciseProgress;
}

const DEFAULT_PROGRESS: FAExerciseProgress = {
  status: "not_started",
  hintsRevealed: 0,
  solutionRevealed: false,
};

export const useFAExerciseStore = create<FAExerciseStore>()(
  persist(
    (set, get) => ({
      activeExerciseId: null,
      progress: {},

      setActiveExercise: (id) => set({ activeExerciseId: id }),

      markInProgress: (id) =>
        set((state) => {
          const existing = state.progress[id] ?? DEFAULT_PROGRESS;
          // Don't downgrade from completed.
          if (existing.status === "completed") return {};
          return {
            progress: {
              ...state.progress,
              [id]: { ...existing, status: "in_progress" },
            },
          };
        }),

      markCompleted: (id) =>
        set((state) => {
          const existing = state.progress[id] ?? DEFAULT_PROGRESS;
          return {
            progress: {
              ...state.progress,
              [id]: { ...existing, status: "completed" },
            },
          };
        }),

      revealNextHint: (id) =>
        set((state) => {
          const existing = state.progress[id] ?? DEFAULT_PROGRESS;
          return {
            progress: {
              ...state.progress,
              [id]: {
                ...existing,
                hintsRevealed: existing.hintsRevealed + 1,
              },
            },
          };
        }),

      revealSolution: (id) =>
        set((state) => {
          const existing = state.progress[id] ?? DEFAULT_PROGRESS;
          return {
            progress: {
              ...state.progress,
              [id]: { ...existing, solutionRevealed: true },
            },
          };
        }),

      resetExercise: (id) =>
        set((state) => {
          const next = { ...state.progress };
          delete next[id];
          return { progress: next };
        }),

      getProgress: (id) => get().progress[id] ?? DEFAULT_PROGRESS,
    }),
    {
      name: "fa-exercise-progress",
      partialize: (state) => ({ progress: state.progress }),
    },
  ),
);
