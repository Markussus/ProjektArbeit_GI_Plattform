import type { LucideIcon } from "lucide-react";
// One shared icon per example type, matching the exercise icons:
// `ListOrdered` = Grammar → Language, `FileText` = Language → Grammar,
// `SearchCheck` = Recognize Word.
import { FileText, ListOrdered, SearchCheck } from "lucide-react";
import type { SimulationMode } from "../domain/rlTypes";

/**
 * The example sections shown on the Regular Languages examples page. They mirror
 * the exercise categories so both tabs read the same way: each category is one
 * task the learner can practise. Both language → grammar examples (an explicit
 * word list and a compact pattern) live under `languageToGrammar`.
 */
export type RLExampleCategory =
  | "grammarToLanguage"
  | "languageToGrammar"
  | "recognizeWord";

export interface RLExample {
  id: string;
  titleKey: string;
  descriptionKey: string;
  mode: SimulationMode;
  /** Which on-page section this example belongs to. */
  category: RLExampleCategory;
  /** Card icon, chosen to reflect what the example demonstrates. */
  icon: LucideIcon;
  grammarSource?: string;
  languageSource?: string;
  testWord?: string;
}

export const exampleGrammarToLanguage: RLExample = {
  id: "grammar-to-language",
  titleKey: "regular-languages.examples.grammarToLanguage.title",
  descriptionKey: "regular-languages.examples.grammarToLanguage.description",
  mode: "grammarToLanguage",
  category: "grammarToLanguage",
  icon: ListOrdered,
  grammarSource: ["S -> 0S | 1A", "A -> 0A | 1 | ε"].join("\n"),
};

export const exampleLanguageToGrammar: RLExample = {
  id: "language-to-grammar",
  titleKey: "regular-languages.examples.languageToGrammar.title",
  descriptionKey: "regular-languages.examples.languageToGrammar.description",
  mode: "languageToGrammar",
  category: "languageToGrammar",
  icon: FileText,
  languageSource: 'L = {"ab", "abb", "abbb"}',
};

export const exampleLanguageSetBuilder: RLExample = {
  id: "language-set-builder",
  titleKey: "regular-languages.examples.languageSetBuilder.title",
  descriptionKey: "regular-languages.examples.languageSetBuilder.description",
  mode: "languageToGrammar",
  category: "languageToGrammar",
  icon: FileText,
  languageSource: "L = {a^n c b^m | n, m > 0}",
};

export const exampleRecognizeWord: RLExample = {
  id: "recognize-word",
  titleKey: "regular-languages.examples.recognizeWord.title",
  descriptionKey: "regular-languages.examples.recognizeWord.description",
  mode: "recognizeWord",
  category: "recognizeWord",
  icon: SearchCheck,
  grammarSource: ["S -> 0S | 1A", "A -> 0A | 1 | ε"].join("\n"),
  testWord: "001",
};

/**
 * Introductory worked examples that used to live in the separate "Lecture
 * Basics" section. They now share the categorised example style: load the given
 * grammar/language into the simulator to reveal the worked result.
 */
export const exampleLectureGrammar1: RLExample = {
  id: "lecture-g2l-1",
  titleKey: "regular-languages.examples.lectureGrammar1.title",
  descriptionKey: "regular-languages.examples.lectureGrammar1.description",
  mode: "grammarToLanguage",
  category: "grammarToLanguage",
  icon: ListOrdered,
  grammarSource: ["S -> 0A", "A -> 0A | 1"].join("\n"),
};

export const exampleLectureGrammar2: RLExample = {
  id: "lecture-g2l-2",
  titleKey: "regular-languages.examples.lectureGrammar2.title",
  descriptionKey: "regular-languages.examples.lectureGrammar2.description",
  mode: "grammarToLanguage",
  category: "grammarToLanguage",
  icon: ListOrdered,
  grammarSource: ["S -> 0A | 1B", "A -> 1B | ε", "B -> 0A | ε"].join("\n"),
};

/**
 * The word list shown by default in the Language → Grammar simulator, exposed
 * here so learners can reopen it from the Examples tab.
 */
export const exampleLanguageDefault: RLExample = {
  id: "language-default",
  titleKey: "regular-languages.examples.languageDefault.title",
  descriptionKey: "regular-languages.examples.languageDefault.description",
  mode: "languageToGrammar",
  category: "languageToGrammar",
  icon: FileText,
  languageSource: 'L = {"010", "0010", "00100", ..}',
};

export const exampleLectureLanguage1: RLExample = {
  id: "lecture-l2g-1",
  titleKey: "regular-languages.examples.lectureLanguage1.title",
  descriptionKey: "regular-languages.examples.lectureLanguage1.description",
  mode: "languageToGrammar",
  category: "languageToGrammar",
  icon: FileText,
  languageSource: 'L = {"010", "0010", "00100", "00010", "000100"}',
};

export const rlExamples: RLExample[] = [
  exampleGrammarToLanguage,
  exampleLectureGrammar1,
  exampleLectureGrammar2,
  exampleLanguageToGrammar,
  exampleLanguageSetBuilder,
  exampleLanguageDefault,
  exampleLectureLanguage1,
  exampleRecognizeWord,
];
