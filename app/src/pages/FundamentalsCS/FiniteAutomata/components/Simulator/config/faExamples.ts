import type { FAProgram } from "../domain/faTypes";

/** Which on-page section an example belongs to. */
export type FAExampleCategory = "dfa" | "nfa" | "grammarToAutomaton";

/**
 * Each example bundles the automaton definition and a sample input word that
 * is loaded into the simulator when the example is opened.
 */
export interface FAExample {
  /** Translation key for the example title */
  id: string;
  titleKey: string;
  descriptionKey: string;
  type: "DFA" | "NFA";
  category: FAExampleCategory;
  program: FAProgram;
  inputWord: string;
}

// ─── NFA: Contains substring "aba" ──────────────────────────────────────────
export const exampleContainsAba: FAExample = {
  id: "contains-aba",
  titleKey: "fa.examples.containsAba.title",
  descriptionKey: "fa.examples.containsAba.description",
  type: "NFA",
  category: "nfa",
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
};

// ─── DFA: Lecture Example (00*1) ────────────────────────────────────────────
export const exampleLecture: FAExample = {
  id: "lecture-example",
  titleKey: "fa.examples.lecture.title",
  descriptionKey: "fa.examples.lecture.description",
  type: "DFA",
  category: "dfa",
  // Partial DFA: a missing transition rejects, so no trap state is drawn.
  program: {
    type: "DFA",
    states: ["S0", "S1", "S2"],
    alphabet: ["0", "1"],
    transitions: {
      S0: { "0": ["S1"] },
      S1: { "0": ["S1"], "1": ["S2"] },
      S2: {},
    },
    startState: "S0",
    acceptStates: ["S2"],
  },
  inputWord: "001",
};

// ─── Grammar → NFA | DFA ────────────────────────────────────────────────────
export const exampleGrammar: FAExample = {
  id: "grammar-example",
  titleKey: "fa.examples.grammar.title",
  descriptionKey: "fa.examples.grammar.description",
  type: "NFA",
  category: "grammarToAutomaton",
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
};

/** All predefined examples */
export const faExamples: FAExample[] = [
  exampleLecture,
  exampleGrammar,
  exampleContainsAba,
];
