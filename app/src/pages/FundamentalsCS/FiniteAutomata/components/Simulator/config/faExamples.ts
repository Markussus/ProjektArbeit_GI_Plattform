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
    states: ["q0", "q1", "q2"],
    alphabet: ["0", "1"],
    transitions: {
      q0: { "0": ["q1"], "1": ["q0"] },
      q1: { "0": ["q1"], "1": ["q2"] },
      q2: { "0": ["q1"], "1": ["q0"] },
    },
    startState: "q0",
    acceptStates: ["q2"],
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
    states: ["q0", "q1", "q2", "q3"],
    alphabet: ["a", "b"],
    transitions: {
      q0: { a: ["q0", "q1"], b: ["q0"] },
      q1: { b: ["q2"] },
      q2: { a: ["q3"] },
      q3: { a: ["q3"], b: ["q3"] },
    },
    startState: "q0",
    acceptStates: ["q3"],
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

// ─── 4. NFA with ε-transitions ──────────────────────────────────────────────
export const exampleEpsilonNFA: FAExample = {
  id: "epsilon-nfa",
  titleKey: "fa.examples.epsilonNfa.title",
  descriptionKey: "fa.examples.epsilonNfa.description",
  type: "NFA",
  program: {
    type: "NFA",
    states: ["q0", "q1", "q2", "q3"],
    alphabet: ["a", "b"],
    transitions: {
      q0: { ε: ["q1"], a: ["q0"] },
      q1: { b: ["q2"] },
      q2: { ε: ["q3"] },
      q3: { a: ["q3"], b: ["q3"] },
    },
    startState: "q0",
    acceptStates: ["q3"],
  },
  inputWord: "aba",
  steps: [
    {
      titleKey: "fa.examples.epsilonNfa.step1Title",
      contentKey: "fa.examples.epsilonNfa.step1",
    },
    {
      titleKey: "fa.examples.epsilonNfa.step2Title",
      contentKey: "fa.examples.epsilonNfa.step2",
    },
    {
      titleKey: "fa.examples.epsilonNfa.step3Title",
      contentKey: "fa.examples.epsilonNfa.step3",
    },
    {
      titleKey: "fa.examples.epsilonNfa.step4Title",
      contentKey: "fa.examples.epsilonNfa.step4",
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
    states: ["r0", "r1", "r2"],
    alphabet: ["0", "1"],
    transitions: {
      r0: { "0": ["r0"], "1": ["r1"] },
      r1: { "0": ["r2"], "1": ["r0"] },
      r2: { "0": ["r1"], "1": ["r2"] },
    },
    startState: "r0",
    acceptStates: ["r0"],
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

/** All predefined examples */
export const faExamples: FAExample[] = [
  exampleEndsWith01,
  exampleEvenOnes,
  exampleContainsAba,
  exampleEpsilonNFA,
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
