import type { BooleanExpression } from "./booleanExpression";
import { getImplicantLiterals, type MinimalDnf } from "./quineMcCluskey";

interface Literal {
  variableIndex: number;
  negated: boolean;
}

/**
 * Greedily factor a minimal DNF (QMC output) by repeatedly pulling out the
 * literal that appears in the most terms. Produces a potentially nested
 * AND/OR expression that leaves DNF form when factoring shortens the result.
 *
 * The algorithm is heuristic — for typical small inputs it reaches the
 * shortest equivalent expression, but it is not guaranteed optimal in the
 * worst case (general boolean minimization is NP-hard).
 */
export function factorMinimalDnf(
  minimal: MinimalDnf,
  variables: string[],
): BooleanExpression {
  if (minimal.type === "constant") {
    return { type: "constant", value: minimal.value };
  }

  const variableCount = variables.length;
  const terms = minimal.implicants.map((implicant) =>
    getImplicantLiterals(implicant, variableCount),
  );

  return factorTerms(terms, variables);
}

/** Count variable references in an expression (same metric as elsewhere). */
export function countExpressionLiterals(expression: BooleanExpression): number {
  switch (expression.type) {
    case "constant":
      return 0;
    case "variable":
      return 1;
    case "not":
      return countExpressionLiterals(expression.operand);
    case "binary":
      return (
        countExpressionLiterals(expression.left) +
        countExpressionLiterals(expression.right)
      );
  }
}

function factorTerms(
  terms: Literal[][],
  variables: string[],
): BooleanExpression {
  if (terms.length === 0) {
    return { type: "constant", value: false };
  }
  if (terms.length === 1) {
    return literalsToAnd(terms[0], variables);
  }

  const best = pickMostFrequentLiteral(terms);
  if (best === null) {
    return termsToOr(terms, variables);
  }

  const bestKey = literalKey(best);
  const withGroup: Literal[][] = [];
  const withoutGroup: Literal[][] = [];

  for (const term of terms) {
    const contains = term.some((literal) => literalKey(literal) === bestKey);
    if (contains) {
      withGroup.push(term.filter((literal) => literalKey(literal) !== bestKey));
    } else {
      withoutGroup.push(term);
    }
  }

  const bestLiteralExpr = literalToExpression(best, variables);

  // If any term collapsed to empty after removing the factor, the whole
  // with-group reduces to just the factor by absorption:
  //   (L) ∨ (L ∧ X) ∨ (L ∧ Y) = L
  const collapsedToFactor = withGroup.some((term) => term.length === 0);
  const factoredWith: BooleanExpression = collapsedToFactor
    ? bestLiteralExpr
    : {
        type: "binary",
        operator: "and",
        left: bestLiteralExpr,
        right: factorTerms(withGroup, variables),
      };

  if (withoutGroup.length === 0) {
    return factoredWith;
  }

  return {
    type: "binary",
    operator: "or",
    left: factoredWith,
    right: factorTerms(withoutGroup, variables),
  };
}

function pickMostFrequentLiteral(terms: Literal[][]): Literal | null {
  const counts = new Map<string, { literal: Literal; count: number }>();

  for (const term of terms) {
    const seenInTerm = new Set<string>();
    for (const literal of term) {
      const key = literalKey(literal);
      if (seenInTerm.has(key)) {
        continue;
      }
      seenInTerm.add(key);

      const entry = counts.get(key);
      if (entry) {
        entry.count += 1;
      } else {
        counts.set(key, { literal, count: 1 });
      }
    }
  }

  let best: { literal: Literal; count: number } | null = null;
  for (const entry of counts.values()) {
    if (entry.count < 2) {
      continue;
    }
    if (best === null || entry.count > best.count) {
      best = entry;
    }
  }

  return best?.literal ?? null;
}

function literalKey(literal: Literal): string {
  return `${literal.variableIndex}:${literal.negated ? "n" : "p"}`;
}

function literalToExpression(
  literal: Literal,
  variables: string[],
): BooleanExpression {
  const variable: BooleanExpression = {
    type: "variable",
    name: variables[literal.variableIndex],
  };
  return literal.negated ? { type: "not", operand: variable } : variable;
}

function literalsToAnd(
  literals: Literal[],
  variables: string[],
): BooleanExpression {
  if (literals.length === 0) {
    return { type: "constant", value: true };
  }

  const expressions = literals.map((literal) =>
    literalToExpression(literal, variables),
  );

  return expressions.reduce((left, right) => ({
    type: "binary",
    operator: "and",
    left,
    right,
  }));
}

function termsToOr(terms: Literal[][], variables: string[]): BooleanExpression {
  const expressions = terms.map((term) => literalsToAnd(term, variables));
  return expressions.reduce((left, right) => ({
    type: "binary",
    operator: "or",
    left,
    right,
  }));
}
