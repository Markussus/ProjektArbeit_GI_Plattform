import type { LucideIcon } from "lucide-react";
import { Code, FileText, ListOrdered } from "lucide-react";
import type { ExerciseDefinition, ExerciseDifficulty } from "@/types/exercise";
import type { TranslationKey } from "@/types/i18n";
import type { SimulationMode } from "../components/Simulator/domain/rlTypes";

/**
 * The three exercise families shown on the Regular Grammar exercises page.
 * `applied` groups real-world grammars (integers, identifiers); it launches the
 * simulator in language-to-grammar mode like `languageToGrammar`.
 */
export type RLExerciseCategory =
  | "grammarToLanguage"
  | "languageToGrammar"
  | "applied";

export interface RLExerciseDefinition extends ExerciseDefinition {
  id: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  /** One-line statement of what to achieve, shown in the workspace panel. */
  goalKey: TranslationKey;
  difficulty: ExerciseDifficulty;
  icon: LucideIcon;
  /** Which of the three on-page sections this exercise belongs to. */
  category: RLExerciseCategory;
  /**
   * The monospaced problem statement shown in the workspace panel before the
   * solution is revealed: the given grammar (grammarToLanguage) or the target
   * language (languageToGrammar / applied). Notation is language-neutral, so it
   * lives here rather than in the translation files. Use "ε" for the empty word.
   */
  prompt: string;
  /** The monospaced answer revealed by "Show solution". */
  solution: string;
  /** Hints in order of increasing specificity (translation keys). */
  hintKeys: TranslationKey[];
  /** Which simulator mode the exercise opens in. */
  mode: SimulationMode;
  /**
   * The worked input loaded into the simulator when the solution is revealed
   * (arrow notation the parser understands). For grammarToLanguage this is the
   * given grammar (the simulator then enumerates the language); for
   * languageToGrammar / applied it is the language (the simulator then derives
   * a grammar).
   */
  seed: {
    grammarSource?: string;
    languageSource?: string;
    testWord?: string;
  };
}

