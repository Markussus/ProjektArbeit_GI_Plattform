import { describe, expect, it } from "vitest";
import { evaluateBooleanExpression } from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfEvaluator";
import {
  deriveDnfFromTruthTable,
  formatDnfExpression,
} from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfDerivation";
import { checkDnfExerciseAttempt } from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfExerciseCheck";
import { parseBooleanExpression } from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfParser";
import {
  generateTruthTable,
  type TruthTable,
} from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/truthTable";
import type { BooleanExpression } from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanExpression";
import {
  formatBooleanInput,
  normalizeBooleanOperatorAliases,
} from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanSyntax";

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

  it("checks a complete canonical DNF exercise answer", () => {
    const table = generateTruthTable(parse("(a | b) & c"));
    const result = checkDnfExerciseAttempt(
      table,
      getCorrectTruthTableAnswers(table),
      "(!a & b & c) | (a & !b & c) | (a & b & c)",
    );

    expect(result.isCorrect).toBe(true);
    expect(result.dnf.status).toBe("correct");
  });

  it("normalizes keyboard operator aliases for display", () => {
    expect(normalizeBooleanOperatorAliases("!a & (b | c)")).toBe(
      "¬a ∧ (b ∨ c)",
    );
    expect(formatBooleanInput(" ! a   &   ( b | c ) ")).toBe("¬a ∧ (b ∨ c)");
  });

  it("distinguishes equivalent expressions from canonical DNF answers", () => {
    const table = generateTruthTable(parse("(a | b) & c"));
    const result = checkDnfExerciseAttempt(
      table,
      getCorrectTruthTableAnswers(table),
      "(a | b) & c",
    );

    expect(result.isCorrect).toBe(false);
    expect(result.dnf.status).toBe("equivalent_not_canonical");
  });

  it("reports wrong truth-table rows and missing DNF terms", () => {
    const table = generateTruthTable(parse("(a | b) & c"));
    const truthTableAnswers = getCorrectTruthTableAnswers(table);
    truthTableAnswers[3] = false;

    const result = checkDnfExerciseAttempt(
      table,
      truthTableAnswers,
      "(!a & b & c)",
    );

    expect(result.truthTableIssues).toEqual([
      { rowIndex: 3, expected: true, actual: false },
    ]);
    expect(result.correctRowCount).toBe(7);
    expect(result.dnf.status).toBe("not_equivalent");
    expect(result.dnf.mismatchRows.map((row) => row.rowIndex)).toEqual([5, 7]);
    expect(result.dnf.missingTermRows).toEqual([5, 7]);
  });
});

function parse(source: string): BooleanExpression {
  const result = parseBooleanExpression(source);

  if (!result.ok) {
    throw new Error(`Expected expression to parse: ${source}`);
  }

  return result.expression;
}

function getCorrectTruthTableAnswers(table: TruthTable): boolean[] {
  return table.rows.map((row) => row.result);
}
