import { describe, expect, it } from "vitest";
import { formatBooleanExpressionForDisplay } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanExpression";
import { reformatBooleanExpressionInput } from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanExpressionInputFormat";
import {
  parseBooleanExpression,
  type DnfParseResult,
} from "../../../../src/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfParser";

describe("booleanExpressionFormat", () => {
  it("renders OR-of-ANDs with parens around each AND group", () => {
    const expression = parse("¬b ∧ ¬a ∧ c ∧ d ∨ b ∧ ¬c ∧ d");
    expect(formatBooleanExpressionForDisplay(expression)).toBe(
      "(¬b ∧ ¬a ∧ c ∧ d) ∨ (b ∧ ¬c ∧ d)",
    );
  });

  it("does not add parens for a pure AND chain", () => {
    const expression = parse("a ∧ b ∧ c");
    expect(formatBooleanExpressionForDisplay(expression)).toBe("a ∧ b ∧ c");
  });

  it("does not add parens for a pure OR chain", () => {
    const expression = parse("a ∨ b ∨ c");
    expect(formatBooleanExpressionForDisplay(expression)).toBe("a ∨ b ∨ c");
  });

  it("wraps an OR operand inside NOT", () => {
    const expression = parse("¬(a ∨ b)");
    expect(formatBooleanExpressionForDisplay(expression)).toBe("¬(a ∨ b)");
  });

  it("wraps an AND operand inside NOT", () => {
    const expression = parse("¬(a ∧ b)");
    expect(formatBooleanExpressionForDisplay(expression)).toBe("¬(a ∧ b)");
  });

  it("wraps OR expressions inside an AND parent", () => {
    const expression = parse("(a ∨ b) ∧ (c ∨ d)");
    expect(formatBooleanExpressionForDisplay(expression)).toBe(
      "(a ∨ b) ∧ (c ∨ d)",
    );
  });

  it("leaves a single negated variable without parens", () => {
    const expression = parse("¬a");
    expect(formatBooleanExpressionForDisplay(expression)).toBe("¬a");
  });

  it("handles constants", () => {
    expect(formatBooleanExpressionForDisplay(parse("1"))).toBe("1");
    expect(formatBooleanExpressionForDisplay(parse("0"))).toBe("0");
  });

  it("reformats input strings via parse + re-emit", () => {
    expect(reformatBooleanExpressionInput("a∧b∨c∧d")).toBe("(a ∧ b) ∨ (c ∧ d)");
  });

  it("falls back to the raw input when parsing fails", () => {
    expect(reformatBooleanExpressionInput("(a ∨")).toBe("(a ∨");
  });
});

function parse(source: string) {
  const result: DnfParseResult = parseBooleanExpression(source);
  if (!result.ok) {
    throw new Error(`Parse failed in test fixture: ${source}`);
  }
  return result.expression;
}
