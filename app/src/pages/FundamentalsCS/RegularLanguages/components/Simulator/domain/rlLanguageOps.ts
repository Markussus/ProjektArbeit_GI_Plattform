import { grammarToAutomaton } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faGrammarConversion";
import type { FAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import {
  createInitialRuntime,
  stepRuntime,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faMachine";
import type { ProductionRule, RegularGrammar } from "./rlTypes";
import { NON_TERMINAL_NAMES, emitRightLinearGrammar } from "./rlGrammarNaming";

/**
 * The spellings that stand for the empty word in learner input — the same two
 * the grammar parser accepts, so `S -> 0S | epsilon` and the word `epsilon`
 * mean the same thing.
 */
const EMPTY_WORD_NAMES = new Set(["ε", "epsilon"]);

/**
 * Resolve one word a learner typed: an ε spelling becomes the empty word,
 * anything else is taken literally (`epsilonx` stays a seven-symbol word).
 * Every field that reads words shares this, so ε means the same everywhere.
 */
export function resolveEmptyWord(word: string): string {
  return EMPTY_WORD_NAMES.has(word) ? "" : word;
}

export interface EnumerateResult {
  words: string[];
  truncated: boolean;
}

/** Enumeration limits when the caller names none. */
const DEFAULT_MAX_WORDS = 30;
const DEFAULT_MAX_LEN = 6;

/** One position in the enumeration walk: a state plus the prefix read so far. */
interface EnumerationFrame {
  state: string;
  word: string;
}

/** Queue every unvisited (state, word) pair one transition away from `frame`. */
function enqueueSuccessors(
  fa: FAProgram,
  frame: EnumerationFrame,
  seen: Set<string>,
  queue: EnumerationFrame[],
): void {
  const transitions = fa.transitions[frame.state] ?? {};
  for (const [symbol, targets] of Object.entries(transitions)) {
    for (const next of targets) {
      const nextWord = frame.word + symbol;
      const key = `${next}::${nextWord}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ state: next, word: nextWord });
    }
  }
}

/**
 * Breadth-first walk over (state, prefix) pairs, collecting the prefix every
 * time an accept state is reached. Stops as soon as `collectLimit` words are
 * in hand, so a runaway grammar can never lock up the UI.
 */
function collectAcceptedWords(
  fa: FAProgram,
  maxLen: number,
  collectLimit: number,
): Set<string> {
  const acceptStates = new Set(fa.acceptStates);
  const accepted = new Set<string>();
  // Read with a moving index rather than `shift()`, which is O(queue length).
  const queue: EnumerationFrame[] = [{ state: fa.startState, word: "" }];
  // Avoid revisiting (state, word) pairs.
  const seen = new Set<string>([`${fa.startState}::`]);

  for (let head = 0; head < queue.length; head++) {
    const frame = queue[head];

    if (acceptStates.has(frame.state)) {
      accepted.add(frame.word);
      if (accepted.size >= collectLimit) break;
    }

    if (frame.word.length < maxLen) {
      enqueueSuccessors(fa, frame, seen, queue);
    }
  }

  return accepted;
}

/** Shortest first, then alphabetically — the order a reader expects. */
function byLengthThenAlphabetically(a: string, b: string): number {
  if (a.length !== b.length) return a.length - b.length;
  return a.localeCompare(b);
}

/**
 * Every word a grammar derives up to a length cap: BFS over (state, prefix) pairs
 * of the converted NFA, bounded by `maxLen` and `maxWords` so a runaway grammar
 * cannot lock up the UI.
 */
export function enumerateLanguage(
  grammar: RegularGrammar,
  opts: { maxLen?: number; maxWords?: number } = {},
): EnumerateResult {
  const maxLen = opts.maxLen ?? DEFAULT_MAX_LEN;
  const maxWords = opts.maxWords ?? DEFAULT_MAX_WORDS;

  // Collect one word beyond the cap: finding it is what proves the output is
  // actually truncated. Hitting the cap exactly means the language ended there.
  const accepted = collectAcceptedWords(
    grammarToAutomaton(grammar),
    maxLen,
    maxWords + 1,
  );

  const words = [...accepted].sort(byLengthThenAlphabetically);
  const truncated = words.length > maxWords;
  return { words: truncated ? words.slice(0, maxWords) : words, truncated };
}

export interface RecognizeResult {
  accepted: boolean;
  /**
   * Why the run ended, as a translation-key suffix under
   * `rl.simulator.reason.*` — the UI renders it with the states interpolated.
   */
  reasonCode: "accepted" | "rejectedStates" | "rejectedDeadEnd";
  /** States the run ended in, ready for interpolation. */
  states: string;
}

/** Does the grammar derive the given word? Uses NFA simulation. */
export function recognizeWord(
  grammar: RegularGrammar,
  word: string,
): RecognizeResult {
  return simulateFA(grammarToAutomaton(grammar), word);
}

/**
 * {@link recognizeWord} for a batch of words. Converts the grammar to an
 * automaton once instead of once per word — which is what the word recognizer
 * (re-running on every keystroke) and the exercise checkers actually do.
 */
export function recognizeWords(
  grammar: RegularGrammar,
  words: string[],
): RecognizeResult[] {
  const fa = grammarToAutomaton(grammar);
  return words.map((word) => simulateFA(fa, word));
}

/** Run one word to a halt; the guard only trips if a run stops progressing. */
function simulateFA(program: FAProgram, word: string): RecognizeResult {
  let runtime = createInitialRuntime(program, word.split(""));
  let guard = word.length + 8;
  while (!runtime.halted && guard-- > 0) {
    runtime = stepRuntime(program, runtime);
  }
  const accepted = runtime.haltReason?.type === "accepted";
  const states = runtime.activeStates.join(", ") || "∅";

  if (accepted) return { accepted: true, reasonCode: "accepted", states };
  // An empty state set means the run hit a symbol with no transition.
  if (runtime.activeStates.length === 0) {
    return { accepted: false, reasonCode: "rejectedDeadEnd", states };
  }
  return { accepted: false, reasonCode: "rejectedStates", states };
}

/** One prefix-tree node: its outgoing symbols, and whether a word ends here. */
interface PrefixNode {
  children: Map<string, PrefixNode>;
  accepting: boolean;
}

const makePrefixNode = (): PrefixNode => ({
  children: new Map(),
  accepting: false,
});

/** Trim, drop duplicates, and keep the order the learner typed. */
function cleanWords(words: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of words) {
    const word = raw.trim();
    if (seen.has(word)) continue;
    seen.add(word);
    result.push(word);
  }
  return result;
}

interface PrefixTree {
  root: PrefixNode;
  /** Every node below the root, in the order the words created them. */
  created: PrefixNode[];
}

/**
 * The prefix tree (trie) of `words`: one node per distinct prefix, edges
 * labelled with the symbol that extends it, and a node marked accepting when
 * some word ends there.
 */
function buildPrefixTree(words: string[]): PrefixTree {
  const root = makePrefixNode();
  const created: PrefixNode[] = [];
  for (const word of words) {
    let current = root;
    for (const ch of word) {
      let next = current.children.get(ch);
      if (!next) {
        next = makePrefixNode();
        created.push(next);
        current.children.set(ch, next);
      }
      current = next;
    }
    current.accepting = true;
  }
  return { root, created };
}

/** A grammar with a start symbol and no productions: the empty language. */
function emptyLanguageGrammar(): RegularGrammar {
  return {
    nonTerminals: [NON_TERMINAL_NAMES.start],
    terminals: [],
    startSymbol: NON_TERMINAL_NAMES.start,
    productions: [],
    epsilonProducingNonTerminals: [],
  };
}

/** Child edges in a stable order, so the printed grammar never shuffles. */
function sortedChildren(
  node: PrefixNode,
): Array<{ terminal: string; to: PrefixNode }> {
  return [...node.children.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([terminal, to]) => ({ terminal, to }));
}

/**
 * A right-linear grammar deriving every word in `words`, via a prefix tree: each
 * unique prefix becomes a non-terminal, each edge a single-symbol production, and
 * a word ending marks its node ε-producing.
 */
export function languageToGrammar(words: string[]): RegularGrammar {
  const cleaned = cleanWords(words);

  // Distinguish "no productions" from "accepts only ε".
  if (cleaned.length === 0) {
    return emptyLanguageGrammar();
  }

  const { root, created } = buildPrefixTree(cleaned);

  // One non-terminal per prefix, numbered in the order the words introduced
  // them. Deliberately *not* the shared A, B, C… naming: numbered names are the
  // visible cue that this view keeps one state per prefix rather than merging.
  const names = new Map<PrefixNode, string>([[root, NON_TERMINAL_NAMES.start]]);
  created.forEach((node, index) => names.set(node, `A${index + 1}`));

  const nonTerminals: string[] = [];
  const terminals = new Set<string>();
  const productions: ProductionRule[] = [];
  const epsilonNTs: string[] = [];

  const walk = (node: PrefixNode) => {
    const name = names.get(node)!;
    nonTerminals.push(name);
    if (node.accepting) epsilonNTs.push(name);
    for (const [terminal, child] of node.children) {
      terminals.add(terminal);
      productions.push({
        lhs: name,
        terminal,
        nextNonTerminal: names.get(child)!,
      });
      walk(child);
    }
  };
  walk(root);

  return {
    nonTerminals,
    terminals: [...terminals],
    startSymbol: NON_TERMINAL_NAMES.start,
    productions,
    epsilonProducingNonTerminals: epsilonNTs,
  };
}

/**
 * The shortest readable right-linear grammar for a finite word list. Where
 * {@link languageToGrammar} emits one non-terminal per prefix, this merges states
 * accepting the same suffixes (the minimal acyclic automaton) and folds the
 * single accepting state away, so a transition into it prints as `A -> a` rather
 * than `A -> aE` plus `E -> ε`.
 */
export function languageToGrammarMinimal(words: string[]): RegularGrammar {
  const cleaned = cleanWords(words);

  if (cleaned.length === 0) {
    return emptyLanguageGrammar();
  }

  const { root } = buildPrefixTree(cleaned);

  // Merge equivalent subtrees bottom-up (replace-or-register). Two nodes are
  // equivalent when they have the same accepting flag and the same labelled
  // edges to already-canonicalised children.
  const registry = new Map<string, PrefixNode>();
  const idOf = new Map<PrefixNode, number>();
  let nextId = 0;
  const signature = (node: PrefixNode): string => {
    const edges = sortedChildren(node)
      .map(({ terminal, to }) => `${terminal}:${idOf.get(to)}`)
      .join(",");
    return `${node.accepting ? "1" : "0"}#${edges}`;
  };
  const minimize = (node: PrefixNode): PrefixNode => {
    for (const [terminal, child] of [...node.children]) {
      node.children.set(terminal, minimize(child));
    }
    const sig = signature(node);
    const existing = registry.get(sig);
    if (existing) return existing;
    registry.set(sig, node);
    idOf.set(node, nextId++);
    return node;
  };
  const canonicalRoot = minimize(root);

  // The unique accepting leaf (accepts only ε, no outgoing edges) is folded away
  // unless the start symbol itself is that node (language = {ε}).
  const endLeaf = [...registry.values()].find(
    (node) => node.accepting && node.children.size === 0,
  );

  return emitRightLinearGrammar<PrefixNode>({
    start: canonicalRoot,
    edgesOf: sortedChildren,
    isAccepting: (node) => node.accepting,
    foldedNode: endLeaf === canonicalRoot ? undefined : endLeaf,
  });
}
