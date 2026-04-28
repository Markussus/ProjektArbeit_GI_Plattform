import { describe, expect, it } from "vitest";
import { evaluateBooleanExpression } from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfEvaluator";
import {
  deriveDnfFromTruthTable,
  formatDnfExpression,
} from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfDerivation";
import { parseBooleanExpression } from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfParser";
import { generateTruthTable } from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/truthTable";
import type { BooleanExpression } from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanExpression";

describe("DNF boolean logic", () => {
  it("parses and evaluates operator precedence", () => {
    const expression = parse("a ∨ b ∧ c");

    expect(
      evaluateBooleanExpression(expression, { a: false, b: true, c: false }),
    ).toBe(false);
    expect(
      evaluateBooleanExpression(expression, { a: false, b: true, c: true }),
    ).toBe(true);
    expect(
      evaluateBooleanExpression(parse("(a ∨ b) ∧ c"), {
        a: true,
        b: false,
        c: false,
      }),
    ).toBe(false);
  });

  it("generates the lecture-style truth table order", () => {
    const table = generateTruthTable(parse("a ∨ (b ∧ c)"));

    expect(table.variables).toEqual(["a", "b", "c"]);
    expect(table.rows.map((row) => row.result)).toEqual([
      false,
      false,
      false,
      true,
      true,
      true,
      true,
      true,
    ]);
  });

  it("derives DNF terms from all rows with result 1", () => {
    const table = generateTruthTable(parse("(¬a ∧ ¬b ∧ ¬c) ∨ (a ∧ b ∧ c)"));
    const derivation = deriveDnfFromTruthTable(table);

    expect(formatDnfExpression(derivation.dnf)).toBe(
      "(¬a ∧ ¬b ∧ ¬c) ∨ (a ∧ b ∧ c)",
    );
  });

  it("handles constant 0 and constant 1 functions cleanly", () => {
    const falseDerivation = deriveDnfFromTruthTable(
      generateTruthTable(parse("0")),
    );
    const trueDerivation = deriveDnfFromTruthTable(
      generateTruthTable(parse("a ∨ ¬a")),
    );

    expect(formatDnfExpression(falseDerivation.dnf)).toBe("0");
    expect(formatDnfExpression(trueDerivation.dnf)).toBe("1");
  });
});

function parse(source: string): BooleanExpression {
  const result = parseBooleanExpression(source);

  if (!result.ok) {
    throw new Error(`Expected expression to parse: ${source}`);
  }

  return result.expression;
}
