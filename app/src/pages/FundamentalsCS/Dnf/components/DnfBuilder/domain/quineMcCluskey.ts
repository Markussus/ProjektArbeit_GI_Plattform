import type { BooleanExpression } from "./booleanExpression";
import type { TruthTable } from "./truthTable";

export interface PrimeImplicant {
  /** Bit pattern of the implicant. Bits at "don't care" positions are 0 by convention. */
  value: number;
  /** "Don't care" mask: bit set means the variable is eliminated from this term. */
  mask: number;
  /** Minterm indices this implicant covers. */
  covers: number[];
  /** Number of variables actually present in the term (i.e. not don't-care). */
  literals: number;
}

export type MinimalDnf =
  | { type: "constant"; value: boolean; literalCount: 0; termCount: 0 }
  | {
      type: "sum_of_products";
      implicants: PrimeImplicant[];
      literalCount: number;
      termCount: number;
    };

interface ImplicantLiteral {
  variableIndex: number;
  negated: boolean;
}

export function getImplicantLiterals(
  implicant: PrimeImplicant,
  variableCount: number,
): ImplicantLiteral[] {
  const literals: ImplicantLiteral[] = [];

  for (
    let bitPosition = variableCount - 1;
    bitPosition >= 0;
    bitPosition -= 1
  ) {
    const mask = 1 << bitPosition;

    if ((implicant.mask & mask) !== 0) {
      continue;
    }

    literals.push({
      variableIndex: variableCount - 1 - bitPosition,
      negated: (implicant.value & mask) === 0,
    });
  }

  return literals;
}

/**
 * Compute a minimal sum-of-products form for the given truth table using
 * Quine-McCluskey. Returns the minimum literal count and a concrete set of
 * prime implicants that achieves it.
 *
 * Algorithm:
 *  1. Collect minterms (rows with result 1)
 *  2. Iteratively combine implicants that differ in exactly one bit until
 *     no further combination is possible. Uncombined entries are the prime
 *     implicants.
 *  3. Pick essential prime implicants (those uniquely covering some minterm).
 *  4. Cover the remaining minterms with a greedy choice that minimises
 *     total literal count.
 */
export function computeMinimalDnf(table: TruthTable): MinimalDnf {
  const variableCount = table.variables.length;
  const minterms = collectMinterms(table);

  if (minterms.length === 0) {
    return { type: "constant", value: false, literalCount: 0, termCount: 0 };
  }
  if (minterms.length === 2 ** variableCount) {
    return { type: "constant", value: true, literalCount: 0, termCount: 0 };
  }

  const primeImplicants = collectPrimeImplicants(minterms, variableCount);
  const chosen = selectCover(primeImplicants, minterms);

  const literalCount = chosen.reduce((sum, pi) => sum + pi.literals, 0);

  return {
    type: "sum_of_products",
    implicants: chosen,
    literalCount,
    termCount: chosen.length,
  };
}

export function minimalDnfToExpression(
  minimal: MinimalDnf,
  variables: string[],
): BooleanExpression {
  if (minimal.type === "constant") {
    return { type: "constant", value: minimal.value };
  }

  const variableCount = variables.length;
  const termExpressions = minimal.implicants.map((implicant) =>
    implicantToExpression(implicant, variables, variableCount),
  );

  return termExpressions.reduce((left, right) => ({
    type: "binary",
    operator: "or",
    left,
    right,
  }));
}

function implicantToExpression(
  implicant: PrimeImplicant,
  variables: string[],
  variableCount: number,
): BooleanExpression {
  const literals = getImplicantLiterals(implicant, variableCount).map(
    ({ variableIndex, negated }): BooleanExpression => {
      const variable = variables[variableIndex];
      const literal: BooleanExpression = { type: "variable", name: variable };

      return negated ? { type: "not", operand: literal } : literal;
    },
  );

  if (literals.length === 0) {
    return { type: "constant", value: true };
  }

  return literals.reduce((left, right) => ({
    type: "binary",
    operator: "and",
    left,
    right,
  }));
}

function collectMinterms(table: TruthTable): number[] {
  const minterms: number[] = [];

  for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex += 1) {
    if (table.rows[rowIndex].result) {
      minterms.push(rowIndex);
    }
  }

  return minterms;
}

interface CombinationCandidate {
  value: number;
  mask: number;
  covers: number[];
  combined: boolean;
}

function collectPrimeImplicants(
  minterms: number[],
  variableCount: number,
): PrimeImplicant[] {
  const seenKeys = new Set<string>();
  const primes: PrimeImplicant[] = [];

  let current: CombinationCandidate[] = minterms.map((minterm) => ({
    value: minterm,
    mask: 0,
    covers: [minterm],
    combined: false,
  }));

  while (current.length > 0) {
    const next = combineCandidates(current, variableCount);
    appendNewPrimeImplicants(current, variableCount, seenKeys, primes);
    current = next;
  }

  return primes;
}

