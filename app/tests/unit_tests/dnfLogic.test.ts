import { describe, expect, it } from "vitest";
import { buildTruthTableDisplay } from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/adapters/truthTableAdapter";
import {
  collectExpressionVariables,
  evaluateBooleanExpression,
  type BooleanExpression,
} from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanExpression";
import {
  formatBooleanInput,
  normalizeBooleanOperatorAliases,
} from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanSyntax";
import {
  deriveDnfFromTruthTable,
  formatDnfExpression,
  formatDnfTerm,
} from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfDerivation";
import {
  checkDnfExerciseAttempt,
  type TruthTableAnswer,
} from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfExerciseCheck";
import { parseBooleanExpression } from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfParser";
import {
  generateTruthTable,
  type TruthTable,
} from "../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/truthTable";

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

describe("DNF parser error reporting", () => {
  it("rejects whitespace-only input as empty expression", () => {
    const issue = expectParseFailure("   ");
    expect(issue.code).toBe("empty_expression");
  });

  it("reports unknown characters with their position", () => {
    const issue = expectParseFailure("a $ b");
    expect(issue.code).toBe("unexpected_character");
    expect(issue.value).toBe("$");
    expect(issue.index).toBe(2);
  });

  it("reports a leading binary operator as unexpected token", () => {
    const issue = expectParseFailure("∧ a");
    expect(issue.code).toBe("unexpected_token");
    expect(issue.value).toBe("∧");
    expect(issue.index).toBe(0);
  });

  it("reports an unexpected end after a binary operator", () => {
    const issue = expectParseFailure("a ∧");
    expect(issue.code).toBe("unexpected_end");
  });

  it("reports an unexpected end after a negation", () => {
    const issue = expectParseFailure("¬");
    expect(issue.code).toBe("unexpected_end");
  });

  it("reports a missing closing parenthesis", () => {
    const issue = expectParseFailure("(a ∨ b");
    expect(issue.code).toBe("missing_closing_parenthesis");
  });

  it("reports a trailing token as unexpected", () => {
    const issue = expectParseFailure("a b");
    expect(issue.code).toBe("unexpected_token");
    expect(issue.value).toBe("b");
  });
});

describe("Truth table generation", () => {
  it("returns a single row for constant expressions", () => {
    const trueTable = generateTruthTable(parse("1"));
    expect(trueTable.variables).toEqual([]);
    expect(trueTable.rows).toEqual([{ assignment: {}, result: true }]);

    const falseTable = generateTruthTable(parse("0"));
    expect(falseTable.rows).toEqual([{ assignment: {}, result: false }]);
  });

  it("sorts variables alphabetically and exposes 2^n rows", () => {
    const table = generateTruthTable(parse("z ∨ (a ∧ m)"));

    expect(table.variables).toEqual(["a", "m", "z"]);
    expect(table.rows).toHaveLength(8);
  });

  it("handles four-variable expressions with sixteen rows", () => {
    const table = generateTruthTable(parse("a ∨ (b ∧ c) ∨ ¬d"));

    expect(table.rows).toHaveLength(16);
  });
});

describe("DNF derivation edge cases", () => {
  it("derives one term when exactly one row evaluates to 1", () => {
    const table = generateTruthTable(parse("a ∧ b ∧ c"));
    const derivation = deriveDnfFromTruthTable(table);

    expect(derivation.trueRows).toHaveLength(1);
    expect(formatDnfExpression(derivation.dnf)).toBe("(a ∧ b ∧ c)");
  });

  it("preserves table row order in the derived DNF", () => {
    const derivation = deriveDnfFromTruthTable(
      generateTruthTable(parse("a ∨ b")),
    );

    expect(formatDnfExpression(derivation.dnf)).toBe(
      "(¬a ∧ b) ∨ (a ∧ ¬b) ∨ (a ∧ b)",
    );
  });

  it("treats double negation as the original variable", () => {
    const expression = parse("¬¬a");

    expect(evaluateBooleanExpression(expression, { a: true })).toBe(true);
    expect(evaluateBooleanExpression(expression, { a: false })).toBe(false);
  });
});

describe("Boolean expression helpers", () => {
  it("collects unique variables alphabetically", () => {
    expect(collectExpressionVariables(parse("z ∧ (a ∨ z) ∧ m"))).toEqual([
      "a",
      "m",
      "z",
    ]);
  });

  it("formats DNF terms with one, several, or zero literals", () => {
    expect(
      formatDnfTerm({ literals: [{ variable: "a", negated: false }] }),
    ).toBe("a");
    expect(
      formatDnfTerm({
        literals: [
          { variable: "a", negated: true },
          { variable: "b", negated: false },
        ],
      }),
    ).toBe("(¬a ∧ b)");
    expect(formatDnfTerm({ literals: [] })).toBe("1");
  });
});

