import type { FAProgram } from "../domain/faTypes";

/**
 * Each example includes the automaton definition, a sample input word,
 * and a structured breakdown of how and why the automaton was built.
 */
export interface FAExample {
  /** Translation key for the example title */
  id: string;
  titleKey: string;
  descriptionKey: string;
  type: "DFA" | "NFA";
  program: FAProgram;
  inputWord: string;
  /** Step-by-step construction guide */
  steps: FAExampleStep[];
}

export interface FAExampleStep {
  titleKey: string;
  contentKey: string;
}

// ─── 1. Simple DFA: Strings ending in "01" ─────────────────────────────────
export const exampleEndsWith01: FAExample = {
  id: "ends-with-01",
  titleKey: "fa.examples.endsWith01.title",
  descriptionKey: "fa.examples.endsWith01.description",
  type: "DFA",
  program: {
    type: "DFA",
    states: ["s0", "s1", "s2"],
    alphabet: ["0", "1"],
    transitions: {
      s0: { "0": ["s1"], "1": ["s0"] },
      s1: { "0": ["s1"], "1": ["s2"] },
      s2: { "0": ["s1"], "1": ["s0"] },
    },
    startState: "s0",
    acceptStates: ["s2"],
  },
  inputWord: "1001",
  steps: [
    {
      titleKey: "fa.examples.endsWith01.step1Title",
      contentKey: "fa.examples.endsWith01.step1",
    },
    {
      titleKey: "fa.examples.endsWith01.step2Title",
      contentKey: "fa.examples.endsWith01.step2",
    },
    {
      titleKey: "fa.examples.endsWith01.step3Title",
      contentKey: "fa.examples.endsWith01.step3",
    },
    {
      titleKey: "fa.examples.endsWith01.step4Title",
      contentKey: "fa.examples.endsWith01.step4",
    },
  ],
};

// ─── 2. DFA: Even number of 1s ─────────────────────────────────────────────
export const exampleEvenOnes: FAExample = {
  id: "even-ones",
  titleKey: "fa.examples.evenOnes.title",
  descriptionKey: "fa.examples.evenOnes.description",
  type: "DFA",
  program: {
    type: "DFA",
    states: ["even", "odd"],
    alphabet: ["0", "1"],
    transitions: {
      even: { "0": ["even"], "1": ["odd"] },
      odd: { "0": ["odd"], "1": ["even"] },
    },
    startState: "even",
    acceptStates: ["even"],
  },
  inputWord: "1101",
  steps: [
    {
      titleKey: "fa.examples.evenOnes.step1Title",
      contentKey: "fa.examples.evenOnes.step1",
    },
    {
      titleKey: "fa.examples.evenOnes.step2Title",
      contentKey: "fa.examples.evenOnes.step2",
    },
    {
      titleKey: "fa.examples.evenOnes.step3Title",
      contentKey: "fa.examples.evenOnes.step3",
    },
  ],
};

// ─── 3. NFA: Contains substring "aba" ───────────────────────────────────────
export const exampleContainsAba: FAExample = {
  id: "contains-aba",
  titleKey: "fa.examples.containsAba.title",
  descriptionKey: "fa.examples.containsAba.description",
  type: "NFA",
  program: {
    type: "NFA",
    states: ["s0", "s1", "s2", "s3"],
    alphabet: ["a", "b"],
    transitions: {
      s0: { a: ["s0", "s1"], b: ["s0"] },
      s1: { b: ["s2"] },
      s2: { a: ["s3"] },
      s3: { a: ["s3"], b: ["s3"] },
    },
    startState: "s0",
    acceptStates: ["s3"],
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

// ─── 5. DFA: Divisible by 3 (binary) ────────────────────────────────────────
export const exampleDivisibleBy3: FAExample = {
  id: "divisible-by-3",
  titleKey: "fa.examples.divisibleBy3.title",
  descriptionKey: "fa.examples.divisibleBy3.description",
  type: "DFA",
  program: {
    type: "DFA",
    states: ["s0", "s1", "s2"],
    alphabet: ["0", "1"],
    transitions: {
      s0: { "0": ["s0"], "1": ["s1"] },
      s1: { "0": ["s2"], "1": ["s0"] },
      s2: { "0": ["s1"], "1": ["s2"] },
    },
    startState: "s0",
    acceptStates: ["s0"],
  },
  inputWord: "110",
  steps: [
    {
      titleKey: "fa.examples.divisibleBy3.step1Title",
      contentKey: "fa.examples.divisibleBy3.step1",
    },
    {
      titleKey: "fa.examples.divisibleBy3.step2Title",
      contentKey: "fa.examples.divisibleBy3.step2",
    },
    {
      titleKey: "fa.examples.divisibleBy3.step3Title",
      contentKey: "fa.examples.divisibleBy3.step3",
    },
    {
      titleKey: "fa.examples.divisibleBy3.step4Title",
      contentKey: "fa.examples.divisibleBy3.step4",
    },
  ],
};

// ─── 6. DFA: Lecture Example (0+1) ──────────────────────────────────────────
export const exampleLecture: FAExample = {
  id: "lecture-example",
  titleKey: "fa.examples.lecture.title",
  descriptionKey: "fa.examples.lecture.description",
  type: "DFA",
  program: {
    type: "DFA",
    states: ["s0", "s1", "s2", "s3"],
    alphabet: ["0", "1"],
    transitions: {
      s0: { "0": ["s1"], "1": ["s3"] },
      s1: { "0": ["s1"], "1": ["s2"] },
      s2: { "0": ["s3"], "1": ["s3"] },
      s3: { "0": ["s3"], "1": ["s3"] },
    },
    startState: "s0",
    acceptStates: ["s2"],
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

/** All predefined examples */
export const faExamples: FAExample[] = [
  exampleLecture,
  exampleEndsWith01,
  exampleEvenOnes,
  exampleContainsAba,
  exampleDivisibleBy3,
];

/** Empty automaton for building from scratch */
export const emptyFAProgram: FAProgram = {
  type: "DFA",
  states: [],
  alphabet: [],
  transitions: {},
  startState: "",
  acceptStates: [],
};