function combineCandidates(
  candidates: CombinationCandidate[],
  variableCount: number,
): CombinationCandidate[] {
  const grouped = groupByOneBitCount(candidates, variableCount);
  const next: CombinationCandidate[] = [];
  const nextKeys = new Set<string>();

  for (let groupIndex = 0; groupIndex < grouped.length - 1; groupIndex += 1) {
    const lowerGroup = grouped[groupIndex];
    const upperGroup = grouped[groupIndex + 1];

    for (const lower of lowerGroup) {
      for (const upper of upperGroup) {
        const combined = combineCandidatePair(lower, upper);
        if (!combined) {
          continue;
        }

        const key = `${combined.value}|${combined.mask}`;
        if (nextKeys.has(key)) {
          continue;
        }

        nextKeys.add(key);
        next.push(combined);
      }
    }
  }

  return next;
}

function combineCandidatePair(
  lower: CombinationCandidate,
  upper: CombinationCandidate,
): CombinationCandidate | null {
  if (lower.mask !== upper.mask) {
    return null;
  }

  const diff = lower.value ^ upper.value;
  if (!isSingleBit(diff)) {
    return null;
  }

  lower.combined = true;
  upper.combined = true;

  return {
    value: lower.value & ~diff,
    mask: lower.mask | diff,
    covers: mergeCovers(lower.covers, upper.covers),
    combined: false,
  };
}

function appendNewPrimeImplicants(
  candidates: CombinationCandidate[],
  variableCount: number,
  seenKeys: Set<string>,
  primes: PrimeImplicant[],
): void {
  for (const candidate of candidates) {
    if (candidate.combined) {
      continue;
    }

    const key = `${candidate.value}|${candidate.mask}`;
    if (seenKeys.has(key)) {
      continue;
    }
    seenKeys.add(key);

    primes.push({
      value: candidate.value,
      mask: candidate.mask,
      covers: [...candidate.covers].sort((a, b) => a - b),
      literals: variableCount - countSetBits(candidate.mask),
    });
  }
}

function groupByOneBitCount(
  candidates: CombinationCandidate[],
  variableCount: number,
): CombinationCandidate[][] {
  const groups: CombinationCandidate[][] = Array.from(
    { length: variableCount + 1 },
    () => [],
  );

  for (const candidate of candidates) {
    const ones = countSetBits(candidate.value);
    groups[ones].push(candidate);
  }

  return groups;
}

function mergeCovers(left: number[], right: number[]): number[] {
  const merged = new Set<number>(left);
  for (const value of right) {
    merged.add(value);
  }
  return [...merged].sort((a, b) => a - b);
}

function selectCover(
  primes: PrimeImplicant[],
  minterms: number[],
): PrimeImplicant[] {
  const remaining = new Set(minterms);
  const chosen: PrimeImplicant[] = [];
  const available = new Set(primes);

  // Repeatedly extract essential prime implicants: a prime implicant is
  // essential if it is the only one in `available` that covers some still-
  // uncovered minterm.
  let pickedEssential = true;
  while (pickedEssential && remaining.size > 0) {
    pickedEssential = false;

    for (const minterm of remaining) {
      const covering = [...available].filter((pi) =>
        pi.covers.includes(minterm),
      );

      if (covering.length === 1) {
        const essential = covering[0];
        chosen.push(essential);
        available.delete(essential);
        for (const covered of essential.covers) {
          remaining.delete(covered);
        }
        pickedEssential = true;
        break;
      }
    }
  }

  // Greedy fill: at each step, pick the prime implicant that covers the
  // most still-uncovered minterms; break ties by preferring fewer literals.
  while (remaining.size > 0) {
    let best: PrimeImplicant | null = null;
    let bestNewlyCovered = -1;

    for (const candidate of available) {
      const newlyCovered = candidate.covers.filter((minterm) =>
        remaining.has(minterm),
      ).length;

      if (newlyCovered === 0) {
        continue;
      }

      if (
        newlyCovered > bestNewlyCovered ||
        (newlyCovered === bestNewlyCovered &&
          best !== null &&
          candidate.literals < best.literals)
      ) {
        best = candidate;
        bestNewlyCovered = newlyCovered;
      }
    }

    if (best === null) {
      break;
    }

    chosen.push(best);
    available.delete(best);
    for (const covered of best.covers) {
      remaining.delete(covered);
    }
  }

  return chosen;
}

function isSingleBit(value: number): boolean {
  return value !== 0 && (value & (value - 1)) === 0;
}

function countSetBits(value: number): number {
  let count = 0;
  let remaining = value;
  while (remaining !== 0) {
    remaining &= remaining - 1;
    count += 1;
  }
  return count;
}
