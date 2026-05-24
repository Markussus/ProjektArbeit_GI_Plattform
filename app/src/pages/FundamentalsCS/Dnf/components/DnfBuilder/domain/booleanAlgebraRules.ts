import type { TranslationKey } from "@/types/i18n";

export type BooleanAlgebraRuleId =
  | "identity"
  | "domination"
  | "idempotence"
  | "double_negation"
  | "complement"
  | "commutativity"
  | "associativity"
  | "distributivity"
  | "absorption"
  | "de_morgan";

export interface BooleanAlgebraRule {
  id: BooleanAlgebraRuleId;
  nameKey: TranslationKey;
  formulas: string[];
  exampleKey: TranslationKey;
}

export const booleanAlgebraRules: BooleanAlgebraRule[] = [
  {
    id: "identity",
    nameKey: "dnf.algebra.rules.identity.name",
    formulas: ["a ∧ 1 = a", "a ∨ 0 = a"],
    exampleKey: "dnf.algebra.rules.identity.example",
  },
  {
    id: "domination",
    nameKey: "dnf.algebra.rules.domination.name",
    formulas: ["a ∨ 1 = 1", "a ∧ 0 = 0"],
    exampleKey: "dnf.algebra.rules.domination.example",
  },
  {
    id: "idempotence",
    nameKey: "dnf.algebra.rules.idempotence.name",
    formulas: ["a ∧ a = a", "a ∨ a = a"],
    exampleKey: "dnf.algebra.rules.idempotence.example",
  },
  {
    id: "double_negation",
    nameKey: "dnf.algebra.rules.double_negation.name",
    formulas: ["¬(¬a) = a"],
    exampleKey: "dnf.algebra.rules.double_negation.example",
  },
  {
    id: "complement",
    nameKey: "dnf.algebra.rules.complement.name",
    formulas: ["a ∨ ¬a = 1", "a ∧ ¬a = 0"],
    exampleKey: "dnf.algebra.rules.complement.example",
  },
  {
    id: "commutativity",
    nameKey: "dnf.algebra.rules.commutativity.name",
    formulas: ["a ∧ b = b ∧ a", "a ∨ b = b ∨ a"],
    exampleKey: "dnf.algebra.rules.commutativity.example",
  },
  {
    id: "associativity",
    nameKey: "dnf.algebra.rules.associativity.name",
    formulas: ["(a ∧ b) ∧ c = a ∧ (b ∧ c)", "(a ∨ b) ∨ c = a ∨ (b ∨ c)"],
    exampleKey: "dnf.algebra.rules.associativity.example",
  },
  {
    id: "distributivity",
    nameKey: "dnf.algebra.rules.distributivity.name",
    formulas: [
      "a ∧ (b ∨ c) = (a ∧ b) ∨ (a ∧ c)",
      "a ∨ (b ∧ c) = (a ∨ b) ∧ (a ∨ c)",
    ],
    exampleKey: "dnf.algebra.rules.distributivity.example",
  },
  {
    id: "absorption",
    nameKey: "dnf.algebra.rules.absorption.name",
    formulas: ["a ∨ (a ∧ b) = a", "a ∧ (a ∨ b) = a"],
    exampleKey: "dnf.algebra.rules.absorption.example",
  },
  {
    id: "de_morgan",
    nameKey: "dnf.algebra.rules.de_morgan.name",
    formulas: ["¬(a ∧ b) = ¬a ∨ ¬b", "¬(a ∨ b) = ¬a ∧ ¬b"],
    exampleKey: "dnf.algebra.rules.de_morgan.example",
  },
];

export function getBooleanAlgebraRule(
  id: BooleanAlgebraRuleId,
): BooleanAlgebraRule {
  const rule = booleanAlgebraRules.find((entry) => entry.id === id);
  if (!rule) {
    throw new Error(`Unknown boolean algebra rule id: ${id}`);
  }
  return rule;
}
