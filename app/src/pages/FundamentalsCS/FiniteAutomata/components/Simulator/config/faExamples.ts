import type { FAProgram } from "../domain/faTypes";

/**
 * Each example includes the automaton definition, a sample input word,
 * and a structured breakdown of how and why the automaton was built.
 */
export interface FAExampleVariant {
  type: "DFA" | "NFA";
  program: FAProgram;
  inputWord: string;
}

export interface FAExample {
  /** Translation key for the example title */
  id: string;
  titleKey: string;
  descriptionKey: string;
  type: "DFA" | "NFA";
  program: FAProgram;
  inputWord: string;
  /** When present, the card shows a second paired variant (e.g. NFA + DFA from the same grammar) */
  secondVariant?: FAExampleVariant;
  /** Step-by-step construction guide */
  steps: FAExampleStep[];
}

export interface FAExampleStep {
  titleKey: string;
  contentKey: string;
}

// ─── NFA: Contains substring "aba" ──────────────────────────────────────────
export const exampleContainsAba: FAExample = {
  id: "contains-aba",
  titleKey: "fa.examples.containsAba.title",
  descriptionKey: "fa.examples.containsAba.description",
  type: "NFA",
  program: {
    type: "NFA",
    states: ["S0", "S1", "S2", "S3"],
    alphabet: ["a", "b"],
    transitions: {
      S0: { a: ["S0", "S1"], b: ["S0"] },
      S1: { b: ["S2"] },
      S2: { a: ["S3"] },
      S3: { a: ["S3"], b: ["S3"] },
    },
    startState: "S0",
    acceptStates: ["S3"],
  },
  inputWord: "baba",
  steps: [
    {
      titleKey: "fa.examples.containsAba.step1Title",
      contentKey: "fa.examples.containsAba.step1",
    },
    {
      titleKey: "fa.examples.containsAba.step2Title",
      contentKey: "fa.examples.containsAba.step2",
    },
    {
      titleKey: "fa.examples.containsAba.step3Title",
      contentKey: "fa.examples.containsAba.step3",
    },
    {
      titleKey: "fa.examples.containsAba.step4Title",
      contentKey: "fa.examples.containsAba.step4",
    },
  ],
};

// ─── DFA: Lecture Example (0+1) ─────────────────────────────────────────────
export const exampleLecture: FAExample = {
  id: "lecture-example",
  titleKey: "fa.examples.lecture.title",
  descriptionKey: "fa.examples.lecture.description",
  type: "DFA",
  program: {
    type: "DFA",
    states: ["S0", "S1", "S2", "S3"],
    alphabet: ["0", "1"],
    transitions: {
      S0: { "0": ["S1"], "1": ["S3"] },
      S1: { "0": ["S1"], "1": ["S2"] },
      S2: { "0": ["S3"], "1": ["S3"] },
      S3: { "0": ["S3"], "1": ["S3"] },
    },
    startState: "S0",
    acceptStates: ["S2"],
  },
  inputWord: "0001",
  steps: [
    {
      titleKey: "fa.examples.lecture.step1Title",
      contentKey: "fa.examples.lecture.step1",
    },
    {
      titleKey: "fa.examples.lecture.step2Title",
      contentKey: "fa.examples.lecture.step2",
    },
  ],
};

// ─── Grammar → NFA | DFA ────────────────────────────────────────────────────
export const exampleGrammar: FAExample = {
  id: "grammar-example",
  titleKey: "fa.examples.grammar.title",
  descriptionKey: "fa.examples.grammar.description",
  type: "NFA",
  program: {
    type: "NFA",
    states: ["S", "A", "sF"],
    alphabet: ["0", "1"],
    transitions: {
      S: { "0": ["S", "A"] },
      A: { "1": ["A", "sF"] },
      sF: {},
    },
    startState: "S",
    acceptStates: ["sF"],
  },
  inputWord: "0011",
  secondVariant: {
    type: "DFA",
    program: {
      type: "DFA",
      states: ["s0", "s1", "s2", "sF"],
      alphabet: ["0", "1"],
      transitions: {
        s0: { "0": ["s1"], "1": ["sF"] },
        s1: { "0": ["s1"], "1": ["s2"] },
        s2: { "0": ["sF"], "1": ["s2"] },
        sF: { "0": ["sF"], "1": ["sF"] },
      },
      startState: "s0",
      acceptStates: ["s2"],
    },
    inputWord: "0011",
  },
  steps: [
    {
      titleKey: "fa.examples.grammar.step1Title",
      contentKey: "fa.examples.grammar.step1",
    },
    {
      titleKey: "fa.examples.grammar.step2Title",
      contentKey: "fa.examples.grammar.step2",
    },
    {
      titleKey: "fa.examples.grammar.step3Title",
      contentKey: "fa.examples.grammar.step3",
    },
  ],
};

/** All predefined examples */
export const faExamples: FAExample[] = [
  exampleLecture,
  exampleGrammar,
  exampleContainsAba,
];
