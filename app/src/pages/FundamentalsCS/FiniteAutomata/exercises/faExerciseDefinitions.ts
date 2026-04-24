import type { FAProgram } from "../components/Simulator/domain/faTypes";

export type FADifficulty = 1 | 2 | 3;

export interface FAExerciseDefinition {
  /** Stable id — used for localStorage progress keys. */
  id: string;
  titleKey: string;
  goalKey: string;
  descriptionKey: string;
  difficulty: FADifficulty;
  alphabet: string[];
  /** The reference automaton that defines the target language. */
  solution: FAProgram;
  /** Hints in order of increasing specificity. */
  hintKeys: string[];
  /** Starter program loaded when the user clicks "Start". */
  starter: FAProgram;
  /** Max length for enumerated test strings. Default 4. */
  maxTestLen?: number;
}

/* ────────────────────────────────────────────────────────────
   Helpers for authoring starter programs
   ──────────────────────────────────────────────────────────── */

function emptyStarter(alphabet: string[]): FAProgram {
  return {
    type: "DFA",
    states: ["q0"],
    alphabet,
    transitions: { q0: {} },
    startState: "q0",
    acceptStates: [],
  };
}

/* ────────────────────────────────────────────────────────────
   Exercise 1 — ⭐ Strings ending with "00"
   ──────────────────────────────────────────────────────────── */

const endsWith00Solution: FAProgram = {
  type: "DFA",
  states: ["q0", "q1", "q2"],
  alphabet: ["0", "1"],
  transitions: {
    q0: { "0": ["q1"], "1": ["q0"] },
    q1: { "0": ["q2"], "1": ["q0"] },
    q2: { "0": ["q2"], "1": ["q0"] },
  },
  startState: "q0",
  acceptStates: ["q2"],
};

/* ────────────────────────────────────────────────────────────
   Exercise 2 — ⭐⭐ Even number of 1s
   ──────────────────────────────────────────────────────────── */

const evenOnesSolution: FAProgram = {
  type: "DFA",
  states: ["even", "odd"],
  alphabet: ["0", "1"],
  transitions: {
    even: { "0": ["even"], "1": ["odd"] },
    odd: { "0": ["odd"], "1": ["even"] },
  },
  startState: "even",
  acceptStates: ["even"],
};

/* ────────────────────────────────────────────────────────────
   Exercise 3 — ⭐⭐ No two consecutive 1s
   ──────────────────────────────────────────────────────────── */

const noConsecutiveOnesSolution: FAProgram = {
  type: "DFA",
  states: ["ok", "justSawOne", "dead"],
  alphabet: ["0", "1"],
  transitions: {
    ok: { "0": ["ok"], "1": ["justSawOne"] },
    justSawOne: { "0": ["ok"], "1": ["dead"] },
    dead: { "0": ["dead"], "1": ["dead"] },
  },
  startState: "ok",
  acceptStates: ["ok", "justSawOne"],
};

/* ────────────────────────────────────────────────────────────
   Exercise 4 — ⭐⭐⭐ Binary numbers divisible by 3
   ──────────────────────────────────────────────────────────── */

const divisibleBy3Solution: FAProgram = {
  type: "DFA",
  states: ["r0", "r1", "r2"],
  alphabet: ["0", "1"],
  transitions: {
    r0: { "0": ["r0"], "1": ["r1"] },
    r1: { "0": ["r2"], "1": ["r0"] },
    r2: { "0": ["r1"], "1": ["r2"] },
  },
  startState: "r0",
  acceptStates: ["r0"],
};

/* ────────────────────────────────────────────────────────────
   Registry
   ──────────────────────────────────────────────────────────── */

export const faExercises: FAExerciseDefinition[] = [
  {
    id: "ends-with-00",
    titleKey: "fa.exercisesTab.endsWith00.title",
    goalKey: "fa.exercisesTab.endsWith00.goal",
    descriptionKey: "fa.exercisesTab.endsWith00.description",
    difficulty: 1,
    alphabet: ["0", "1"],
    solution: endsWith00Solution,
    hintKeys: [
      "fa.exercisesTab.endsWith00.hint1",
      "fa.exercisesTab.endsWith00.hint2",
    ],
    starter: emptyStarter(["0", "1"]),
  },
  {
    id: "even-ones",
    titleKey: "fa.exercisesTab.evenOnes.title",
    goalKey: "fa.exercisesTab.evenOnes.goal",
    descriptionKey: "fa.exercisesTab.evenOnes.description",
    difficulty: 2,
    alphabet: ["0", "1"],
    solution: evenOnesSolution,
    hintKeys: [
      "fa.exercisesTab.evenOnes.hint1",
      "fa.exercisesTab.evenOnes.hint2",
    ],
    starter: emptyStarter(["0", "1"]),
  },
  {
    id: "no-consecutive-ones",
    titleKey: "fa.exercisesTab.noConsecOnes.title",
    goalKey: "fa.exercisesTab.noConsecOnes.goal",
    descriptionKey: "fa.exercisesTab.noConsecOnes.description",
    difficulty: 2,
    alphabet: ["0", "1"],
    solution: noConsecutiveOnesSolution,
    hintKeys: [
      "fa.exercisesTab.noConsecOnes.hint1",
      "fa.exercisesTab.noConsecOnes.hint2",
    ],
    starter: emptyStarter(["0", "1"]),
  },
  {
    id: "divisible-by-3",
    titleKey: "fa.exercisesTab.divBy3.title",
    goalKey: "fa.exercisesTab.divBy3.goal",
    descriptionKey: "fa.exercisesTab.divBy3.description",
    difficulty: 3,
    alphabet: ["0", "1"],
    solution: divisibleBy3Solution,
    hintKeys: [
      "fa.exercisesTab.divBy3.hint1",
      "fa.exercisesTab.divBy3.hint2",
      "fa.exercisesTab.divBy3.hint3",
    ],
    starter: emptyStarter(["0", "1"]),
    maxTestLen: 5,
  },
];

export function findFAExercise(id: string): FAExerciseDefinition | undefined {
  return faExercises.find((e) => e.id === id);
}
