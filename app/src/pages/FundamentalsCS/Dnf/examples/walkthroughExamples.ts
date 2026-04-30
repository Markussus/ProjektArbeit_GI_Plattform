import type { TranslationKey } from "@/types/i18n";

export type DnfWalkthroughExampleId =
  | "lecture-expression"
  | "parentheses"
  | "negation"
  | "xor";

export interface DnfWalkthroughExample {
  id: DnfWalkthroughExampleId;
  titleKey: TranslationKey;
  expressionLabelKey: TranslationKey;
  expression: string;
  explanationKey: TranslationKey;
  oneRows: string[];
  terms: string[];
  canonicalDnf: string;
}

export const dnfWalkthroughExamples: DnfWalkthroughExample[] = [
  {
    id: "lecture-expression",
    titleKey: "dnf.examples.walkthroughs.lectureExpression.title",
    expressionLabelKey: "dnf.examples.labels.expression",
    expression: "a ∨ (b ∧ c)",
    explanationKey: "dnf.examples.walkthroughs.lectureExpression.explanation",
    oneRows: [
      "a=0, b=1, c=1",
      "a=1, b=0, c=0",
      "a=1, b=0, c=1",
      "a=1, b=1, c=0",
      "a=1, b=1, c=1",
    ],
    terms: [
      "¬a ∧ b ∧ c",
      "a ∧ ¬b ∧ ¬c",
      "a ∧ ¬b ∧ c",
      "a ∧ b ∧ ¬c",
      "a ∧ b ∧ c",
    ],
    canonicalDnf:
      "(¬a ∧ b ∧ c) ∨ (a ∧ ¬b ∧ ¬c) ∨ (a ∧ ¬b ∧ c) ∨ (a ∧ b ∧ ¬c) ∨ (a ∧ b ∧ c)",
  },
  {
    id: "parentheses",
    titleKey: "dnf.examples.walkthroughs.parentheses.title",
    expressionLabelKey: "dnf.examples.labels.expression",
    expression: "(a ∨ b) ∧ c",
    explanationKey: "dnf.examples.walkthroughs.parentheses.explanation",
    oneRows: ["a=0, b=1, c=1", "a=1, b=0, c=1", "a=1, b=1, c=1"],
    terms: ["¬a ∧ b ∧ c", "a ∧ ¬b ∧ c", "a ∧ b ∧ c"],
    canonicalDnf: "(¬a ∧ b ∧ c) ∨ (a ∧ ¬b ∧ c) ∨ (a ∧ b ∧ c)",
  },
  {
    id: "negation",
    titleKey: "dnf.examples.walkthroughs.negation.title",
    expressionLabelKey: "dnf.examples.labels.expression",
    expression: "¬a ∧ (b ∨ c)",
    explanationKey: "dnf.examples.walkthroughs.negation.explanation",
    oneRows: ["a=0, b=0, c=1", "a=0, b=1, c=0", "a=0, b=1, c=1"],
    terms: ["¬a ∧ ¬b ∧ c", "¬a ∧ b ∧ ¬c", "¬a ∧ b ∧ c"],
    canonicalDnf: "(¬a ∧ ¬b ∧ c) ∨ (¬a ∧ b ∧ ¬c) ∨ (¬a ∧ b ∧ c)",
  },
  {
    id: "xor",
    titleKey: "dnf.examples.walkthroughs.xor.title",
    expressionLabelKey: "dnf.examples.labels.expression",
    expression: "(¬x ∧ y) ∨ (x ∧ ¬y)",
    explanationKey: "dnf.examples.walkthroughs.xor.explanation",
    oneRows: ["x=0, y=1", "x=1, y=0"],
    terms: ["¬x ∧ y", "x ∧ ¬y"],
    canonicalDnf: "(¬x ∧ y) ∨ (x ∧ ¬y)",
  },
];
