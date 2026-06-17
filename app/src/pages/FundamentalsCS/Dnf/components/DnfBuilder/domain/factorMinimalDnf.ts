import type { BooleanExpression } from "./booleanExpression";
import { getImplicantLiterals, type MinimalDnf } from "./quineMcCluskey";

export interface Literal {
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

/**
 * Factoring plan: a structural description of how the terms are factored, kept
 * separate from rendering so it can be turned into either the final expression
 * or a step-by-step derivation.
 */
type FactorPlan =
  | { kind: "term"; literals: Literal[] }
  | { kind: "factor"; literal: Literal; inner: FactorPlan }
  | { kind: "sum"; parts: FactorPlan[] };

interface FactorResult {
  plan: FactorPlan;
  cost: number;
}

/**
 * Exact factoring: the minimum-literal expression obtainable from these
 * AND-terms by repeatedly factoring out common literals (reverse
 * distributivity). At each step it tries factoring *every* literal shared by
 * two or more terms — from all terms that contain it — and recurses, keeping
 * the cheapest result; the no-factor sum-of-products is the base option.
 *
 * Factoring a literal out of all its terms never costs more than leaving it
 * (it removes k≥2 occurrences and adds one), so this exhaustive-over-choices
 * search is optimal within the distributive-factoring model — and small enough
 * for the few prime-implicant terms a minimal DNF produces. Memoised by term
 * set to avoid recomputing shared subproblems.
 */
function factorTerms(
  terms: Literal[][],
  variables: string[],
): BooleanExpression {
  if (terms.length === 0) {
    return { type: "constant", value: false };
  }
  const result = solveFactor(terms, new Map<string, FactorResult>());
  return planToExpression(result.plan, variables);
}

function solveFactor(
  terms: Literal[][],
  memo: Map<string, FactorResult>,
): FactorResult {
  if (terms.length === 1) {
    return {
      plan: { kind: "term", literals: terms[0] },
      cost: terms[0].length,
    };
  }

  const key = termSetKey(terms);
  const cached = memo.get(key);
  if (cached) {
    return cached;
  }

  // Base option: leave the group as a plain sum of products.
  let best: FactorResult = {
    plan: {
      kind: "sum",
      parts: terms.map((term) => ({ kind: "term", literals: term })),
    },
    cost: terms.reduce((sum, term) => sum + term.length, 0),
  };

  for (const factor of commonLiterals(terms)) {
    const candidate = factorOut(factor, terms, memo);
    if (candidate.cost < best.cost) {
      best = candidate;
    }
  }

  memo.set(key, best);
  return best;
}

/** Factor `factor` out of every term that contains it, then recurse. */
function factorOut(
  factor: Literal,
  terms: Literal[][],
  memo: Map<string, FactorResult>,
): FactorResult {
  const factorKey = literalKey(factor);
  const withGroup: Literal[][] = [];
  const withoutGroup: Literal[][] = [];

  for (const term of terms) {
    if (term.some((literal) => literalKey(literal) === factorKey)) {
      withGroup.push(
        term.filter((literal) => literalKey(literal) !== factorKey),
      );
    } else {
      withoutGroup.push(term);
    }
  }

  // A term that becomes empty means it was exactly the factor, so the whole
  // with-group is absorbed to just the factor: (L) ∨ (L ∧ X) = L.
  const absorbs = withGroup.some((term) => term.length === 0);
  let factoredWith: FactorResult;
  if (absorbs) {
    factoredWith = { plan: { kind: "term", literals: [factor] }, cost: 1 };
  } else {
    const inner = solveFactor(withGroup, memo);
    factoredWith = {
      plan: { kind: "factor", literal: factor, inner: inner.plan },
      cost: 1 + inner.cost,
    };
  }

  if (withoutGroup.length === 0) {
    return factoredWith;
  }

  const rest = solveFactor(withoutGroup, memo);
  return {
    plan: { kind: "sum", parts: [factoredWith.plan, ...sumParts(rest.plan)] },
    cost: factoredWith.cost + rest.cost,
  };
}

/** OR-parts of a plan; a non-sum plan counts as a single part. */
function sumParts(plan: FactorPlan): FactorPlan[] {
  return plan.kind === "sum" ? plan.parts : [plan];
}

function planToExpression(
  plan: FactorPlan,
  variables: string[],
): BooleanExpression {
  switch (plan.kind) {
    case "term":
      return literalsToAnd(plan.literals, variables);
    case "factor":
      return {
        type: "binary",
        operator: "and",
        left: literalToExpression(plan.literal, variables),
        right: planToExpression(plan.inner, variables),
      };
    case "sum":
      return plan.parts
        .map((part) => planToExpression(part, variables))
        .reduce((left, right) => ({
          type: "binary",
          operator: "or",
          left,
          right,
        }));
  }
}

/** Literals that appear in at least two of the terms (candidate factors). */
function commonLiterals(terms: Literal[][]): Literal[] {
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

  return [...counts.values()]
    .filter((entry) => entry.count >= 2)
    .map((entry) => entry.literal);
}

/** Order-independent key for a set of AND-terms, used for memoisation. */
function termSetKey(terms: Literal[][]): string {
  return terms
    .map((term) => [...term].map(literalKey).sort().join("&"))
    .sort()
    .join("|");
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

export interface FactoringStep {
  /** Expression snapshot at this point of the derivation. */
  expression: BooleanExpression;
  /** Literals factored out to reach this snapshot; empty for the starting SOP. */
  factoredLiterals: Literal[];
}

/**
 * Step-by-step factoring derivation for a minimal DNF: the starting
 * sum-of-products, then one snapshot per nesting level of factored-out literals,
 * ending at the fully factored form. Returns an empty array when nothing can be
 * factored (constant input or no shared literal) — there is no derivation to
 * show in that case.
 */
export function buildFactoringSteps(
  minimal: MinimalDnf,
  variables: string[],
): FactoringStep[] {
  if (minimal.type === "constant") {
    return [];
  }

  const terms = minimal.implicants.map((implicant) =>
    getImplicantLiterals(implicant, variables.length),
  );
  const { plan } = solveFactor(terms, new Map<string, FactorResult>());
  const depth = planDepth(plan);
  if (depth === 0) {
    return [];
  }

  const steps: FactoringStep[] = [];
  for (let level = 0; level <= depth; level += 1) {
    steps.push({
      expression: renderPlan(plan, level, variables),
      factoredLiterals: level === 0 ? [] : literalsAtDepth(plan, level - 1),
    });
  }
  return steps;
}

/** Deepest chain of factored-out literals in the plan. */
function planDepth(plan: FactorPlan): number {
  switch (plan.kind) {
    case "term":
      return 0;
    case "factor":
      return 1 + planDepth(plan.inner);
    case "sum":
      return Math.max(...plan.parts.map(planDepth));
  }
}

/**
 * Render the plan with factoring applied only down to `allowedDepth` levels;
 * factors deeper than that are shown expanded as a sum of products (i.e. not
 * yet factored), which is what makes the derivation advance one level per step.
 */
function renderPlan(
  plan: FactorPlan,
  allowedDepth: number,
  variables: string[],
): BooleanExpression {
  switch (plan.kind) {
    case "term":
      return literalsToAnd(plan.literals, variables);
    case "sum":
      return plan.parts
        .map((part) => renderPlan(part, allowedDepth, variables))
        .reduce((left, right) => ({
          type: "binary",
          operator: "or",
          left,
          right,
        }));
    case "factor":
      if (allowedDepth <= 0) {
        return termsToOr(planToSop(plan), variables);
      }
      return {
        type: "binary",
        operator: "and",
        left: literalToExpression(plan.literal, variables),
        right: renderPlan(plan.inner, allowedDepth - 1, variables),
      };
  }
}

/** Expand a plan back into its underlying sum-of-products terms. */
function planToSop(plan: FactorPlan): Literal[][] {
  switch (plan.kind) {
    case "term":
      return [plan.literals];
    case "factor":
      return planToSop(plan.inner).map((term) => [plan.literal, ...term]);
    case "sum":
      return plan.parts.flatMap(planToSop);
  }
}

/** Literals factored out exactly at the given nesting level. */
function literalsAtDepth(
  plan: FactorPlan,
  targetDepth: number,
  currentDepth = 0,
): Literal[] {
  switch (plan.kind) {
    case "term":
      return [];
    case "sum":
      return plan.parts.flatMap((part) =>
        literalsAtDepth(part, targetDepth, currentDepth),
      );
    case "factor": {
      const here = currentDepth === targetDepth ? [plan.literal] : [];
      return [
        ...here,
        ...literalsAtDepth(plan.inner, targetDepth, currentDepth + 1),
      ];
    }
  }
}
