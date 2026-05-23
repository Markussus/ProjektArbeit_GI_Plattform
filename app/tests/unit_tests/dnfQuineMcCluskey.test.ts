import { describe, expect, it } from "vitest";
import {
  evaluateBooleanExpression,
  type BooleanExpression,
} from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanExpression";
import {
  computeMinimalDnf,
  minimalDnfToExpression,
} from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/quineMcCluskey";
import {
  createTruthTableFromResults,
  generateTruthTable,
  type TruthTable,
} from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/truthTable";
import { parseBooleanExpression } from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfParser";

describe("Quine-McCluskey minimization", () => {
  it("collapses an unsatisfiable function to constant false", () => {
    const table = createTruthTableFromResults(["a", "b"], [false, false, false, false]);

    const minimal = computeMinimalDnf(table);

    expect(minimal.type).toBe("constant");
    if (minimal.type === "constant") {
      expect(minimal.value).toBe(false);
    }
    expect(minimal.literalCount).toBe(0);
    expect(minimal.termCount).toBe(0);
  });

  it("collapses a tautology to constant true", () => {
    const table = createTruthTableFromResults(["a", "b"], [true, true, true, true]);

    const minimal = computeMinimalDnf(table);

    expect(minimal.type).toBe("constant");
    if (minimal.type === "constant") {
      expect(minimal.value).toBe(true);
    }
    expect(minimal.literalCount).toBe(0);
  });

  it("returns a single minterm when only one row is true", () => {
    const table = generateTruthTable(parse("a ∧ b ∧ c"));

    const minimal = computeMinimalDnf(table);

    expect(minimal.termCount).toBe(1);
    expect(minimal.literalCount).toBe(3);
    expectExpressionMatchesTable(minimal, table);
  });

  it("reduces a single absorbable variable: a ∨ (a ∧ b) → a", () => {
    // Truth table for a ∨ (a ∧ b): true when a is 1 regardless of b
    const table = createTruthTableFromResults(
      ["a", "b"],
      [false, false, true, true],
    );

    const minimal = computeMinimalDnf(table);

    expect(minimal.termCount).toBe(1);
    expect(minimal.literalCount).toBe(1);
    expectExpressionMatchesTable(minimal, table);
  });

  it("reduces the XOR pattern (¬x ∧ y) ∨ (x ∧ ¬y) — already minimal", () => {
    const table = generateTruthTable(parse("(¬x ∧ y) ∨ (x ∧ ¬y)"));

    const minimal = computeMinimalDnf(table);

    expect(minimal.termCount).toBe(2);
    expect(minimal.literalCount).toBe(4);
    expectExpressionMatchesTable(minimal, table);
  });

  it("matches the lecture example: four canonical terms collapse to two", () => {
    // d0 = (¬q0 ∧ q1 ∧ ¬x) ∨ (¬q0 ∧ q1 ∧ x) ∨ (q0 ∧ ¬q1 ∧ ¬x) ∨ (q0 ∧ ¬q1 ∧ x)
    // should reduce to (¬q0 ∧ q1) ∨ (q0 ∧ ¬q1)
    const table = generateTruthTable(
      parse(
        "(¬q0 ∧ q1 ∧ ¬x) ∨ (¬q0 ∧ q1 ∧ x) ∨ (q0 ∧ ¬q1 ∧ ¬x) ∨ (q0 ∧ ¬q1 ∧ x)",
      ),
    );

    const minimal = computeMinimalDnf(table);

    expect(minimal.termCount).toBe(2);
    expect(minimal.literalCount).toBe(4);
    expectExpressionMatchesTable(minimal, table);
  });

  it("simplifies (a ∧ b) ∨ (a ∧ ¬b) to a", () => {
    const table = generateTruthTable(parse("(a ∧ b) ∨ (a ∧ ¬b)"));

    const minimal = computeMinimalDnf(table);

    expect(minimal.termCount).toBe(1);
    expect(minimal.literalCount).toBe(1);
    expectExpressionMatchesTable(minimal, table);
  });

  it("handles a 3-variable function with two essential implicants", () => {
    // f = a∧b ∨ ¬a∧c
    const table = generateTruthTable(parse("(a ∧ b) ∨ (¬a ∧ c)"));

    const minimal = computeMinimalDnf(table);

    expect(minimal.literalCount).toBeLessThanOrEqual(4);
    expectExpressionMatchesTable(minimal, table);
  });

  it("handles a 4-variable function and finds the minimum literal count", () => {
    // Classic textbook example covering several prime implicants:
    // minterms at rows 0, 1, 2, 5, 6, 7, 8, 9, 10, 14
    const results = new Array(16).fill(false);
    for (const index of [0, 1, 2, 5, 6, 7, 8, 9, 10, 14]) {
      results[index] = true;
    }
    const table = createTruthTableFromResults(["a", "b", "c", "d"], results);

    const minimal = computeMinimalDnf(table);

    expect(minimal.type).toBe("sum_of_products");
    expectExpressionMatchesTable(minimal, table);
    // Canonical DNF would have 10 terms × 4 literals = 40 literals;
    // minimal should be drastically smaller (textbook gives 8 literals).
    expect(minimal.literalCount).toBeLessThanOrEqual(10);
  });

  it("converts the minimal form back into a valid BooleanExpression", () => {
    const table = generateTruthTable(parse("(¬a ∧ b) ∨ (a ∧ ¬b) ∨ (a ∧ b)"));

    const minimal = computeMinimalDnf(table);
    const expression = minimalDnfToExpression(minimal, table.variables);

    for (const row of table.rows) {
      expect(evaluateBooleanExpression(expression, row.assignment)).toBe(
        row.result,
      );
    }
  });
});

function parse(source: string): BooleanExpression {
  const result = parseBooleanExpression(source);
  if (!result.ok) {
    throw new Error(`Expected expression to parse: ${source}`);
  }
  return result.expression;
}

function expectExpressionMatchesTable(
  minimal: ReturnType<typeof computeMinimalDnf>,
  table: TruthTable,
): void {
  const expression = minimalDnfToExpression(minimal, table.variables);

  for (const row of table.rows) {
    expect(evaluateBooleanExpression(expression, row.assignment)).toBe(
      row.result,
    );
  }
}
