export type DnfExampleId = "lectureExample" | "alreadyDnf" | "xorExample";

export interface DnfExample {
  id: DnfExampleId;
  expression: string;
}

export const dnfExamples: DnfExample[] = [
  { id: "lectureExample", expression: "a ∨ (b ∧ c)" },
  { id: "alreadyDnf", expression: "(¬a ∧ ¬b ∧ ¬c) ∨ (a ∧ b ∧ c)" },
  { id: "xorExample", expression: "(¬x ∧ y) ∨ (x ∧ ¬y)" },
];
