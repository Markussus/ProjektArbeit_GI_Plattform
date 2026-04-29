import type { LucideIcon } from "lucide-react";
import { Binary, Flag, Hash, Sigma, Target } from "lucide-react";
import type { ExerciseDefinition, ExerciseDifficulty } from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";
import type { FAProgram } from "../components/Simulator/domain/faTypes";

export interface FAExerciseDefinition extends ExerciseDefinition {
  /** Stable id used internally for store lookups. */
  id: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  goalKey: TranslationKey;
  difficulty: ExerciseDifficulty;
  icon: LucideIcon;
  alphabet: string[];
  /** The reference automaton that defines the target language. */
  solution: FAProgram;
  /** Hints in order of increasing specificity. */
  hintKeys: TranslationKey[];
  /** Starter program loaded when the user clicks "Open in simulation". */
  starter: FAProgram;
  /** Max length for enumerated test strings. Default 4. */
  maxTestLen?: number;
  /** Example words shown alongside the revealed solution to help the user
   *  verify and explore the automaton interactively. */
  exampleWords?: {
    accept: string[];
    reject: string[];
  };
}

/* ────────────────────────────────────────────────────────────
   Helpers for authoring starter programs
   ──────────────────────────────────────────────────────────── */

function emptyStarter(alphabet: string[]): FAProgram {
  return {
    type: "DFA",
    states: ["S0"],
    alphabet,
    transitions: { S0: {} },
    startState: "S0",
    acceptStates: [],
  };
}

/* ────────────────────────────────────────────────────────────
   Exercise — Strings ending with "01"
   ──────────────────────────────────────────────────────────── */

const endsWith01Solution: FAProgram = {
  type: "DFA",
  states: ["S0", "S1", "S2"],
  alphabet: ["0", "1"],
  transitions: {
    S0: { "0": ["S1"], "1": ["S0"] },
    S1: { "0": ["S1"], "1": ["S2"] },
    S2: { "0": ["S1"], "1": ["S0"] },
  },
  startState: "S0",
  acceptStates: ["S2"],
};

/* ────────────────────────────────────────────────────────────
   Exercise — Strings ending with "00"
   ──────────────────────────────────────────────────────────── */

const endsWith00Solution: FAProgram = {
  type: "DFA",
  states: ["S0", "S1", "S2"],
  alphabet: ["0", "1"],
  transitions: {
    S0: { "0": ["S1"], "1": ["S0"] },
    S1: { "0": ["S2"], "1": ["S0"] },
    S2: { "0": ["S2"], "1": ["S0"] },
  },
  startState: "S0",
  acceptStates: ["S2"],
};

/* ────────────────────────────────────────────────────────────
   Exercise — Even number of 1s
   ──────────────────────────────────────────────────────────── */

const evenOnesSolution: FAProgram = {
  type: "DFA",
  states: ["S0", "S1"],
  alphabet: ["0", "1"],
  transitions: {
    S0: { "0": ["S0"], "1": ["S1"] },
    S1: { "0": ["S1"], "1": ["S0"] },
  },
  startState: "S0",
  acceptStates: ["S0"],
};

/* ────────────────────────────────────────────────────────────
   Exercise — No two consecutive 1s
   ──────────────────────────────────────────────────────────── */

const noConsecutiveOnesSolution: FAProgram = {
  type: "DFA",
  states: ["S0", "S1", "S2"],
  alphabet: ["0", "1"],
  transitions: {
    S0: { "0": ["S0"], "1": ["S1"] },
    S1: { "0": ["S0"], "1": ["S2"] },
    S2: { "0": ["S2"], "1": ["S2"] },
  },
  startState: "S0",
  acceptStates: ["S0", "S1"],
};

/* ────────────────────────────────────────────────────────────
   Exercise — Binary numbers divisible by 3
   ──────────────────────────────────────────────────────────── */

const divisibleBy3Solution: FAProgram = {
  type: "DFA",
  states: ["S0", "S1", "S2"],
  alphabet: ["0", "1"],
  transitions: {
    S0: { "0": ["S0"], "1": ["S1"] },
    S1: { "0": ["S2"], "1": ["S0"] },
    S2: { "0": ["S1"], "1": ["S2"] },
  },
  startState: "S0",
  acceptStates: ["S0"],
};

