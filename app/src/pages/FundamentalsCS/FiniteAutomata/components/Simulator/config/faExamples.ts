import type { FAProgram } from "../domain/faTypes";
import { EPSILON } from "../domain/faTypes";
import { defaultDFAProgram, defaultInputWord } from "./defaultFAProgram";

/** Which on-page section an example belongs to. */
export type FAExampleCategory = "dfa" | "nfa" | "grammarToAutomaton";

/**
 * Each example bundles the automaton definition and a sample input word that
 * is loaded into the simulator when the example is opened.
 */
export interface FAExample {
  id: string;
  titleKey: string;
  descriptionKey: string;
  type: "DFA" | "NFA";
  category: FAExampleCategory;
  program: FAProgram;
  inputWord: string;
}

// ─── NFA: Contains substring "aba" ──────────────────────────────────────────
const exampleContainsAba: FAExample = {
  id: "contains-aba",
  titleKey: "finite-automata.examples.containsAba.title",
  descriptionKey: "finite-automata.examples.containsAba.description",
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

// ─── NFA: Multiple start states via ε ───────────────────────────────────────
const exampleMultipleStartStates: FAExample = {
  id: "multiple-start-states",
  titleKey: "finite-automata.examples.multipleStartStates.title",
  descriptionKey: "finite-automata.examples.multipleStartStates.description",
  type: "NFA",
  category: "nfa",
  program: {
    type: "NFA",
    states: ["S", "A0", "A1", "B0", "B1"],
    alphabet: ["a", "b"],
    transitions: {
      S: { [EPSILON]: ["A0", "B0"] },
      A0: { a: ["A1"] },
      A1: { a: ["A1"] },
      B0: { b: ["B1"] },
      B1: { b: ["B1"] },
    },
    startState: "S",
    acceptStates: ["A1", "B1"],
  },
  inputWord: "aaa",
};

// ─── DFA: Lecture Example (00*1) ────────────────────────────────────────────
const exampleLecture: FAExample = {
  id: "lecture-example",
  titleKey: "finite-automata.examples.lecture.title",
  descriptionKey: "finite-automata.examples.lecture.description",
  type: "DFA",
  category: "dfa",
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

// ─── DFA: Ends with "ab" ───────────────────────────────────────────────────
const exampleEndsWithAb: FAExample = {
  id: "ends-with-ab",
  titleKey: "finite-automata.examples.endsWithAb.title",
  descriptionKey: "finite-automata.examples.endsWithAb.description",
  type: "DFA",
  category: "dfa",
  program: defaultDFAProgram,
  inputWord: defaultInputWord,
};

// ─── Grammar → NFA | DFA ────────────────────────────────────────────────────
const exampleGrammar: FAExample = {
  id: "grammar-example",
  titleKey: "finite-automata.examples.grammar.title",
  descriptionKey: "finite-automata.examples.grammar.description",
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

export const faExamples: FAExample[] = [
  exampleLecture,
  exampleEndsWithAb,
  exampleGrammar,
  exampleContainsAba,
  exampleMultipleStartStates,
];

export function findFAExample(id: string): FAExample | undefined {
  return faExamples.find((e) => e.id === id || e.titleKey === id);
}
