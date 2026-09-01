import type { BooleanExpression } from "./booleanExpression";
import { countExpressionLiterals, factorMinimalDnf } from "./factorMinimalDnf";
import {
  computeMinimalDnf,
  minimalDnfToExpression,
  type MinimalDnf,
} from "./quineMcCluskey";
import type { TruthTable } from "./truthTable";

const MAX_EXACT_OPTIMAL_VARIABLES = 4;

export type SmallestExpressionSource =
  "constant" | "minimal_dnf" | "factored_dnf" | "exact";

export interface SmallestBooleanExpression {
  expression: BooleanExpression;
  literalCount: number;
  /** True when the literal count is certified globally optimal. */
  exact: boolean;
  /**
   * Where the displayed expression came from. `exact` is used only when the DP
   * beats the DNF-derived fallback; equal-cost fallback forms are kept because
   * they preserve the existing derivation.
   */
  source: SmallestExpressionSource;
}

type BackPointer =
  | { kind: "literal"; variableIndex: number; negated: boolean }
  | {
      kind: "binary";
      operator: "and" | "or";
      leftMask: number;
      rightMask: number;
    };

interface SearchState {
  best: Int16Array;
  backPointers: Array<BackPointer | undefined>;
  fullMask: number;
}

const INFINITE_COST = 32767;
const resultCache = new WeakMap<TruthTable, SmallestBooleanExpression>();

/**
 * Return the shortest known boolean expression for a table.
 *
 * For up to four variables this is the globally shortest expression over
 * literals combined with AND/OR (negation only appears on variables). For more
 * variables it deliberately falls back to the previous DNF-derived factoring
 * method, because the exact function-space DP grows as 2^(2^n).
 */
export function computeSmallestBooleanExpression(
  table: TruthTable,
  minimal?: MinimalDnf,
): SmallestBooleanExpression {
  const cached = resultCache.get(table);
  if (cached) {
    return cached;
  }

  const resolvedMinimal = minimal ?? computeMinimalDnf(table);
  const fallback = computeDnfDerivedExpression(
    resolvedMinimal,
    table.variables,
  );

  if (
    resolvedMinimal.type === "constant" ||
    table.variables.length > MAX_EXACT_OPTIMAL_VARIABLES
  ) {
    const result = {
      ...fallback,
      exact: resolvedMinimal.type === "constant",
    };
    resultCache.set(table, result);
    return result;
  }

  const exactImprovement = findCheaperExactExpression(
    table,
    fallback.literalCount,
  );
  if (exactImprovement) {
    const result: SmallestBooleanExpression = {
      expression: exactImprovement.expression,
      literalCount: exactImprovement.literalCount,
      exact: true,
      source: "exact",
    };
    resultCache.set(table, result);
    return result;
  }

  const result: SmallestBooleanExpression = {
    ...fallback,
    exact: true,
  };
  resultCache.set(table, result);
  return result;
}

function computeDnfDerivedExpression(
  minimal: MinimalDnf,
  variables: string[],
): SmallestBooleanExpression {
  if (minimal.type === "constant") {
    return {
      expression: { type: "constant", value: minimal.value },
      literalCount: 0,
      exact: true,
      source: "constant",
    };
  }

  const minimalExpression = minimalDnfToExpression(minimal, variables);
  const factoredExpression = factorMinimalDnf(minimal, variables);
  const minimalLiteralCount = countExpressionLiterals(minimalExpression);
  const factoredLiteralCount = countExpressionLiterals(factoredExpression);

  if (factoredLiteralCount < minimalLiteralCount) {
    return {
      expression: factoredExpression,
      literalCount: factoredLiteralCount,
      exact: false,
      source: "factored_dnf",
    };
  }

  return {
    expression: minimalExpression,
    literalCount: minimalLiteralCount,
    exact: false,
    source: "minimal_dnf",
  };
}

