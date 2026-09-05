import { BookOpen, Hash, Layers, Table2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/types/i18n";

type DnfWalkthroughExampleId =
  "lecture-expression" | "parentheses" | "dnf-intro" | "exercise-two";

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
