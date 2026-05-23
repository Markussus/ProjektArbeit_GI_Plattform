import {
  ArrowRight,
  Ban,
  BookOpen,
  Hash,
  Layers,
  Plus,
  Table2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/types/i18n";

export type DnfWalkthroughExampleId =
  | "lecture-expression"
  | "parentheses"
  | "negation"
  | "xor"
  | "carry"
  | "dnf-intro"
  | "exercise-two";

export type DnfWalkthroughExampleMode =
  | "expression_to_truth_table"
  | "truth_table_to_dnf";

interface DnfWalkthroughExampleBase {
  id: DnfWalkthroughExampleId;
  titleKey: TranslationKey;
  explanationKey: TranslationKey;
  icon: LucideIcon;
  oneRows: string[];
  terms: string[];
  canonicalDnf: string;
}

interface DnfExpressionExample extends DnfWalkthroughExampleBase {
  mode: "expression_to_truth_table";
  expression: string;
}

interface DnfTruthTableExample extends DnfWalkthroughExampleBase {
  mode: "truth_table_to_dnf";
  variables: string[];
  resultValues: boolean[];
}

export type DnfWalkthroughExample = DnfExpressionExample | DnfTruthTableExample;

export const dnfWalkthroughExamples: DnfWalkthroughExample[] = [
  {
    id: "lecture-expression",
    mode: "expression_to_truth_table",
    titleKey: "dnf.examples.walkthroughs.lectureExpression.title",
    explanationKey: "dnf.examples.walkthroughs.lectureExpression.explanation",
    icon: BookOpen,
    expression: "a ∨ (b ∧ c)",
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
    mode: "expression_to_truth_table",
    titleKey: "dnf.examples.walkthroughs.parentheses.title",
    explanationKey: "dnf.examples.walkthroughs.parentheses.explanation",
    icon: Table2,
    expression: "(a ∨ b) ∧ c",
    oneRows: ["a=0, b=1, c=1", "a=1, b=0, c=1", "a=1, b=1, c=1"],
    terms: ["¬a ∧ b ∧ c", "a ∧ ¬b ∧ c", "a ∧ b ∧ c"],
    canonicalDnf: "(¬a ∧ b ∧ c) ∨ (a ∧ ¬b ∧ c) ∨ (a ∧ b ∧ c)",
  },
  {
    id: "negation",
    mode: "expression_to_truth_table",
    titleKey: "dnf.examples.walkthroughs.negation.title",
    explanationKey: "dnf.examples.walkthroughs.negation.explanation",
    icon: Ban,
    expression: "¬a ∧ (b ∨ c)",
    oneRows: ["a=0, b=0, c=1", "a=0, b=1, c=0", "a=0, b=1, c=1"],
    terms: ["¬a ∧ ¬b ∧ c", "¬a ∧ b ∧ ¬c", "¬a ∧ b ∧ c"],
    canonicalDnf: "(¬a ∧ ¬b ∧ c) ∨ (¬a ∧ b ∧ ¬c) ∨ (¬a ∧ b ∧ c)",
  },
  {
    id: "xor",
    mode: "expression_to_truth_table",
    titleKey: "dnf.examples.walkthroughs.xor.title",
    explanationKey: "dnf.examples.walkthroughs.xor.explanation",
    icon: ArrowRight,
    expression: "(¬x ∧ y) ∨ (x ∧ ¬y)",
    oneRows: ["x=0, y=1", "x=1, y=0"],
    terms: ["¬x ∧ y", "x ∧ ¬y"],
    canonicalDnf: "(¬x ∧ y) ∨ (x ∧ ¬y)",
  },
  {
    id: "carry",
    mode: "expression_to_truth_table",
    titleKey: "dnf.examples.walkthroughs.carry.title",
    explanationKey: "dnf.examples.walkthroughs.carry.explanation",
    icon: Plus,
    expression: "x ∧ y",
    oneRows: ["x=1, y=1"],
    terms: ["x ∧ y"],
    canonicalDnf: "x ∧ y",
  },
  {
    id: "dnf-intro",
    mode: "truth_table_to_dnf",
    titleKey: "dnf.examples.walkthroughs.dnfIntro.title",
    explanationKey: "dnf.examples.walkthroughs.dnfIntro.explanation",
    icon: Hash,
    variables: ["a", "b", "c"],
    resultValues: [true, false, false, false, false, false, false, true],
    oneRows: ["a=0, b=0, c=0", "a=1, b=1, c=1"],
    terms: ["¬a ∧ ¬b ∧ ¬c", "a ∧ b ∧ c"],
    canonicalDnf: "(¬a ∧ ¬b ∧ ¬c) ∨ (a ∧ b ∧ c)",
  },
  {
    id: "exercise-two",
    mode: "truth_table_to_dnf",
    titleKey: "dnf.examples.walkthroughs.exerciseTwo.title",
    explanationKey: "dnf.examples.walkthroughs.exerciseTwo.explanation",
    icon: Layers,
    variables: ["a", "b", "c"],
    resultValues: [false, false, true, false, true, true, false, false],
    oneRows: ["a=0, b=1, c=0", "a=1, b=0, c=0", "a=1, b=0, c=1"],
    terms: ["¬a ∧ b ∧ ¬c", "a ∧ ¬b ∧ ¬c", "a ∧ ¬b ∧ c"],
    canonicalDnf: "(¬a ∧ b ∧ ¬c) ∨ (a ∧ ¬b ∧ ¬c) ∨ (a ∧ ¬b ∧ c)",
  },
];

export function getDnfWalkthroughExample(
  id?: string | null,
): DnfWalkthroughExample | null {
  if (!id) {
    return null;
  }

  return (
    dnfWalkthroughExamples.find((example) => exampleMatchesId(example, id)) ??
    null
  );
}

function exampleMatchesId(example: DnfWalkthroughExample, id: string): boolean {
  return example.id === id || example.titleKey === id;
}