describe("Boolean syntax formatting", () => {
  it("collapses surrounding whitespace and normalizes binary operators", () => {
    expect(formatBooleanInput("  a   |  b ")).toBe("a ∨ b");
    expect(formatBooleanInput("(  a   ∧  b )")).toBe("(a ∧ b)");
  });

  it("removes whitespace immediately around negation", () => {
    expect(formatBooleanInput("¬   a")).toBe("¬a");
  });

  it("only swaps alias characters without rearranging spaces", () => {
    expect(normalizeBooleanOperatorAliases("a   &   b")).toBe("a   ∧   b");
  });
});

describe("DNF exercise check edge cases", () => {
  it("returns 'empty' status for whitespace-only DNF input", () => {
    const table = generateTruthTable(parse("a ∨ b"));

    const result = checkDnfExerciseAttempt(
      table,
      getCorrectTruthTableAnswers(table),
      "   ",
    );

    expect(result.dnf.status).toBe("empty");
  });

  it("returns 'syntax_error' for malformed DNF input", () => {
    const table = generateTruthTable(parse("a ∨ b"));

    const result = checkDnfExerciseAttempt(
      table,
      getCorrectTruthTableAnswers(table),
      "(a ∨ b",
    );

    expect(result.dnf.status).toBe("syntax_error");
    expect(result.dnf.issue?.code).toBe("missing_closing_parenthesis");
  });

  it("flags extra DNF terms that activate 0-rows", () => {
    const table = generateTruthTable(parse("(a | b) & c"));

    const result = checkDnfExerciseAttempt(
      table,
      getCorrectTruthTableAnswers(table),
      "(¬a & b & c) | (a & ¬b & c) | (a & b & c) | (a & b & ¬c)",
    );

    expect(result.dnf.status).toBe("not_equivalent");
    expect(result.dnf.extraTermRows).toEqual([6]);
    expect(result.dnf.missingTermRows).toEqual([]);
    expect(result.dnf.mismatchRows.map((row) => row.rowIndex)).toEqual([6]);
  });

  it("treats partial-variable terms as equivalent but not canonical", () => {
    const table = generateTruthTable(parse("(a | b) & c"));

    const result = checkDnfExerciseAttempt(
      table,
      getCorrectTruthTableAnswers(table),
      "c & (a | b)",
    );

    expect(result.dnf.status).toBe("equivalent_not_canonical");
  });

  it("counts unanswered rows separately from incorrect ones", () => {
    const table = generateTruthTable(parse("a ∨ b"));
    const answers: TruthTableAnswer[] = [false, true, null, true];

    const result = checkDnfExerciseAttempt(table, answers, "");

    expect(result.unansweredRowCount).toBe(1);
    expect(result.incorrectRowCount).toBe(0);
    expect(result.correctRowCount).toBe(3);
  });
});

describe("Truth table display adapter", () => {
  it("formats variable values, result, and the contributing term per row", () => {
    const table = generateTruthTable(parse("a ∨ (b ∧ c)"));
    const derivation = deriveDnfFromTruthTable(table);

    const display = buildTruthTableDisplay(table, derivation);

    expect(display.variableHeaders).toEqual(["a", "b", "c"]);
    expect(display.rows).toHaveLength(8);
    expect(display.trueRowCount).toBe(5);

    const lastRow = display.rows[7];
    expect(lastRow.assignmentValues).toEqual(["1", "1", "1"]);
    expect(lastRow.result).toBe("1");
    expect(lastRow.term).toBe("(a ∧ b ∧ c)");
    expect(lastRow.isContributing).toBe(true);

    const firstRow = display.rows[0];
    expect(firstRow.term).toBe("");
    expect(firstRow.isContributing).toBe(false);
  });

  it("uses the constant value as the term for tautological tables", () => {
    const table = generateTruthTable(parse("a ∨ ¬a"));
    const derivation = deriveDnfFromTruthTable(table);

    const display = buildTruthTableDisplay(table, derivation);

    expect(display.rows.every((row) => row.term === "1")).toBe(true);
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

function expectParseFailure(source: string) {
  const result = parseBooleanExpression(source);

  if (result.ok) {
    throw new Error(`Expected '${source}' to fail to parse`);
  }

  return result.issue;
}
