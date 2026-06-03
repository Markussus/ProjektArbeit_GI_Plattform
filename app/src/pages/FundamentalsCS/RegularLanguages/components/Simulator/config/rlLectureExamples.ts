import type { TranslationKey } from "@/types/i18n";

/**
 * Introductory "Lecture Basics" worked examples shown on the Regular Grammars
 * Examples tab. Each task pairs a prompt (a grammar to read, or a language to
 * describe) with a hidden solution. The formal notation is language-neutral, so
 * it lives here as constants; only prose lives in the translation files. Use
 * "ε" for the empty word.
 */
export type RLLectureCategory = "grammarToLanguage" | "languageToGrammar";

export interface RLLectureExample {
  id: string;
  titleKey: TranslationKey;
  category: RLLectureCategory;
  /** Monospaced prompt: the given grammar (G→L) or target language (L→G). */
  prompt: string;
  /** Optional prose shown under the prompt (e.g. the target-language wording). */
  promptNoteKey?: TranslationKey;
  /** Monospaced answer revealed by "Show Solution": language (G→L) or grammar (L→G). */
  solution: string;
  /** Optional prose shown under the revealed solution. */
  solutionNoteKey?: TranslationKey;
}

export const rlLectureExamples: RLLectureExample[] = [
  {
    id: "lecture-g2l-1",
    titleKey: "rl.lectureBasics.task1.title",
    category: "grammarToLanguage",
    prompt: ['S = "0", A', 'A = ("0", A) | "1"'].join("\n"),
    solution: "L = {01, 001, 0001, …}",
    solutionNoteKey: "rl.lectureBasics.task1.note",
  },
  {
    id: "lecture-g2l-2",
    titleKey: "rl.lectureBasics.task2.title",
    category: "grammarToLanguage",
    prompt: [
      'S = ("0", A) | ("1", B)',
      'A = ("1", B) | ε',
      'B = ("0", A) | ε',
    ].join("\n"),
    solution: "L = {0, 1, 01, 10, 010, 101, 0101, …}",
    solutionNoteKey: "rl.lectureBasics.task2.note",
  },
  {
    id: "lecture-l2g-1",
    titleKey: "rl.lectureBasics.task3.title",
    category: "languageToGrammar",
    prompt: "L = {010, 0010, 00100, 00010, 000100, …}",
    promptNoteKey: "rl.lectureBasics.task3.note",
    solution: ['S = "0", S | "0", A', 'A = "1", B', 'B = "0", B | "0"'].join(
      "\n",
    ),
  },
];
