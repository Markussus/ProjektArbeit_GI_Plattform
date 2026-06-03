import type { SimulationMode } from "../domain/rlTypes";

export interface RLExample {
  id: string;
  titleKey: string;
  descriptionKey: string;
  mode: SimulationMode;
  grammarSource?: string;
  languageSource?: string;
  testWord?: string;
  steps: Array<{ titleKey: string; contentKey: string }>;
}

export const exampleGrammarToLanguage: RLExample = {
  id: "grammar-to-language",
  titleKey: "rl.examples.grammarToLanguage.title",
  descriptionKey: "rl.examples.grammarToLanguage.description",
  mode: "grammarToLanguage",
  grammarSource: ["S -> 0S | 1A", "A -> 0A | 1 | ε"].join("\n"),
  steps: [
    {
      titleKey: "rl.examples.grammarToLanguage.step1Title",
      contentKey: "rl.examples.grammarToLanguage.step1",
    },
  ],
};

export const exampleLanguageToGrammar: RLExample = {
  id: "language-to-grammar",
  titleKey: "rl.examples.languageToGrammar.title",
  descriptionKey: "rl.examples.languageToGrammar.description",
  mode: "languageToGrammar",
  languageSource: 'L = {"ab", "abb", "abbb"}',
  steps: [
    {
      titleKey: "rl.examples.languageToGrammar.step1Title",
      contentKey: "rl.examples.languageToGrammar.step1",
    },
    {
      titleKey: "rl.examples.languageToGrammar.step2Title",
      contentKey: "rl.examples.languageToGrammar.step2",
    },
  ],
};

export const exampleLanguageSetBuilder: RLExample = {
  id: "language-set-builder",
  titleKey: "rl.examples.languageSetBuilder.title",
  descriptionKey: "rl.examples.languageSetBuilder.description",
  mode: "languageToGrammar",
  languageSource: "L = {a^n c b^m | n, m > 0}",
  steps: [
    {
      titleKey: "rl.examples.languageSetBuilder.step1Title",
      contentKey: "rl.examples.languageSetBuilder.step1",
    },
    {
      titleKey: "rl.examples.languageSetBuilder.step2Title",
      contentKey: "rl.examples.languageSetBuilder.step2",
    },
  ],
};

export const exampleRecognizeWord: RLExample = {
  id: "recognize-word",
  titleKey: "rl.examples.recognizeWord.title",
  descriptionKey: "rl.examples.recognizeWord.description",
  mode: "recognizeWord",
  grammarSource: ["S -> 0S | 1A", "A -> 0A | 1 | ε"].join("\n"),
  testWord: "001",
  steps: [
    {
      titleKey: "rl.examples.recognizeWord.step1Title",
      contentKey: "rl.examples.recognizeWord.step1",
    },
  ],
};

export const rlExamples: RLExample[] = [
  exampleGrammarToLanguage,
  exampleLanguageToGrammar,
  exampleLanguageSetBuilder,
  exampleRecognizeWord,
];
