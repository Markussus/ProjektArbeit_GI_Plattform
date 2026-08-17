import { describe, expect, it } from "vitest";
import {
  evaluateBooleanExpression,
  type BooleanExpression,
} from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanExpression";
import {
  computeMinimalDnf,
  minimalDnfToExpression,
} from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/quineMcCluskey";
import {
  createTruthTableFromResults,
  generateTruthTable,
  type TruthTable,
} from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/truthTable";
import { parseBooleanExpression } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfParser";

describe("Quine-McCluskey minimization", () => {
  it("collapses an unsatisfiable function to constant false", () => {
    const table = createTruthTableFromResults(
      ["a", "b"],
      [false, false, false, false],
    );

    const minimal = computeMinimalDnf(table);

    expect(minimal.type).toBe("constant");
    if (minimal.type === "constant") {
      expect(minimal.value).toBe(false);
    }
    expect(minimal.literalCount).toBe(0);
    expect(minimal.termCount).toBe(0);
  });

  it("collapses a tautology to constant true", () => {
    const table = createTruthTableFromResults(
      ["a", "b"],
      [true, true, true, true],
    );

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

  it("reaches the exact minimum literal count for every 3-variable function", () => {
    // Exhaustively compares the QMC result against an independent brute-force
    // minimum sum-of-products oracle for all 256 functions of 3 variables. This
    // is what guards against the old greedy cover overshooting the optimum.
    const variables = ["a", "b", "c"];

    for (let functionMask = 0; functionMask < 256; functionMask += 1) {
      const results = Array.from(
        { length: 8 },
        (_, row) => (functionMask & (1 << row)) !== 0,
      );
      const table = createTruthTableFromResults(variables, results);

      const minimal = computeMinimalDnf(table);

      expect(minimal.literalCount).toBe(bruteForceMinSopLiterals(results, 3));
      expectExpressionMatchesTable(minimal, table);
    }
  });
});

/**
 * Independent oracle: the minimum total literal count of any sum-of-products
 * form for the given truth-table results. Enumerates every product term that is
 * an implicant (covers only 1-rows) and solves the exact minimum-cost cover by
 * memoised recursion. Deliberately written differently from the production
 * algorithm so it cross-checks rather than mirrors it.
 */
function bruteForceMinSopLiterals(
  results: boolean[],
  variableCount: number,
): number {
  const rowCount = results.length;
  const minterms = results.flatMap((value, row) => (value ? [row] : []));

  if (minterms.length === 0 || minterms.length === rowCount) {
    return 0;
  }

  const implicants = enumerateImplicants(results, variableCount);
  const fullTarget = minterms.reduce((mask, row) => mask | (1 << row), 0);
  const memo = new Map<number, number>();

  const solve = (remaining: number): number => {
    if (remaining === 0) {
      return 0;
    }
    const cached = memo.get(remaining);
    if (cached !== undefined) {
      return cached;
    }

    // Cover the lowest still-uncovered minterm; branch over every implicant
    // that includes it.
    const firstRow = remaining & -remaining;
    let best = Number.POSITIVE_INFINITY;

    for (const implicant of implicants) {
      if ((implicant.cover & firstRow) === 0) {
        continue;
      }
      best = Math.min(
        best,
        implicant.literals + solve(remaining & ~implicant.cover),
      );
    }

    memo.set(remaining, best);
    return best;
  };

  return solve(fullTarget);
}

interface OracleImplicant {
  cover: number;
  literals: number;
}

/** All product terms that cover only 1-rows, deduped to the cheapest per cover. */
function enumerateImplicants(
  results: boolean[],
  variableCount: number,
): OracleImplicant[] {
  const rowCount = results.length;
  const cheapestByCover = new Map<number, number>();

  // Each variable is fixed to 0, fixed to 1, or "don't care" — base-3 digits.
  const termCount = 3 ** variableCount;
  for (let term = 0; term < termCount; term += 1) {
    const fixed: Array<0 | 1 | null> = [];
    let digits = term;
    let literals = 0;
    for (let position = 0; position < variableCount; position += 1) {
      const digit = digits % 3;
      digits = Math.floor(digits / 3);
      if (digit === 0) {
        fixed.push(null);
      } else {
        fixed.push(digit === 1 ? 0 : 1);
        literals += 1;
      }
    }

    let cover = 0;
    let valid = literals > 0;
    for (let row = 0; row < rowCount && valid; row += 1) {
      const matches = fixed.every((bit, variableIndex) => {
        if (bit === null) {
          return true;
        }
        const bitPosition = variableCount - variableIndex - 1;
        return ((row >> bitPosition) & 1) === bit;
      });
      if (!matches) {
        continue;
      }
      if (!results[row]) {
        valid = false; // covers a 0-row → not an implicant
        break;
      }
      cover |= 1 << row;
    }

    if (!valid || cover === 0) {
      continue;
    }

    const existing = cheapestByCover.get(cover);
    if (existing === undefined || literals < existing) {
      cheapestByCover.set(cover, literals);
    }
  }

  return [...cheapestByCover.entries()].map(([cover, literals]) => ({
    cover,
    literals,
  }));
}

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
