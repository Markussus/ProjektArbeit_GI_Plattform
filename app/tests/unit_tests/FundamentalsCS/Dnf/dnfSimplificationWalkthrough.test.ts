import { describe, expect, it } from "vitest";
import { parseBooleanExpression } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfParser";
import { buildDnfSimplificationWalkthrough } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfSimplificationWalkthrough";
import {
  createTruthTableFromResults,
  generateTruthTable,
} from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/truthTable";
import type { BooleanExpression } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanExpression";

describe("dnfSimplificationWalkthrough", () => {
  it("explains grouped minterms for one possible minimal DNF", () => {
    const table = generateTruthTable(
      parse(
        "(¬q0 ∧ q1 ∧ ¬x) ∨ (¬q0 ∧ q1 ∧ x) ∨ (q0 ∧ ¬q1 ∧ ¬x) ∨ (q0 ∧ ¬q1 ∧ x)",
      ),
    );

    const walkthrough = buildDnfSimplificationWalkthrough(table);

    expect(walkthrough.constantCase).toBeNull();
    expect(walkthrough.trueRowNumbers).toEqual([3, 4, 5, 6]);
    expect(walkthrough.minimalForm).toBe("(¬q0 ∧ q1) ∨ (q0 ∧ ¬q1)");
    expect(walkthrough.groups).toHaveLength(2);
    expect(walkthrough.groups[0]).toMatchObject({
      term: "(¬q0 ∧ q1)",
      coveredRowNumbers: [3, 4],
      eliminatedVariables: ["x"],
      literalCount: 2,
    });
    expect(walkthrough.groups[0].derivationSteps).toEqual([
      { expression: "(¬q0 ∧ q1 ∧ ¬x) ∨ (¬q0 ∧ q1 ∧ x)" },
      {
        expression: "(¬q0 ∧ q1) ∧ (x ∨ ¬x)",
        ruleId: "distributivity",
        noteKey: "dnf.builder.exercise.derivationNotes.factorOut",
        noteVars: { variable: "x" },
      },
      {
        expression: "(¬q0 ∧ q1) ∧ 1",
        ruleId: "complement",
        noteKey: "dnf.builder.exercise.derivationNotes.complementToOne",
        noteVars: { variable: "x" },
      },
      {
        expression: "(¬q0 ∧ q1)",
        ruleId: "identity",
        noteKey: "dnf.builder.exercise.derivationNotes.andOneEqualsTerm",
      },
    ]);
    expect(walkthrough.groups[1]).toMatchObject({
      term: "(q0 ∧ ¬q1)",
      coveredRowNumbers: [5, 6],
      eliminatedVariables: ["x"],
      literalCount: 2,
    });
  });

  it("explains a group that eliminates two variables in sequence", () => {
    const table = createTruthTableFromResults(
      ["a", "b", "c"],
      [false, false, false, false, true, true, true, true],
    );

    const walkthrough = buildDnfSimplificationWalkthrough(table);

    expect(walkthrough.constantCase).toBeNull();
    expect(walkthrough.groups).toHaveLength(1);
    expect(walkthrough.groups[0]).toMatchObject({
      term: "a",
      coveredRowNumbers: [5, 6, 7, 8],
      eliminatedVariables: ["b", "c"],
      literalCount: 1,
    });
    expect(
      walkthrough.groups[0].derivationSteps.map((step) => step.ruleId),
    ).toEqual([
      undefined,
      "distributivity",
      "complement",
      "identity",
      "distributivity",
      "complement",
      "identity",
    ]);
    expect(walkthrough.groups[0].derivationSteps.at(-1)?.expression).toBe("a");
  });

  it("keeps a single minterm as-is when no variable can be eliminated", () => {
    const table = createTruthTableFromResults(
      ["a", "b", "c"],
      [false, false, false, false, false, false, false, true],
    );

    const walkthrough = buildDnfSimplificationWalkthrough(table);

    expect(walkthrough.groups).toHaveLength(1);
    expect(walkthrough.groups[0]).toMatchObject({
      coveredRowNumbers: [8],
      eliminatedVariables: [],
      literalCount: 3,
    });
    expect(walkthrough.groups[0].derivationSteps).toHaveLength(1);
    expect(walkthrough.groups[0].derivationSteps[0].ruleId).toBeUndefined();
  });

  it("explains tautologies as a constant simplification", () => {
    const table = generateTruthTable(parse("a ∨ ¬a"));

    const walkthrough = buildDnfSimplificationWalkthrough(table);

    expect(walkthrough.constantCase).toBe("always_true");
    expect(walkthrough.groups).toEqual([]);
    expect(walkthrough.minimalForm).toBe("1");
  });

  it("explains contradictions as a constant simplification", () => {
    const table = createTruthTableFromResults(
      ["a", "b"],
      [false, false, false, false],
    );

    const walkthrough = buildDnfSimplificationWalkthrough(table);

    expect(walkthrough.constantCase).toBe("always_false");
    expect(walkthrough.trueRowNumbers).toEqual([]);
    expect(walkthrough.groups).toEqual([]);
    expect(walkthrough.minimalForm).toBe("0");
  });
});

function parse(source: string): BooleanExpression {
  const result = parseBooleanExpression(source);
  if (!result.ok) {
    throw new Error(`Expected expression to parse: ${source}`);
  }
  return result.expression;
}
