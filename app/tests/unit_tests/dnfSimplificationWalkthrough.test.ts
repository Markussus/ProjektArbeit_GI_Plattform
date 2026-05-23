import { describe, expect, it } from "vitest";
import { parseBooleanExpression } from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfParser";
import { buildDnfSimplificationWalkthrough } from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfSimplificationWalkthrough";
import {
  createTruthTableFromResults,
  generateTruthTable,
} from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/truthTable";
import type { BooleanExpression } from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanExpression";

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
    expect(walkthrough.groups).toEqual([
      {
        term: "(¬q0 ∧ q1)",
        coveredRowNumbers: [3, 4],
        eliminatedVariables: ["x"],
        literalCount: 2,
      },
      {
        term: "(q0 ∧ ¬q1)",
        coveredRowNumbers: [5, 6],
        eliminatedVariables: ["x"],
        literalCount: 2,
      },
    ]);
  });

  it("explains tautologies as a constant simplification", () => {
    const table = generateTruthTable(parse("a ∨ ¬a"));

    const walkthrough = buildDnfSimplificationWalkthrough(table);

    expect(walkthrough.constantCase).toBe("always_true");
    expect(walkthrough.groups).toEqual([]);
    expect(walkthrough.minimalForm).toBe("1");
  });

  it("explains contradictions as a constant simplification", () => {
    const table = createTruthTableFromResults(["a", "b"], [
      false,
      false,
      false,
      false,
    ]);

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
