import type { LucideIcon } from "lucide-react";
import { Target, Workflow } from "lucide-react";
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
  /**
   * Optional regular grammar shown as a monospaced prompt in the workspace
   * panel — used by "construct an automaton from a grammar" exercises. Use "ε"
   * for the empty word.
   */
  grammar?: string;
  /** The reference automaton that defines the target language. */
  solution: FAProgram;
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
    icon: Target,
    alphabet: ["0", "1"],
    solution: endsWith01Solution,
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
    difficulty: "easy",
    icon: Target,
    alphabet: ["0", "1"],
    solution: evenOnesSolution,
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
    icon: Target,
    alphabet: ["0", "1"],
    solution: noConsecutiveOnesSolution,
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
    icon: Target,
    alphabet: ["0", "1"],
    solution: divisibleBy3Solution,
    starter: emptyStarter(["0", "1"]),
    maxTestLen: 5,
    exampleWords: {
      accept: ["1001", "0", "11", "110", "1100"],
      reject: ["1", "10", "100", "111", "1010"],
    },
  },
];

/* ════════════════════════════════════════════════════════════
   Constructing a finite automaton from a regular grammar
   ════════════════════════════════════════════════════════════ */

// L = 1 0ⁿ 1 (n ≥ 0): a 1, any number of 0s, a closing 1.
const grammarOnesSolution: FAProgram = {
  type: "DFA",
  states: ["S0", "S1", "S2", "E"],
  alphabet: ["0", "1"],
  transitions: {
    S0: { "0": ["E"], "1": ["S1"] },
    S1: { "0": ["S1"], "1": ["S2"] },
    S2: { "0": ["E"], "1": ["E"] },
    E: { "0": ["E"], "1": ["E"] },
  },
  startState: "S0",
  acceptStates: ["S2"],
};

// L = (0011)⁺: one or more repetitions of the block 0011.
const grammar0011Solution: FAProgram = {
  type: "DFA",
  states: ["S0", "S1", "S2", "S3", "S4", "E"],
  alphabet: ["0", "1"],
  transitions: {
    S0: { "0": ["S1"], "1": ["E"] },
    S1: { "0": ["S2"], "1": ["E"] },
    S2: { "0": ["E"], "1": ["S3"] },
    S3: { "0": ["E"], "1": ["S4"] },
    S4: { "0": ["S1"], "1": ["E"] },
    E: { "0": ["E"], "1": ["E"] },
  },
  startState: "S0",
  acceptStates: ["S4"],
};

// L = 1 1 0ⁿ (n ≥ 0): exactly two 1s followed by any number of 0s.
const grammarTwoOnesZerosSolution: FAProgram = {
  type: "DFA",
  states: ["S0", "S1", "S2", "E"],
  alphabet: ["0", "1"],
  transitions: {
    S0: { "0": ["E"], "1": ["S1"] },
    S1: { "0": ["E"], "1": ["S2"] },
    S2: { "0": ["S2"], "1": ["E"] },
    E: { "0": ["E"], "1": ["E"] },
  },
  startState: "S0",
  acceptStates: ["S2"],
};

// L = 1ⁿ 0 (n ≥ 1): one or more 1s followed by a single 0.
const grammarOnesZeroSolution: FAProgram = {
  type: "DFA",
  states: ["S0", "S1", "S2", "E"],
  alphabet: ["0", "1"],
  transitions: {
    S0: { "0": ["E"], "1": ["S1"] },
    S1: { "0": ["S2"], "1": ["S1"] },
    S2: { "0": ["E"], "1": ["E"] },
    E: { "0": ["E"], "1": ["E"] },
  },
  startState: "S0",
  acceptStates: ["S2"],
};

/**
 * "Construct a DFA from a regular grammar" exercises. They share the FA
 * exercise machinery (workspace panel, hints, Show solution loads the
 * reference automaton) but additionally carry a `grammar` prompt.
 */
export const faGrammarToAutomatonExercises: FAExerciseDefinition[] = [
  {
    id: "g2a-two-ones-zeros",
    titleKey: "fa.exercisesTab.grammarTwoOnesZeros.title",
    goalKey: "fa.exercisesTab.grammarTwoOnesZeros.goal",
    descriptionKey: "fa.exercisesTab.grammarTwoOnesZeros.description",
    difficulty: "easy",
    icon: Workflow,
    alphabet: ["0", "1"],
    grammar: ['START = "1", A;', 'A = "1", B;', 'B = "0", B | ε;'].join("\n"),
    solution: grammarTwoOnesZerosSolution,
    starter: emptyStarter(["0", "1"]),
    exampleWords: {
      accept: ["11", "110", "1100", "11000"],
      reject: ["1", "0", "10", "111", "11001"],
    },
  },
  {
    id: "g2a-ones",
    titleKey: "fa.exercisesTab.grammarOnes.title",
    goalKey: "fa.exercisesTab.grammarOnes.goal",
    descriptionKey: "fa.exercisesTab.grammarOnes.description",
    difficulty: "medium",
    icon: Workflow,
    alphabet: ["0", "1"],
    grammar: ['START = "1", A;', 'A = "0", A | "1", B;', "B = ε;"].join("\n"),
    solution: grammarOnesSolution,
    starter: emptyStarter(["0", "1"]),
    exampleWords: {
      accept: ["11", "101", "1001", "10001"],
      reject: ["1", "0", "10", "111", "01"],
    },
  },
  {
    id: "g2a-0011",
    titleKey: "fa.exercisesTab.grammar0011.title",
    goalKey: "fa.exercisesTab.grammar0011.goal",
    descriptionKey: "fa.exercisesTab.grammar0011.description",
    difficulty: "hard",
    icon: Workflow,
    alphabet: ["0", "1"],
    grammar: [
      'START = "0", A;',
      'A = "0", B;',
      'B = "1", C;',
      'C = "1", D;',
      'D = "0", A | ε;',
    ].join("\n"),
    solution: grammar0011Solution,
    starter: emptyStarter(["0", "1"]),
    maxTestLen: 8,
    exampleWords: {
      accept: ["0011", "00110011"],
      reject: ["", "0", "001", "00110", "01"],
    },
  },
  {
    id: "g2a-ones-zero",
    titleKey: "fa.exercisesTab.grammarOnesZero.title",
    goalKey: "fa.exercisesTab.grammarOnesZero.goal",
    descriptionKey: "fa.exercisesTab.grammarOnesZero.description",
    difficulty: "easy",
    icon: Workflow,
    alphabet: ["0", "1"],
    grammar: ['START = "1", A;', 'A = "1", A | "0", B;', "B = ε;"].join("\n"),
    solution: grammarOnesZeroSolution,
    starter: emptyStarter(["0", "1"]),
    exampleWords: {
      accept: ["10", "110", "1110"],
      reject: ["1", "0", "01", "100", "11"],
    },
  },
];

/** Every FA exercise, regardless of which section renders it. */
export const allFAExercises: FAExerciseDefinition[] = [
  ...faExercises,
  ...faGrammarToAutomatonExercises,
];

export function findFAExercise(id: string): FAExerciseDefinition | undefined {
  return allFAExercises.find((e) => e.id === id || e.titleKey === id);
}
