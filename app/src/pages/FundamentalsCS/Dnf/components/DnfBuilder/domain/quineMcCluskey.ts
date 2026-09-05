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
 *  4. Cover the remaining minterms exactly: branch-and-bound over the cyclic
 *     core to find the cover with the minimum total literal count.
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

/**
 * Choose a minimum-literal subset of prime implicants covering every minterm.
 * This is an exact solution, not a greedy approximation:
 *
 *  1. Repeatedly pull out essential prime implicants — the only cover of some
 *     still-uncovered minterm — which must appear in every valid cover.
 *  2. On the remaining "cyclic core" (no minterm forces a single implicant),
 *     branch over the implicants covering the most-constrained minterm and keep
 *     the cheapest complete cover. Branches whose accumulated literal cost
 *     already reaches the best known cover are pruned.
 */
function selectCover(
  primes: PrimeImplicant[],
  minterms: number[],
): PrimeImplicant[] {
  // Every minterm is covered by at least one prime implicant, so `primes` is
  // always a valid cover; it serves as the non-null seed for the search.
  let bestCover: PrimeImplicant[] = primes;
  let bestCost = Number.POSITIVE_INFINITY;

  const search = (
    remaining: Set<number>,
    available: PrimeImplicant[],
    chosen: PrimeImplicant[],
    chosenCost: number,
  ): void => {
    if (chosenCost >= bestCost) {
      return;
    }

    const reduced = extractEssentials(remaining, available);
    const cover = chosen.concat(reduced.forced);
    const coverCost = chosenCost + totalLiterals(reduced.forced);

    if (coverCost >= bestCost) {
      return;
    }

    if (reduced.remaining.size === 0) {
      bestCover = cover;
      bestCost = coverCost;
      return;
    }

    const minterm = mostConstrainedMinterm(
      reduced.remaining,
      reduced.available,
    );
    const candidates = reduced.available
      .filter((pi) => pi.covers.includes(minterm))
      .sort((a, b) => a.literals - b.literals);

    for (const candidate of candidates) {
      const nextRemaining = new Set(reduced.remaining);
      for (const covered of candidate.covers) {
        nextRemaining.delete(covered);
      }
      const nextAvailable = reduced.available.filter((pi) => pi !== candidate);
      search(
        nextRemaining,
        nextAvailable,
        cover.concat(candidate),
        coverCost + candidate.literals,
      );
    }
  };

  search(new Set(minterms), primes, [], 0);

  return bestCover;
}

/** Sum of literals across a set of implicants (the cost we minimise). */
function totalLiterals(implicants: PrimeImplicant[]): number {
  return implicants.reduce((sum, pi) => sum + pi.literals, 0);
}

/**
 * Pull out essential prime implicants to a fixpoint: whenever a minterm is
 * covered by exactly one available implicant, that implicant is forced. Returns
 * the still-uncovered minterms, the implicants left to choose from, and the
 * forced implicants. Inputs are not mutated.
 */
function extractEssentials(
  remaining: Set<number>,
  available: PrimeImplicant[],
): {
  remaining: Set<number>;
  available: PrimeImplicant[];
  forced: PrimeImplicant[];
} {
  const open = new Set(remaining);
  let pool = available;
  const forced: PrimeImplicant[] = [];

  let changed = true;
  while (changed && open.size > 0) {
    changed = false;

    for (const minterm of open) {
      const covering = pool.filter((pi) => pi.covers.includes(minterm));

      if (covering.length === 1) {
        const essential = covering[0];
        forced.push(essential);
        pool = pool.filter((pi) => pi !== essential);
        for (const covered of essential.covers) {
          open.delete(covered);
        }
        changed = true;
        break;
      }
    }
  }

  return { remaining: open, available: pool, forced };
}

/** The uncovered minterm with the fewest covering implicants (branch here). */
function mostConstrainedMinterm(
  remaining: Set<number>,
  available: PrimeImplicant[],
): number {
  let chosen = -1;
  let fewest = Number.POSITIVE_INFINITY;

  for (const minterm of remaining) {
    const count = available.reduce(
      (total, pi) => (pi.covers.includes(minterm) ? total + 1 : total),
      0,
    );

    if (count < fewest) {
      fewest = count;
      chosen = minterm;
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
