import { describe, expect, it } from "vitest";
import {
  evaluateBooleanExpression,
  formatBooleanExpressionForDisplay,
  type BooleanExpression,
} from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanExpression";
import { parseBooleanExpression } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfParser";
import {
  countExpressionLiterals,
  factorMinimalDnf,
} from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/factorMinimalDnf";
import {
  computeMinimalDnf,
  getImplicantLiterals,
} from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/quineMcCluskey";
import {
  createTruthTableFromResults,
  generateTruthTable,
  type TruthTable,
} from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/truthTable";

describe("factorMinimalDnf", () => {
  it("pulls out a literal shared between two minterm groups", () => {
    // f = (a ∧ c) ∨ (b ∧ c) — c is shared, factoring drops one literal.
    const table = generateTruthTable(parse("(a ∧ c) ∨ (b ∧ c)"));

    const factored = factor(table);

    expect(countExpressionLiterals(factored)).toBe(3);
    // Order of operands is implementation-defined; matching either layout is
    // fine as long as the literal count and equivalence hold.
    expect(formatBooleanExpressionForDisplay(factored)).toMatch(
      /^c ∧ \((a ∨ b|b ∨ a)\)$/,
    );
    expectEquivalent(factored, table);
  });

  it("keeps the minimal DNF unchanged when no literal is shared", () => {
    // XOR-equivalence over 3 vars: each minterm has different polarities,
    // no literal appears in both groups — greedy factoring is a no-op.
    const table = generateTruthTable(
      parse("(a ∧ ¬b ∧ ¬c) ∨ (¬a ∧ b ∧ ¬c) ∨ (¬a ∧ ¬b ∧ c) ∨ (a ∧ b ∧ c)"),
    );

    const factored = factor(table);

    expect(countExpressionLiterals(factored)).toBe(12);
    expectEquivalent(factored, table);
  });

  it("factors nested common literals across multiple terms", () => {
    // f = (a ∧ b ∧ c) ∨ (a ∧ b ∧ d) ∨ (a ∧ e) — optimal factoring is
    // a ∧ ((b ∧ (c ∨ d)) ∨ e), dropping from 8 literals down to 5.
    const table = generateTruthTable(
      parse("(a ∧ b ∧ c) ∨ (a ∧ b ∧ d) ∨ (a ∧ e)"),
    );

    const factored = factor(table);

    expect(countExpressionLiterals(factored)).toBe(5);
    expectEquivalent(factored, table);
  });

  it("returns the constant true for an all-ones table", () => {
    const table = createTruthTableFromResults(
      ["a", "b"],
      [true, true, true, true],
    );

    const factored = factor(table);

    expect(factored).toEqual({ type: "constant", value: true });
  });

  it("returns the constant false for an all-zeros table", () => {
    const table = createTruthTableFromResults(
      ["a", "b"],
      [false, false, false, false],
    );

    const factored = factor(table);

    expect(factored).toEqual({ type: "constant", value: false });
  });

  it("handles a single-minterm minimal DNF without recursing", () => {
    // f is true only for a=1, b=1, c=1 — minimal DNF is the single term
    // (a ∧ b ∧ c) and there is nothing to factor.
    const table = createTruthTableFromResults(
      ["a", "b", "c"],
      [false, false, false, false, false, false, false, true],
    );

    const factored = factor(table);

    expect(countExpressionLiterals(factored)).toBe(3);
    expectEquivalent(factored, table);
  });

  it("reaches the minimum factored literal count for every 3-variable function", () => {
    const variables = ["a", "b", "c"];

    for (let functionMask = 0; functionMask < 256; functionMask += 1) {
      const results = Array.from(
        { length: 8 },
        (_, row) => (functionMask & (1 << row)) !== 0,
      );
      const table = createTruthTableFromResults(variables, results);
      const minimal = computeMinimalDnf(table);
      const factored = factorMinimalDnf(minimal, variables);

      expectEquivalent(factored, table);

      const optimum =
        minimal.type === "constant"
          ? 0
          : bruteForceMinFactorLiterals(
              minimal.implicants.map((implicant) =>
                getImplicantLiterals(implicant, variables.length).map(
                  (literal) => `${literal.variableIndex}:${literal.negated}`,
                ),
              ),
            );

      expect(countExpressionLiterals(factored)).toBe(optimum);
    }
  });
});

/**
 * Independent oracle: minimum literal count obtainable by factoring common
 * literals out of all their terms (reverse distributivity). Written without
 * memoisation and over a different representation so it cross-checks the
 * production search and cost bookkeeping rather than mirroring it.
 */
function bruteForceMinFactorLiterals(terms: string[][]): number {
  if (terms.length <= 1) {
    return terms[0]?.length ?? 0;
  }

  let best = terms.reduce((sum, term) => sum + term.length, 0);

  for (const factor of commonFactorKeys(terms)) {
    const withGroup: string[][] = [];
    const withoutGroup: string[][] = [];
    for (const term of terms) {
      if (term.includes(factor)) {
        withGroup.push(term.filter((literal) => literal !== factor));
      } else {
        withoutGroup.push(term);
      }
    }

    const withCost = withGroup.some((term) => term.length === 0)
      ? 1
      : 1 + bruteForceMinFactorLiterals(withGroup);
    const restCost =
      withoutGroup.length === 0 ? 0 : bruteForceMinFactorLiterals(withoutGroup);

    best = Math.min(best, withCost + restCost);
  }

  return best;
}

function commonFactorKeys(terms: string[][]): string[] {
  const counts = new Map<string, number>();
  for (const term of terms) {
    for (const literal of new Set(term)) {
      counts.set(literal, (counts.get(literal) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([literal]) => literal);
}

describe("countExpressionLiterals", () => {
  it("counts variable references regardless of negation", () => {
    expect(countLiterals("a")).toBe(1);
    expect(countLiterals("¬a")).toBe(1);
    expect(countLiterals("a ∧ ¬b")).toBe(2);
    expect(countLiterals("(¬a ∧ b) ∨ (a ∧ ¬b)")).toBe(4);
  });

  it("counts zero literals for constants", () => {
    expect(countExpressionLiterals({ type: "constant", value: true })).toBe(0);
    expect(countExpressionLiterals({ type: "constant", value: false })).toBe(0);
  });
});

function parse(source: string): BooleanExpression {
  const result = parseBooleanExpression(source);
  if (!result.ok) {
    throw new Error(`Expected expression to parse: ${source}`);
  }
  return result.expression;
}

function factor(table: TruthTable): BooleanExpression {
  return factorMinimalDnf(computeMinimalDnf(table), table.variables);
}

function countLiterals(source: string): number {
  return countExpressionLiterals(parse(source));
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
