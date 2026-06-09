import {
  collectExpressionVariables,
  evaluateBooleanExpression,
  type BooleanExpression,
} from "./booleanExpression";
import { deriveDnfFromTruthTable } from "./dnfDerivation";
import { parseBooleanExpression, type DnfParseIssue } from "./dnfParser";
import { countExpressionLiterals, factorMinimalDnf } from "./factorMinimalDnf";
import { computeMinimalDnf, minimalDnfToExpression } from "./quineMcCluskey";
import type { TruthTable } from "./truthTable";

export type DnfSimplificationStatus =
  | "empty"
  | "syntax_error"
  | "unknown_variable"
  | "not_equivalent"
  | "equivalent_not_shorter"
  | "accepted_not_minimal"
  | "accepted_minimal";

export interface DnfSimplificationCheck {
  status: DnfSimplificationStatus;
  issue?: DnfParseIssue;
  unknownVariables: string[];
  /** Number of literals (variable references) in the user expression, when parseable. */
  userLiteralCount: number | null;
  /** Number of OR-separated terms in the user expression, when parseable. */
  userTermCount: number | null;
  /** Literal count of the canonical DNF baseline. */
  canonicalLiteralCount: number;
  /** Literal count of the minimum DNF computed by QMC. */
  minimumLiteralCount: number;
  /** Term count of the minimum DNF. */
  minimumTermCount: number;
}

export interface DnfSimplificationCheckResult extends DnfSimplificationCheck {
  /** One concrete minimal expression for display when the user asks for help. */
  minimalExpression: BooleanExpression;
  /**
   * Greedy-factored expression derived from the minimal DNF. Equals the
   * minimal DNF when no common factor can be pulled out; otherwise leaves DNF
   * form and may be strictly shorter.
   */
  factoredExpression: BooleanExpression;
  /** Literal count of the factored expression. */
  factoredLiteralCount: number;
  /** True when factoring produced a strictly shorter expression than the minimal DNF. */
  factoredIsShorter: boolean;
}

/**
 * Check whether the user's simplified expression is an acceptable simplification
 * of the canonical DNF for the given truth table.
 *
 * Pass criteria, in order of severity:
 *   1. parse + variables must be valid
 *   2. expression must be logically equivalent to the truth table
 *   3. literal count must be strictly less than the canonical DNF
 *   4. literal count is compared to the QMC minimum to distinguish
 *      "good but not optimal" from "minimal"
 */
export function checkDnfSimplification(
  table: TruthTable,
  userInput: string,
): DnfSimplificationCheckResult {
  const minimal = computeMinimalDnf(table);
  const minimalExpression = minimalDnfToExpression(minimal, table.variables);
  const factoredExpression = factorMinimalDnf(minimal, table.variables);
  const factoredLiteralCount = countExpressionLiterals(factoredExpression);
  const canonicalLiteralCount = getCanonicalLiteralCount(table);
  const baseResult = {
    canonicalLiteralCount,
    minimumLiteralCount: minimal.literalCount,
    minimumTermCount: minimal.termCount,
    minimalExpression,
    factoredExpression,
    factoredLiteralCount,
    factoredIsShorter: factoredLiteralCount < minimal.literalCount,
  };

  if (userInput.trim() === "") {
    return {
      ...baseResult,
      status: "empty",
      unknownVariables: [],
      userLiteralCount: null,
      userTermCount: null,
    };
  }

  const parseResult = parseBooleanExpression(userInput);
  if (!parseResult.ok) {
    return {
      ...baseResult,
      status: "syntax_error",
      issue: parseResult.issue,
      unknownVariables: [],
      userLiteralCount: null,
      userTermCount: null,
    };
  }

  const expression = parseResult.expression;
  const unknownVariables = findUnknownVariables(expression, table.variables);
  const userLiteralCount = countExpressionLiterals(expression);
  const userTermCount = countTopLevelTerms(expression);

  if (unknownVariables.length > 0) {
    return {
      ...baseResult,
      status: "unknown_variable",
      unknownVariables,
      userLiteralCount,
      userTermCount,
    };
  }

  if (!isEquivalentToTable(expression, table)) {
    return {
      ...baseResult,
      status: "not_equivalent",
      unknownVariables: [],
      userLiteralCount,
      userTermCount,
    };
  }

  if (isNotShorterThanCanonical(userLiteralCount, canonicalLiteralCount)) {
    return {
      ...baseResult,
      status: "equivalent_not_shorter",
      unknownVariables: [],
      userLiteralCount,
      userTermCount,
    };
  }

  if (userLiteralCount <= minimal.literalCount) {
    return {
      ...baseResult,
      status: "accepted_minimal",
      unknownVariables: [],
      userLiteralCount,
      userTermCount,
    };
  }

  return {
    ...baseResult,
    status: "accepted_not_minimal",
    unknownVariables: [],
    userLiteralCount,
    userTermCount,
  };
}

function isEquivalentToTable(
  expression: BooleanExpression,
  table: TruthTable,
): boolean {
  return table.rows.every(
    (row) =>
      evaluateBooleanExpression(expression, row.assignment) === row.result,
  );
}

function findUnknownVariables(
  expression: BooleanExpression,
  knownVariables: string[],
): string[] {
  const known = new Set(knownVariables);
  return collectExpressionVariables(expression).filter(
    (variable) => !known.has(variable),
  );
}

/** Count top-level OR-separated terms; 1 for non-OR expressions. */
function countTopLevelTerms(expression: BooleanExpression): number {
  if (expression.type === "binary" && expression.operator === "or") {
    return (
      countTopLevelTerms(expression.left) + countTopLevelTerms(expression.right)
    );
  }
  return 1;
}

function isNotShorterThanCanonical(
  userLiteralCount: number,
  canonicalLiteralCount: number,
): boolean {
  return canonicalLiteralCount === 0
    ? userLiteralCount > 0
    : userLiteralCount >= canonicalLiteralCount;
}

function getCanonicalLiteralCount(table: TruthTable): number {
  const derivation = deriveDnfFromTruthTable(table);
  if (derivation.dnf.type === "constant") {
    return 0;
  }
  return derivation.dnf.terms.reduce(
    (sum, term) => sum + term.literals.length,
    0,
  );
}
