import { describe, expect, it } from "vitest";
import {
  evaluateBooleanExpression,
  type BooleanExpression,
} from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanExpression";
import { parseBooleanExpression } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfParser";
import {
  countExpressionLiterals,
  factorMinimalDnf,
} from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/factorMinimalDnf";
import { computeSmallestBooleanExpression } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/minimalExpression";
import { computeMinimalDnf } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/quineMcCluskey";
import {
  createTruthTableFromResults,
  generateTruthTable,
  type TruthTable,
} from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/truthTable";

describe("computeSmallestBooleanExpression", () => {
  it("finds the global optimum when literal factoring stops early", () => {
    const table = generateTruthTable(parse("(a | b) & (c | d)"));
    const minimal = computeMinimalDnf(table);
    const factoredFromDnf = factorMinimalDnf(minimal, table.variables);

    expect(minimal.literalCount).toBe(8);
    expect(countExpressionLiterals(factoredFromDnf)).toBe(6);

    const result = computeSmallestBooleanExpression(table, minimal);

    expect(result.exact).toBe(true);
    expect(result.source).toBe("exact");
    expect(result.literalCount).toBe(4);
    expectEquivalent(result.expression, table);
  });

  it("keeps the existing DNF-derived fallback above four variables", () => {
    const table = generateTruthTable(
      parse("(a & c) | (b & c)"),
      ["a", "b", "c", "d", "e"],
    );

    const result = computeSmallestBooleanExpression(table);

    expect(result.exact).toBe(false);
    expect(result.source).toBe("factored_dnf");
    expect(result.literalCount).toBe(3);
    expectEquivalent(result.expression, table);
  });

  it("handles constants exactly even above four variables", () => {
    const table = createTruthTableFromResults(
      ["a", "b", "c", "d", "e"],
      Array.from({ length: 32 }, () => true),
    );

    const result = computeSmallestBooleanExpression(table);

    expect(result.exact).toBe(true);
    expect(result.source).toBe("constant");
    expect(result.literalCount).toBe(0);
    expect(result.expression).toEqual({ type: "constant", value: true });
  });
});

function parse(source: string): BooleanExpression {
  const result = parseBooleanExpression(source);
  if (!result.ok) {
    throw new Error(`Expected expression to parse: ${source}`);
  }
  return result.expression;
}

function expectEquivalent(
  expression: BooleanExpression,
  table: TruthTable,
): void {
  for (const row of table.rows) {
    expect(evaluateBooleanExpression(expression, row.assignment)).toBe(
      row.result,
    );
  }
}
