import type { ProductionRule, RegularGrammar } from "./rlTypes";

/**
 * Naming and emission rules shared by everything that builds a right-linear
 * grammar here — the prefix-tree builders, the set-builder walker, the
 * minimiser and the transfer codec. Keeping them in one place is what lets a
 * grammar survive an export/import round trip with the same names it had.
 */
export const NON_TERMINAL_NAMES = {
  /** The start symbol. Held out of {@link NON_TERMINAL_NAMES.sequence}
   *  so no other non-terminal can ever collide with it. */
  start: "S",
  /** Every other uppercase letter in order, with the start symbol skipped. */
  sequence: "ABCDEFGHIJKLMNOPQRTUVWXYZ",
} as const;

/**
 * The name of the `index`-th non-start non-terminal: A, B, C, … Z, and then
 * N26, N27, … for grammars that outgrow the alphabet.
 */
export function nonTerminalName(index: number): string {
  return NON_TERMINAL_NAMES.sequence[index] ?? `N${index + 1}`;
}

/**
 * A right-linear grammar seen as a graph: non-terminals are nodes and a
 * production `A -> aB` is an edge from A to B labelled `a`.
 */
export interface GrammarGraph<TNode> {
  start: TNode;
  /** Outgoing edges, already in the order the productions should print in. */
  edgesOf: (node: TNode) => Iterable<{ terminal: string; to: TNode }>;
  isAccepting: (node: TNode) => boolean;
  /**
   * The node that accepts ε and nothing else, if it should be folded away:
   * `A -> aB` plus `B -> ε` prints more readably as `A -> a`. Must never be
   * the start node — a grammar always needs its start symbol.
   */
  foldedNode?: TNode;
}

/**
 * Walk a grammar graph breadth-first from its start node, name the nodes
 * S, A, B, C, … in the order they are reached, and read the productions off
 * the edges. Nodes unreachable from the start are dropped: they cannot
 * contribute to any derivation.
 */
export function emitRightLinearGrammar<TNode>({
  start,
  edgesOf,
  isAccepting,
  foldedNode,
}: GrammarGraph<TNode>): RegularGrammar {
  const names = new Map<TNode, string>([[start, NON_TERMINAL_NAMES.start]]);
  const order: TNode[] = [start];
  const queue: TNode[] = [start];
  let nextIndex = 0;

  for (let head = 0; head < queue.length; head++) {
    for (const edge of edgesOf(queue[head])) {
      if (edge.to === foldedNode || names.has(edge.to)) continue;
      names.set(edge.to, nonTerminalName(nextIndex++));
      order.push(edge.to);
      queue.push(edge.to);
    }
  }

  const nonTerminals: string[] = [];
  const terminals = new Set<string>();
  const productions: ProductionRule[] = [];
  const epsilonProducingNonTerminals: string[] = [];

  for (const node of order) {
    const name = names.get(node)!;
    nonTerminals.push(name);
    if (isAccepting(node)) epsilonProducingNonTerminals.push(name);

    for (const edge of edgesOf(node)) {
      terminals.add(edge.terminal);
      productions.push({
        lhs: name,
        terminal: edge.terminal,
        // An edge into the folded node becomes a terminal-only rule.
        nextNonTerminal:
          edge.to === foldedNode ? null : (names.get(edge.to) ?? null),
      });
    }
  }

  return {
    nonTerminals,
    terminals: [...terminals],
    startSymbol: NON_TERMINAL_NAMES.start,
    productions,
    epsilonProducingNonTerminals,
  };
}