function findCheaperExactExpression(
  table: TruthTable,
  strictUpperBound: number,
): { expression: BooleanExpression; literalCount: number } | null {
  if (strictUpperBound <= 1) {
    return null;
  }

  const variableCount = table.variables.length;
  const rowCount = 2 ** variableCount;
  const functionCount = 1 << rowCount;
  const fullMask = functionCount - 1;
  const targetMask = tableToFunctionMask(table);
  const best = new Int16Array(functionCount);
  best.fill(INFINITE_COST);
  const backPointers: Array<BackPointer | undefined> = Array(functionCount);
  const levels: number[][] = [];

  const state: SearchState = { best, backPointers, fullMask };
  const setImprovement = (
    mask: number,
    cost: number,
    backPointer: BackPointer,
  ): BooleanExpression | null => {
    best[mask] = cost;
    backPointers[mask] = backPointer;
    levels[cost] ??= [];
    levels[cost].push(mask);

    return mask === targetMask
      ? reconstructExpression(targetMask, table.variables, state)
      : null;
  };

  best[0] = 0;
  best[fullMask] = 0;

  for (
    let variableIndex = 0;
    variableIndex < variableCount;
    variableIndex += 1
  ) {
    const positiveMask = variableFunctionMask(variableIndex, variableCount);
    if (1 < best[positiveMask]) {
      const expression = setImprovement(positiveMask, 1, {
        kind: "literal",
        variableIndex,
        negated: false,
      });
      if (expression) {
        return { expression, literalCount: 1 };
      }
    }

    const negatedMask = fullMask ^ positiveMask;
    if (1 < best[negatedMask]) {
      const expression = setImprovement(negatedMask, 1, {
        kind: "literal",
        variableIndex,
        negated: true,
      });
      if (expression) {
        return { expression, literalCount: 1 };
      }
    }
  }

  for (let cost = 2; cost < strictUpperBound; cost += 1) {
    for (let leftCost = 1; leftCost <= Math.floor(cost / 2); leftCost += 1) {
      const rightCost = cost - leftCost;
      const leftLevel = levels[leftCost] ?? [];
      const rightLevel = levels[rightCost] ?? [];

      for (let leftIndex = 0; leftIndex < leftLevel.length; leftIndex += 1) {
        const leftMask = leftLevel[leftIndex];
        const startRightIndex = leftCost === rightCost ? leftIndex : 0;

        for (
          let rightIndex = startRightIndex;
          rightIndex < rightLevel.length;
          rightIndex += 1
        ) {
          const rightMask = rightLevel[rightIndex];
          const andMask = leftMask & rightMask;
          if (cost < best[andMask]) {
            const expression = setImprovement(andMask, cost, {
              kind: "binary",
              operator: "and",
              leftMask,
              rightMask,
            });
            if (expression) {
              return { expression, literalCount: cost };
            }
          }

          const orMask = leftMask | rightMask;
          if (cost < best[orMask]) {
            const expression = setImprovement(orMask, cost, {
              kind: "binary",
              operator: "or",
              leftMask,
              rightMask,
            });
            if (expression) {
              return { expression, literalCount: cost };
            }
          }
        }
      }
    }
  }

  return null;
}

function reconstructExpression(
  mask: number,
  variables: string[],
  state: SearchState,
): BooleanExpression {
  if (mask === 0) {
    return { type: "constant", value: false };
  }
  if (mask === state.fullMask) {
    return { type: "constant", value: true };
  }

  const backPointer = state.backPointers[mask];
  if (!backPointer) {
    throw new Error(`No expression back pointer for function mask ${mask}.`);
  }

  if (backPointer.kind === "literal") {
    const variable: BooleanExpression = {
      type: "variable",
      name: variables[backPointer.variableIndex],
    };
    return backPointer.negated ? { type: "not", operand: variable } : variable;
  }

  return {
    type: "binary",
    operator: backPointer.operator,
    left: reconstructExpression(backPointer.leftMask, variables, state),
    right: reconstructExpression(backPointer.rightMask, variables, state),
  };
}

function tableToFunctionMask(table: TruthTable): number {
  return table.rows.reduce(
    (mask, row, rowIndex) => (row.result ? mask | (1 << rowIndex) : mask),
    0,
  );
}

function variableFunctionMask(
  variableIndex: number,
  variableCount: number,
): number {
  const rowCount = 2 ** variableCount;
  const bitPosition = variableCount - variableIndex - 1;
  let mask = 0;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    if (((rowIndex >> bitPosition) & 1) === 1) {
      mask |= 1 << rowIndex;
    }
  }

  return mask;
}