/* ────────────────────────────────────────────────────────────
   Registry
   ──────────────────────────────────────────────────────────── */

export const faExercises: FAExerciseDefinition[] = [
  {
    id: "ends-with-01",
    titleKey: "fa.exercisesTab.endsWith01.title",
    goalKey: "fa.exercisesTab.endsWith01.goal",
    descriptionKey: "fa.exercisesTab.endsWith01.description",
    difficulty: "easy",
    icon: Flag,
    alphabet: ["0", "1"],
    solution: endsWith01Solution,
    hintKeys: [
      "fa.exercisesTab.endsWith01.hint1",
      "fa.exercisesTab.endsWith01.hint2",
    ],
    starter: emptyStarter(["0", "1"]),
    exampleWords: {
      accept: ["1001", "01", "001", "101", "1101"],
      reject: ["0", "1", "10", "11", "100", "010"],
    },
  },
  {
    id: "ends-with-00",
    titleKey: "fa.exercisesTab.endsWith00.title",
    goalKey: "fa.exercisesTab.endsWith00.goal",
    descriptionKey: "fa.exercisesTab.endsWith00.description",
    difficulty: "easy",
    icon: Target,
    alphabet: ["0", "1"],
    solution: endsWith00Solution,
    hintKeys: [
      "fa.exercisesTab.endsWith00.hint1",
      "fa.exercisesTab.endsWith00.hint2",
    ],
    starter: emptyStarter(["0", "1"]),
    exampleWords: {
      accept: ["1100", "00", "100", "0100"],
      reject: ["0", "1", "01", "11"],
    },
  },
  {
    id: "even-ones",
    titleKey: "fa.exercisesTab.evenOnes.title",
    goalKey: "fa.exercisesTab.evenOnes.goal",
    descriptionKey: "fa.exercisesTab.evenOnes.description",
    difficulty: "medium",
    icon: Sigma,
    alphabet: ["0", "1"],
    solution: evenOnesSolution,
    hintKeys: [
      "fa.exercisesTab.evenOnes.hint1",
      "fa.exercisesTab.evenOnes.hint2",
    ],
    starter: emptyStarter(["0", "1"]),
    exampleWords: {
      accept: ["1100", "11", "00", "0110", "0000"],
      reject: ["1", "10", "111", "0010"],
    },
  },
  {
    id: "no-consecutive-ones",
    titleKey: "fa.exercisesTab.noConsecOnes.title",
    goalKey: "fa.exercisesTab.noConsecOnes.goal",
    descriptionKey: "fa.exercisesTab.noConsecOnes.description",
    difficulty: "medium",
    icon: Binary,
    alphabet: ["0", "1"],
    solution: noConsecutiveOnesSolution,
    hintKeys: [
      "fa.exercisesTab.noConsecOnes.hint1",
      "fa.exercisesTab.noConsecOnes.hint2",
    ],
    starter: emptyStarter(["0", "1"]),
    exampleWords: {
      accept: ["10101", "0", "1", "01", "010"],
      reject: ["11", "0110", "0011", "111"],
    },
  },
  {
    id: "divisible-by-3",
    titleKey: "fa.exercisesTab.divBy3.title",
    goalKey: "fa.exercisesTab.divBy3.goal",
    descriptionKey: "fa.exercisesTab.divBy3.description",
    difficulty: "hard",
    icon: Hash,
    alphabet: ["0", "1"],
    solution: divisibleBy3Solution,
    hintKeys: [
      "fa.exercisesTab.divBy3.hint1",
      "fa.exercisesTab.divBy3.hint2",
      "fa.exercisesTab.divBy3.hint3",
    ],
    starter: emptyStarter(["0", "1"]),
    maxTestLen: 5,
    exampleWords: {
      accept: ["1001", "0", "11", "110", "1100"],
      reject: ["1", "10", "100", "111", "1010"],
    },
  },
];

export function findFAExercise(id: string): FAExerciseDefinition | undefined {
  return faExercises.find((e) => e.id === id || e.titleKey === id);
}
