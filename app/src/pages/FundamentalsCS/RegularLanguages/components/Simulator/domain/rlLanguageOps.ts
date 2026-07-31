import { grammarToAutomaton } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faGrammarConversion";
import type { FAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import {
  createInitialRuntime,
  stepRuntime,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faMachine";
import type { ProductionRule, RegularGrammar } from "./rlTypes";

export interface EnumerateResult {
  words: string[];
  truncated: boolean;
}

const DEFAULT_MAX_WORDS = 30;
const DEFAULT_MAX_LEN = 6;

/**
 * Enumerate all words derivable from a regular grammar up to a length cap.
 *
 * Implementation: convert grammar to NFA, do BFS over (state, prefix) pairs.
 * Accept whenever an accept state is reached. Bounded by `maxLen` and
 * `maxWords` to keep runaway grammars from locking up the UI.
 */
export function enumerateLanguage(
  grammar: RegularGrammar,
  opts: { maxLen?: number; maxWords?: number } = {},
): EnumerateResult {
  const maxLen = opts.maxLen ?? DEFAULT_MAX_LEN;
  const maxWords = opts.maxWords ?? DEFAULT_MAX_WORDS;

  const fa = grammarToAutomaton(grammar);
  const accepted = new Set<string>();
  // Each entry: [currentState, prefix]
  type Frame = { state: string; word: string };
  const queue: Frame[] = [{ state: fa.startState, word: "" }];
  // Avoid revisiting (state, word) pairs.
  const seen = new Set<string>([`${fa.startState}::`]);

  // Collect one word beyond the cap: finding it is what proves the output is
  // actually truncated. Hitting the cap exactly means the language ended there.
  const collectLimit = maxWords + 1;

  while (queue.length > 0 && accepted.size < collectLimit) {
    const { state, word } = queue.shift()!;

    if (fa.acceptStates.includes(state)) {
      accepted.add(word);
      if (accepted.size >= collectLimit) break;
    }

    if (word.length >= maxLen) continue;

    const transitions = fa.transitions[state] ?? {};
    for (const [symbol, targets] of Object.entries(transitions)) {
      for (const next of targets) {
        const nextWord = word + symbol;
        const key = `${next}::${nextWord}`;
        if (seen.has(key)) continue;
        seen.add(key);
        queue.push({ state: next, word: nextWord });
      }
    }
  }

  const words = [...accepted].sort((a, b) => {
    if (a.length !== b.length) return a.length - b.length;
    return a.localeCompare(b);
  });

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
  const fa = grammarToAutomaton(grammar);
  return simulateFA(fa, word);
}

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

/**
 * Build a right-linear regular grammar that derives at least every word in
 * `words`. Uses a prefix tree: each unique prefix becomes a non-terminal and
 * each edge becomes a single-symbol production. Word endings mark the node
 * as ε-producing.
 */
export function languageToGrammar(words: string[]): RegularGrammar {
  const cleaned = words
    .map((w) => w.trim())
    .filter((w, idx, arr) => arr.indexOf(w) === idx);

  // Distinguish "no productions" from "accepts only ε".
  if (cleaned.length === 0) {
    return {
      nonTerminals: ["S"],
      terminals: [],
      startSymbol: "S",
      productions: [],
      epsilonProducingNonTerminals: [],
    };
  }

  interface Node {
    name: string;
    children: Map<string, Node>;
    accepting: boolean;
  }

  let counter = 0;
  const root: Node = { name: "S", children: new Map(), accepting: false };

  for (const word of cleaned) {
    let current = root;
    if (word.length === 0) {
      current.accepting = true;
      continue;
    }
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      let next = current.children.get(ch);
      if (!next) {
        next = {
          name: `A${++counter}`,
          children: new Map(),
          accepting: false,
        };
        current.children.set(ch, next);
      }
      current = next;
    }
    current.accepting = true;
  }

  const nonTerminals: string[] = [];
  const terminals = new Set<string>();
  const productions: ProductionRule[] = [];
  const epsilonNTs: string[] = [];

  const walk = (node: Node) => {
    nonTerminals.push(node.name);
    if (node.accepting) epsilonNTs.push(node.name);
    for (const [symbol, child] of node.children.entries()) {
      terminals.add(symbol);
      productions.push({
        lhs: node.name,
        terminal: symbol,
        nextNonTerminal: child.name,
      });
      walk(child);
    }
  };

  walk(root);

  return {
    nonTerminals,
    terminals: [...terminals],
    startSymbol: root.name,
    productions,
    epsilonProducingNonTerminals: epsilonNTs,
  };
}

/**
 * Build the *shortest, most readable* right-linear grammar for a finite list of
 * words. Where {@link languageToGrammar} emits one non-terminal per prefix, this
 * merges states that accept the same set of suffixes (the minimal acyclic
 * automaton / DAWG), then prints productions compactly:
 *
 *   - equal suffixes share a non-terminal (no redundant duplicate branches),
 *   - the single accepting "end" state is folded away, so a transition into it
 *     becomes a terminal-only rule `A -> a` instead of `A -> aE` plus `E -> ε`.
 *
 * The result still generates exactly the listed words and stays right-linear.
 */
export function languageToGrammarMinimal(words: string[]): RegularGrammar {
  const cleaned = words
    .map((w) => w.trim())
    .filter((w, idx, arr) => arr.indexOf(w) === idx);

  if (cleaned.length === 0) {
    return {
      nonTerminals: ["S"],
      terminals: [],
      startSymbol: "S",
      productions: [],
      epsilonProducingNonTerminals: [],
    };
  }

  interface Node {
    children: Map<string, Node>;
    accepting: boolean;
  }
  const makeNode = (): Node => ({ children: new Map(), accepting: false });

  // 1. Build the prefix tree.
  const root = makeNode();
  for (const word of cleaned) {
    let current = root;
    if (word.length === 0) {
      current.accepting = true;
      continue;
    }
    for (const ch of word) {
      let next = current.children.get(ch);
      if (!next) {
        next = makeNode();
        current.children.set(ch, next);
      }
      current = next;
    }
    current.accepting = true;
  }

  // 2. Merge equivalent subtrees bottom-up (replace-or-register). Two nodes are
  //    equivalent when they have the same accepting flag and the same labelled
  //    edges to already-canonicalised children.
  const registry = new Map<string, Node>();
  const idOf = new Map<Node, number>();
  let nextId = 0;
  const signature = (node: Node): string => {
    const edges = [...node.children.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([sym, child]) => `${sym}:${idOf.get(child)}`)
      .join(",");
    return `${node.accepting ? "1" : "0"}#${edges}`;
  };
  const minimize = (node: Node): Node => {
    for (const [sym, child] of [...node.children.entries()]) {
      node.children.set(sym, minimize(child));
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
  const dropEndLeaf = endLeaf !== undefined && endLeaf !== canonicalRoot;

  // 3. Name the kept nodes (start = S, then A, B, C, …) in BFS order.
  const LETTERS = "ABCDEFGHIJKLMNOPQRTUVWXYZ";
  const names = new Map<Node, string>();
  names.set(canonicalRoot, "S");
  const order: Node[] = [canonicalRoot];
  const queue: Node[] = [canonicalRoot];
  let letterIdx = 0;
  while (queue.length > 0) {
    const node = queue.shift()!;
    const edges = [...node.children.entries()].sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0,
    );
    for (const [, child] of edges) {
      if (dropEndLeaf && child === endLeaf) continue;
      if (names.has(child)) continue;
      names.set(child, LETTERS[letterIdx++] ?? `N${letterIdx}`);
      order.push(child);
      queue.push(child);
    }
  }

  // 4. Emit productions.
  const nonTerminals: string[] = [];
  const terminals = new Set<string>();
  const productions: ProductionRule[] = [];
  const epsilonNTs: string[] = [];
  for (const node of order) {
    const name = names.get(node)!;
    nonTerminals.push(name);
    if (node.accepting) epsilonNTs.push(name);
    const edges = [...node.children.entries()].sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0,
    );
    for (const [symbol, child] of edges) {
      terminals.add(symbol);
      const foldsToEnd = dropEndLeaf && child === endLeaf;
      productions.push({
        lhs: name,
        terminal: symbol,
        nextNonTerminal: foldsToEnd ? null : names.get(child)!,
      });
    }
  }

  return {
    nonTerminals,
    terminals: [...terminals],
    startSymbol: "S",
    productions,
    epsilonProducingNonTerminals: epsilonNTs,
  };
}
