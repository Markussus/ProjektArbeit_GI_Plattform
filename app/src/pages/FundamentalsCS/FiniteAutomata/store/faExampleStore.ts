import { create } from "zustand";
import type { FAProgram } from "../components/Simulator/domain/faTypes";

interface FAExampleStore {
  /** The program to load from an example (set by ExamplesTab, consumed by SimulationTab) */
  pendingProgram: FAProgram | null;
  pendingInputWord: string;
  /** Load an example — stores the program and input word for the simulator to pick up */
  loadExample: (program: FAProgram, inputWord: string) => void;
  /** Consume the pending example (after the simulator has picked it up) */
  consumePending: () => void;
}

export const useFAExampleStore = create<FAExampleStore>((set) => ({
  pendingProgram: null,
  pendingInputWord: "",
  loadExample: (program, inputWord) =>
    set({ pendingProgram: program, pendingInputWord: inputWord }),
  consumePending: () => set({ pendingProgram: null, pendingInputWord: "" }),
}));
