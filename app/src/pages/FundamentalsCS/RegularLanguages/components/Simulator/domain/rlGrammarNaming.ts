import type { ProductionRule, RegularGrammar } from "./rlTypes";

/**
 * Naming and emission rules shared by everything that builds a right-linear
 * grammar here. One place for them is what lets a grammar survive an
 * export/import round trip with the same names.
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
 * Breadth-first from the start node, naming nodes S, A, B, C, … in the order they
 * are reached. The folded node stays unnamed; unreachable nodes are never
 * enqueued.
 */
function assignNonTerminalNames<TNode>({
  start,
  edgesOf,
  foldedNode,
}: GrammarGraph<TNode>): { names: Map<TNode, string>; order: TNode[] } {
  const names = new Map<TNode, string>([[start, NON_TERMINAL_NAMES.start]]);
  const order: TNode[] = [start];
  let nextIndex = 0;

  for (let head = 0; head < order.length; head++) {
    for (const edge of edgesOf(order[head])) {
      if (edge.to === foldedNode || names.has(edge.to)) continue;
      names.set(edge.to, nonTerminalName(nextIndex++));
      order.push(edge.to);
    }
  }

  return { names, order };
}

/** One production per outgoing edge, in the edge order the caller supplied. */
function productionsOf<TNode>(
  node: TNode,
  lhs: string,
  { edgesOf, foldedNode }: GrammarGraph<TNode>,
  names: Map<TNode, string>,
): ProductionRule[] {
  return [...edgesOf(node)].map((edge) => ({
    lhs,
    terminal: edge.terminal,
    // An edge into the folded node becomes a terminal-only rule.
    nextNonTerminal:
      edge.to === foldedNode ? null : (names.get(edge.to) ?? null),
  }));
}

/**
 * Walk a grammar graph breadth-first, name the nodes S, A, B, C, … and read the
 * productions off the edges. Unreachable nodes are dropped.
 */
export function emitRightLinearGrammar<TNode>(
  graph: GrammarGraph<TNode>,
): RegularGrammar {
  const { names, order } = assignNonTerminalNames(graph);

  const nonTerminals: string[] = [];
  const terminals = new Set<string>();
  const productions: ProductionRule[] = [];
  const epsilonProducingNonTerminals: string[] = [];

  for (const node of order) {
    const name = names.get(node)!;
    nonTerminals.push(name);
    if (graph.isAccepting(node)) epsilonProducingNonTerminals.push(name);

    for (const rule of productionsOf(node, name, graph, names)) {
      terminals.add(rule.terminal);
      productions.push(rule);
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
