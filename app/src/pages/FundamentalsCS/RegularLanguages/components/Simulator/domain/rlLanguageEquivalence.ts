import { grammarToAutomaton } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faGrammarConversion";
import type { FAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import type { RegularGrammar } from "./rlTypes";

/**
 * Cap on visited (candidate, reference) state pairs. Exercise grammars stay far
 * below it; it only stops a pathological grammar from freezing the check.
 */
const MAX_PRODUCT_NODES = 20_000;

export interface LanguageDifference {
  /** Shortest word the candidate generates but the reference does not. */
  extra: string | null;
  /** Shortest word the reference generates but the candidate does not. */
  missing: string | null;
  /**
   * The walk hit {@link MAX_PRODUCT_NODES} before both directions were
   * settled, so a `null` above means "not found in the explored part", not
   * "does not exist". Callers should not report equivalence on this basis.
   */
  incomplete: boolean;
}

/** A determinised state: the set of NFA states currently reachable. */
type Subset = readonly string[];

/** One position in the product walk: where each side stands, and how we got there. */
interface ProductFrame {
  candidate: Subset;
  reference: Subset;
  word: string;
}

/** The two automata plus the alphabet the walk steps through. */
interface ProductSpace {
  candidate: FAProgram;
  reference: FAProgram;
  alphabet: string[];
}

/** Both counter-examples, filled in as the walk finds them. */
interface Found {
  extra: string | null;
  missing: string | null;
}

/** Identity of a frame — the two subsets, ignoring the word that led there. */
function frameKey(frame: ProductFrame): string {
  return `${frame.candidate.join("\u0000")}|${frame.reference.join("\u0000")}`;
}

/** `grammarToAutomaton` emits no ε-transitions, so a plain union suffices. */
function step(fa: FAProgram, subset: Subset, symbol: string): Subset {
  const next = new Set<string>();
  for (const state of subset) {
    for (const target of fa.transitions[state]?.[symbol] ?? []) {
      next.add(target);
    }
  }
  return [...next].sort();
}

function isAccepting(fa: FAProgram, subset: Subset): boolean {
  const accept = new Set(fa.acceptStates);
  return subset.some((state) => accept.has(state));
}

/**
 * A symbol either side can read: a word made only of the candidate's own
 * terminals still has to be judged against the reference, and vice versa.
 */
function buildProductSpace(
  candidate: RegularGrammar,
  reference: RegularGrammar,
): ProductSpace {
  const candidateFA = grammarToAutomaton(candidate);
  const referenceFA = grammarToAutomaton(reference);
  return {
    candidate: candidateFA,
    reference: referenceFA,
    alphabet: [
      ...new Set([...candidateFA.alphabet, ...referenceFA.alphabet]),
    ].sort(),
  };
}

/** Note the shortest word of each direction the first time it shows up. */
function recordDifference(
  space: ProductSpace,
  frame: ProductFrame,
  found: Found,
): void {
  const inCandidate = isAccepting(space.candidate, frame.candidate);
  const inReference = isAccepting(space.reference, frame.reference);

  if (inCandidate && !inReference && found.extra === null) {
    found.extra = frame.word;
  }
  if (inReference && !inCandidate && found.missing === null) {
    found.missing = frame.word;
  }
}

/** Queue every unvisited pair one symbol away from `frame`. */
function enqueueSuccessors(
  space: ProductSpace,
  frame: ProductFrame,
  seen: Set<string>,
  queue: ProductFrame[],
): void {
  // Both sides dead: no extension of this prefix can differ any more.
  if (frame.candidate.length === 0 && frame.reference.length === 0) return;

  for (const symbol of space.alphabet) {
    const next: ProductFrame = {
      candidate: step(space.candidate, frame.candidate, symbol),
      reference: step(space.reference, frame.reference, symbol),
      word: frame.word + symbol,
    };
    const key = frameKey(next);
    if (seen.has(key)) continue;
    seen.add(key);
    queue.push(next);
  }
}

/**
 * Compare two grammars by language, not by sample words: both become automata and
 * the walk explores the product of their subset constructions breadth-first, so
 * the first disagreement in each direction is the shortest counter-example. This
 * is what catches an over-general grammar that passes every curated word.
 */
export function compareGrammarLanguages(
  candidate: RegularGrammar,
  reference: RegularGrammar,
): LanguageDifference {
  const space = buildProductSpace(candidate, reference);
  const start: ProductFrame = {
    candidate: [space.candidate.startState],
    reference: [space.reference.startState],
    word: "",
  };

  const queue: ProductFrame[] = [start];
  const seen = new Set<string>([frameKey(start)]);
  const found: Found = { extra: null, missing: null };
  const settled = () => found.extra !== null && found.missing !== null;

  // Read with a moving index rather than `shift()`, which is O(queue length).
  for (let head = 0; head < queue.length && !settled(); head++) {
    if (seen.size > MAX_PRODUCT_NODES) {
      return { ...found, incomplete: true };
    }
    recordDifference(space, queue[head], found);
    enqueueSuccessors(space, queue[head], seen, queue);
  }

  return { ...found, incomplete: false };
}
