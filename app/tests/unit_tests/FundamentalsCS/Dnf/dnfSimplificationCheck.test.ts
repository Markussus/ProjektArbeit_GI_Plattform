import { describe, expect, it } from "vitest";
import { checkDnfSimplification } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfSimplificationCheck";
import {
  createTruthTableFromResults,
  generateTruthTable,
} from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/truthTable";
import { parseBooleanExpression } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfParser";
import {
  evaluateBooleanExpression,
  type BooleanExpression,
} from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanExpression";

describe("DNF simplification check", () => {
  it("returns 'empty' for whitespace-only input", () => {
    const table = generateTruthTable(parse("a ∨ b"));

    const result = checkDnfSimplification(table, "   ");

    expect(result.status).toBe("empty");
    expect(result.userLiteralCount).toBeNull();
  });

  it("returns 'syntax_error' for malformed input", () => {
    const table = generateTruthTable(parse("a ∨ b"));

    const result = checkDnfSimplification(table, "(a ∨ b");

    expect(result.status).toBe("syntax_error");
    expect(result.issue?.code).toBe("missing_closing_parenthesis");
  });

  it("flags variables that do not occur in the table", () => {
    const table = generateTruthTable(parse("a ∨ b"));

    const result = checkDnfSimplification(table, "a ∨ z");

    expect(result.status).toBe("unknown_variable");
    expect(result.unknownVariables).toEqual(["z"]);
  });

  it("returns 'not_equivalent' when the input does not match the table", () => {
    const table = generateTruthTable(parse("(a ∨ b) ∧ c"));

    const result = checkDnfSimplification(table, "a ∧ c");

    expect(result.status).toBe("not_equivalent");
  });

  it("rejects an equivalent expression that is not actually shorter than canonical", () => {
    // Canonical DNF for a∨b uses 3 terms x 2 literals = 6 literals.
    // Submitting the same canonical form should NOT be accepted as a simplification.
    const table = generateTruthTable(parse("a ∨ b"));

    const result = checkDnfSimplification(
      table,
      "(¬a ∧ b) ∨ (a ∧ ¬b) ∨ (a ∧ b)",
    );

    expect(result.status).toBe("equivalent_not_shorter");
    expect(result.userLiteralCount).toBe(6);
    expect(result.canonicalLiteralCount).toBe(6);
  });

  it("accepts a minimal simplification and labels it 'accepted_minimal'", () => {
    // Unit16 example reduces to (¬q0 ∧ q1) ∨ (q0 ∧ ¬q1) — 4 literals
    const table = generateTruthTable(
      parse(
        "(¬q0 ∧ q1 ∧ ¬x) ∨ (¬q0 ∧ q1 ∧ x) ∨ (q0 ∧ ¬q1 ∧ ¬x) ∨ (q0 ∧ ¬q1 ∧ x)",
      ),
    );

    const result = checkDnfSimplification(table, "(¬q0 ∧ q1) ∨ (q0 ∧ ¬q1)");

    expect(result.status).toBe("accepted_minimal");
    expect(result.userLiteralCount).toBe(4);
    expect(result.minimumLiteralCount).toBe(4);
  });

  it("accepts an already-minimal DNF that cannot be simplified further", () => {
    // f = 1 only for 000 and 111 (the "all equal" function). The two minterms
    // share no literal, so the canonical DNF is already minimal — there is no
    // shorter equivalent form. Submitting it must be accepted as minimal, not
    // flagged as "equivalent but not shorter".
    const table = generateTruthTable(parse("(¬a ∧ ¬b ∧ ¬c) ∨ (a ∧ b ∧ c)"));

    const result = checkDnfSimplification(
      table,
      "(¬a ∧ ¬b ∧ ¬c) ∨ (a ∧ b ∧ c)",
    );

    expect(result.status).toBe("accepted_minimal");
    expect(result.userLiteralCount).toBe(6);
    expect(result.minimumLiteralCount).toBe(6);
    expect(result.canonicalLiteralCount).toBe(6);
  });

  it("accepts a shorter-but-not-minimal simplification", () => {
    // Function f(a,b,c) with minterms {0,1,2,3,5,7}. Canonical DNF = 18
    // literals; QMC minimum is ¬a ∨ (a∧c) = 3 literals. The submission below
    // is equivalent and shorter than canonical (6 literals) but not minimal.
    const results = [true, true, true, true, false, true, false, true];
    const table = createTruthTableFromResults(["a", "b", "c"], results);

    const result = checkDnfSimplification(
      table,
      "(¬a ∧ ¬b) ∨ (¬a ∧ b) ∨ (a ∧ c)",
    );

    expect(result.canonicalLiteralCount).toBe(18);
    expect(result.userLiteralCount).toBe(6);
    expect(result.minimumLiteralCount).toBeLessThan(6);
    expect(result.status).toBe("accepted_not_minimal");
  });

  it("accepts a non-DNF equivalent form that beats the QMC minimum", () => {
    // (a ∧ b) ∨ (a ∧ c) ∨ (a ∧ d) collapses to a ∧ (b ∨ c ∨ d) — only 4
    // literals, which is fewer than any pure-DNF form.
    const table = generateTruthTable(parse("(a ∧ b) ∨ (a ∧ c) ∨ (a ∧ d)"));

    const result = checkDnfSimplification(table, "a ∧ (b ∨ c ∨ d)");

    expect(result.status).toBe("accepted_minimal");
    expect(result.userLiteralCount).toBe(4);
  });

  it("handles constants: tautology", () => {
    const table = generateTruthTable(parse("a ∨ ¬a"));

    const result = checkDnfSimplification(table, "1");

    expect(result.minimumLiteralCount).toBe(0);
    expect(result.status).toBe("accepted_minimal");
  });

  it("handles constants: contradiction", () => {
    const table = generateTruthTable(parse("a ∧ ¬a"));

    const result = checkDnfSimplification(table, "0");

    expect(result.minimumLiteralCount).toBe(0);
    expect(result.status).toBe("accepted_minimal");
  });

  it("rejects non-minimal tautology and contradiction rewrites", () => {
    const tautologyTable = generateTruthTable(parse("a | !a"));
    const contradictionTable = generateTruthTable(parse("a & !a"));

    expect(checkDnfSimplification(tautologyTable, "a | !a").status).toBe(
      "equivalent_not_shorter",
    );
    expect(checkDnfSimplification(contradictionTable, "a & !a").status).toBe(
      "equivalent_not_shorter",
    );
  });

  it("exposes a minimalExpression that is logically equivalent to the table", () => {
    const table = createTruthTableFromResults(
      ["a", "b", "c"],
      [false, false, true, false, true, true, false, false],
    );

    const result = checkDnfSimplification(table, "");

    expectExpressionEquivalentToTable(result.minimalExpression, table);
  });

  it("exposes a strictly shorter factored expression when a literal can be pulled out", () => {
    // Minimal DNF for (a ∧ c) ∨ (b ∧ c) has 4 literals; factoring out c
    // produces c ∧ (a ∨ b) with 3 literals.
    const table = generateTruthTable(parse("(a ∧ c) ∨ (b ∧ c)"));

    const result = checkDnfSimplification(table, "");

    expect(result.factoredIsShorter).toBe(true);
    expect(result.factoredLiteralCount).toBeLessThan(
      result.minimumLiteralCount,
    );
    expect(result.factoredIsExact).toBe(true);
    expect(result.factoredSource).toBe("factored_dnf");
    expectExpressionEquivalentToTable(result.factoredExpression, table);
  });

  it("reports factoredIsShorter=false when no literal is shared across groups", () => {
    // Equivalence-over-3-vars: minterms 000 and 111 share no literal,
    // so greedy factoring cannot shorten the result.
    const table = generateTruthTable(parse("(¬a ∧ ¬b ∧ ¬c) ∨ (a ∧ b ∧ c)"));

    const result = checkDnfSimplification(table, "");

    expect(result.factoredIsShorter).toBe(false);
    expect(result.factoredLiteralCount).toBe(result.minimumLiteralCount);
  });

  it("exposes the globally shortest form when it beats literal factoring", () => {
    const table = generateTruthTable(parse("(a | b) & (c | d)"));

    const result = checkDnfSimplification(table, "");

    expect(result.minimumLiteralCount).toBe(8);
    expect(result.factoredIsShorter).toBe(true);
    expect(result.factoredLiteralCount).toBe(4);
    expect(result.factoredIsExact).toBe(true);
    expect(result.factoredSource).toBe("exact");
    expectExpressionEquivalentToTable(result.factoredExpression, table);
  });

  it("marks the optional shorter form as non-exact above four variables", () => {
    const table = generateTruthTable(parse("(a & c) | (b & c)"), [
      "a",
      "b",
      "c",
      "d",
      "e",
    ]);

    const result = checkDnfSimplification(table, "");

    expect(result.factoredIsShorter).toBe(true);
    expect(result.factoredLiteralCount).toBe(3);
    expect(result.factoredIsExact).toBe(false);
    expect(result.factoredSource).toBe("factored_dnf");
    expectExpressionEquivalentToTable(result.factoredExpression, table);
  });
});

function parse(source: string): BooleanExpression {
  const result = parseBooleanExpression(source);
  if (!result.ok) {
    throw new Error(`Expected expression to parse: ${source}`);
  }
  return result.expression;
}

function expectExpressionEquivalentToTable(
  expression: BooleanExpression,
  table: ReturnType<typeof generateTruthTable>,
): void {
  for (const row of table.rows) {
    expect(evaluateBooleanExpression(expression, row.assignment)).toBe(
      row.result,
    );
  }
}