export const rlExercises: RLExerciseDefinition[] = [
  // ── Type 1: Grammar → Language ───────────────────────────────────────────
  {
    id: "g2l-finite-binary",
    titleKey: "rl.exercises.g2lFiniteBinary.title",
    descriptionKey: "rl.exercises.g2lFiniteBinary.description",
    goalKey: "rl.exercises.g2lFiniteBinary.goal",
    difficulty: "easy",
    icon: ListOrdered,
    category: "grammarToLanguage",
    prompt: ['START = "1", A', 'A = "0", B | "1", B', 'B = "0" | "1"'].join(
      "\n",
    ),
    solution: "L = {100, 101, 110, 111}",
    hintKeys: [
      "rl.exercises.g2lFiniteBinary.hint1",
      "rl.exercises.g2lFiniteBinary.hint2",
    ],
    mode: "grammarToLanguage",
    seed: {
      grammarSource: ["START -> 1A", "A -> 0B | 1B", "B -> 0 | 1"].join("\n"),
    },
  },
  {
    id: "g2l-trailing-zero",
    titleKey: "rl.exercises.g2lTrailingZero.title",
    descriptionKey: "rl.exercises.g2lTrailingZero.description",
    goalKey: "rl.exercises.g2lTrailingZero.goal",
    difficulty: "easy",
    icon: ListOrdered,
    category: "grammarToLanguage",
    prompt: ['START = "0", A', 'A = "0", B | "1", A', 'B = "0"'].join("\n"),
    solution: "L = {000, 0100, 01100, 011100, …}",
    hintKeys: [
      "rl.exercises.g2lTrailingZero.hint1",
      "rl.exercises.g2lTrailingZero.hint2",
    ],
    mode: "grammarToLanguage",
    seed: {
      grammarSource: ["START -> 0A", "A -> 0B | 1A", "B -> 0"].join("\n"),
    },
  },
  {
    id: "g2l-epsilon-loop",
    titleKey: "rl.exercises.g2lEpsilonLoop.title",
    descriptionKey: "rl.exercises.g2lEpsilonLoop.description",
    goalKey: "rl.exercises.g2lEpsilonLoop.goal",
    difficulty: "medium",
    icon: ListOrdered,
    category: "grammarToLanguage",
    prompt: ['START = "0", A', 'A = "0", A | "1", B', 'B = "0", A | ε'].join(
      "\n",
    ),
    solution: "L = {01, 001, 0101, 0001, 00001, …}",
    hintKeys: [
      "rl.exercises.g2lEpsilonLoop.hint1",
      "rl.exercises.g2lEpsilonLoop.hint2",
    ],
    mode: "grammarToLanguage",
    seed: {
      grammarSource: ["START -> 0A", "A -> 0A | 1B", "B -> 0A | ε"].join("\n"),
    },
  },
  {
    id: "g2l-grouped",
    titleKey: "rl.exercises.g2lGrouped.title",
    descriptionKey: "rl.exercises.g2lGrouped.description",
    goalKey: "rl.exercises.g2lGrouped.goal",
    difficulty: "medium",
    icon: ListOrdered,
    category: "grammarToLanguage",
    prompt: [
      'S = "0", A',
      'A = ("0", A) | ("1", B)',
      'B = ("1", B) | "0"',
    ].join("\n"),
    solution: "L = {010, 0010, 00010, 0110, 00110, …}",
    hintKeys: [
      "rl.exercises.g2lGrouped.hint1",
      "rl.exercises.g2lGrouped.hint2",
    ],
    mode: "grammarToLanguage",
    seed: {
      grammarSource: ["S -> 0A", "A -> 0A | 1B", "B -> 1B | 0"].join("\n"),
    },
  },

  // ── Type 2: Language → Grammar ───────────────────────────────────────────
  {
    id: "l2g-zero-ones-zero",
    titleKey: "rl.exercises.l2gZeroOnesZero.title",
    descriptionKey: "rl.exercises.l2gZeroOnesZero.description",
    goalKey: "rl.exercises.l2gZeroOnesZero.goal",
    difficulty: "medium",
    icon: FileText,
    category: "languageToGrammar",
    prompt: "L = {010, 0110, 01110, 011110, …}",
    solution: ['START = "0", A', 'A = "1", B', 'B = "1", B | "0"'].join("\n"),
    hintKeys: [
      "rl.exercises.l2gZeroOnesZero.hint1",
      "rl.exercises.l2gZeroOnesZero.hint2",
    ],
    mode: "languageToGrammar",
    seed: { languageSource: 'L = {"010", "0110", "01110", "011110"}' },
  },
  {
    id: "l2g-four-words",
    titleKey: "rl.exercises.l2gFourWords.title",
    descriptionKey: "rl.exercises.l2gFourWords.description",
    goalKey: "rl.exercises.l2gFourWords.goal",
    difficulty: "medium",
    icon: FileText,
    category: "languageToGrammar",
    prompt: "L = {1011, 0011, 0111, 1111}",
    solution: [
      'START = "0", A | "1", A',
      'A = "0", B | "1", B',
      'B = "1", C',
      'C = "1"',
    ].join("\n"),
    hintKeys: [
      "rl.exercises.l2gFourWords.hint1",
      "rl.exercises.l2gFourWords.hint2",
    ],
    mode: "languageToGrammar",
    seed: { languageSource: 'L = {"1011", "0011", "0111", "1111"}' },
  },
  {
    id: "l2g-nested-zeros",
    titleKey: "rl.exercises.l2gNestedZeros.title",
    descriptionKey: "rl.exercises.l2gNestedZeros.description",
    goalKey: "rl.exercises.l2gNestedZeros.goal",
    difficulty: "hard",
    icon: FileText,
    category: "languageToGrammar",
    prompt: "L = {10101, 100101, 1001001, 1000101, …}",
    solution: [
      'START = "1", A',
      'A = "0", B',
      'B = "0", B | "1", C',
      'C = "0", D',
      'D = "0", D | "1"',
    ].join("\n"),
    hintKeys: [
      "rl.exercises.l2gNestedZeros.hint1",
      "rl.exercises.l2gNestedZeros.hint2",
      "rl.exercises.l2gNestedZeros.hint3",
    ],
    mode: "languageToGrammar",
    seed: {
      languageSource: 'L = {"10101", "100101", "1001001", "1000101"}',
    },
  },

  // ── Type 3: Applied grammars ─────────────────────────────────────────────
  {
    id: "applied-integers",
    titleKey: "rl.exercises.appliedIntegers.title",
    descriptionKey: "rl.exercises.appliedIntegers.description",
    goalKey: "rl.exercises.appliedIntegers.goal",
    difficulty: "hard",
    icon: Code,
    category: "applied",
    prompt: "e.g. 0, -1, 42, -100, 2025  (no leading zeros)",
    solution: [
      'START = "-", A | "0" | "1", B | … | "9", B',
      'A = "1", B | … | "9", B',
      'B = "0", B | "1", B | … | "9", B | ε',
    ].join("\n"),
    hintKeys: [
      "rl.exercises.appliedIntegers.hint1",
      "rl.exercises.appliedIntegers.hint2",
      "rl.exercises.appliedIntegers.hint3",
    ],
    mode: "languageToGrammar",
    seed: { languageSource: 'L = {"0", "-1", "42", "-100", "2025"}' },
  },
  {
    id: "applied-identifiers",
    titleKey: "rl.exercises.appliedIdentifiers.title",
    descriptionKey: "rl.exercises.appliedIdentifiers.description",
    goalKey: "rl.exercises.appliedIdentifiers.goal",
    difficulty: "hard",
    icon: Code,
    category: "applied",
    prompt: "e.g. x, foo, myVar, camelCase  (letters only, starts lowercase)",
    solution: [
      'START = "a", A | "b", A | … | "z", A',
      'A = "a", A | … | "z", A | "A", A | … | "Z", A | ε',
    ].join("\n"),
    hintKeys: [
      "rl.exercises.appliedIdentifiers.hint1",
      "rl.exercises.appliedIdentifiers.hint2",
    ],
    mode: "languageToGrammar",
    seed: { languageSource: 'L = {"x", "foo", "myVar", "camelCase"}' },
  },
];

/** Section order + heading/description keys used by the exercises tab. */
export const rlExerciseCategories: {
  category: RLExerciseCategory;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
}[] = [
  {
    category: "grammarToLanguage",
    titleKey: "rl.exercises.categories.grammarToLanguage.title",
    descriptionKey: "rl.exercises.categories.grammarToLanguage.description",
  },
  {
    category: "languageToGrammar",
    titleKey: "rl.exercises.categories.languageToGrammar.title",
    descriptionKey: "rl.exercises.categories.languageToGrammar.description",
  },
  {
    category: "applied",
    titleKey: "rl.exercises.categories.applied.title",
    descriptionKey: "rl.exercises.categories.applied.description",
  },
];

export function findRLExercise(id: string): RLExerciseDefinition | undefined {
  return rlExercises.find((e) => e.id === id || e.titleKey === id);
}
