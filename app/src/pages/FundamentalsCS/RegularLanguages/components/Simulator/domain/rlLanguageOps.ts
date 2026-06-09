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

  while (queue.length > 0 && accepted.size < maxWords) {
    const { state, word } = queue.shift()!;

    if (fa.acceptStates.includes(state)) {
      accepted.add(word);
      if (accepted.size >= maxWords) break;
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

  return { words, truncated: accepted.size >= maxWords };
}

/** Does the grammar derive the given word? Uses NFA simulation. */
export function recognizeWord(
  grammar: RegularGrammar,
  word: string,
): { accepted: boolean; reason: string } {
  const fa = grammarToAutomaton(grammar);
  return simulateFA(fa, word);
}

function simulateFA(
  program: FAProgram,
  word: string,
): { accepted: boolean; reason: string } {
  let runtime = createInitialRuntime(program, word.split(""));
  let guard = word.length + 8;
  while (!runtime.halted && guard-- > 0) {
    runtime = stepRuntime(program, runtime);
  }
  const accepted = runtime.haltReason?.type === "accepted";
  const reachedStates = runtime.activeStates.join(", ") || "∅";
  return {
    accepted,
    reason: accepted
      ? `Halted in accepting state(s): ${reachedStates}`
      : runtime.haltReason?.type === "rejected" &&
          runtime.activeStates.length === 0
        ? "No transition for the next symbol — rejected."
        : `Halted in non-accepting state(s): ${reachedStates}`,
  };
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
