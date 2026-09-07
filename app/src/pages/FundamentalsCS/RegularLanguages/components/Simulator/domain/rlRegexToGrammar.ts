import type { RegexNode, RegularGrammar } from "./rlTypes";
import type { ExponentSpec, SetBuilderLang } from "./rlLanguageSpecParser";
import { emitRightLinearGrammar } from "./rlGrammarNaming";

/** One position in the chain a set-builder pattern is laid out as. */
interface ChainNode {
  edges: Array<{ terminal: string; to: ChainNode }>;
}

function makeChainNode(): ChainNode {
  return { edges: [] };
}

/** How many times a factor must be repeated at minimum. */
function mandatoryRepetitions(exponent: ExponentSpec): number {
  if (exponent.kind === "literal") return exponent.count;
  if (exponent.kind === "variable") return exponent.lowerBound;
  return 1;
}

/** Spell `chars` out as a fresh chain of edges and return the node it ends on. */
function appendChars(from: ChainNode, chars: string[]): ChainNode {
  let current = from;
  for (const terminal of chars) {
    const next = makeChainNode();
    current.edges.push({ terminal, to: next });
    current = next;
  }
  return current;
}

/** Any number of extra repetitions: a loop from `at` back to itself. */
function appendRepetitionLoop(at: ChainNode, chars: string[]): void {
  let node = at;
  chars.forEach((terminal, index) => {
    const next = index === chars.length - 1 ? at : makeChainNode();
    node.edges.push({ terminal, to: next });
    node = next;
  });
}

/**
 * Lay the pattern out as a chain: every mandatory repetition consumes one
 * symbol and advances, and every variable exponent adds a self-loop at the
 * position it reached. Returns the chain's start and its accepting end.
 */
function buildSetBuilderChain(spec: SetBuilderLang): {
  start: ChainNode;
  accept: ChainNode;
} {
  const start = makeChainNode();
  let current = start;

  for (const factor of spec.pattern) {
    const chars = [...atomToTerminalString(factor.atom)];
    // `ε` and empty groups contribute nothing — and a zero-length loop would
    // never terminate.
    if (chars.length === 0) continue;

    for (
      let repeat = 0;
      repeat < mandatoryRepetitions(factor.exponent);
      repeat++
    ) {
      current = appendChars(current, chars);
    }

    if (factor.exponent.kind === "variable") {
      appendRepetitionLoop(current, chars);
    }
  }

  return { start, accept: current };
}

/**
 * Build a strictly right-linear grammar for a set-builder spec: the pattern is
 * walked symbol by symbol and read off as `A -> aB | a | ε` rules only.
 * {@link minimizeRightLinearGrammar} provides the shorter view without leaving
 * Type 3.
 */
export function setBuilderToRightLinearGrammar(
  spec: SetBuilderLang,
): RegularGrammar {
  const { start, accept } = buildSetBuilderChain(spec);

  // A transition into the accepting node folds into a terminal-only rule
  // (`A -> a`) as long as nothing leaves that node — when the last factor has
  // a variable exponent the accept node carries the loop, so it stays and
  // becomes ε-producing instead.
  const acceptIsFoldable = accept.edges.length === 0 && accept !== start;

  return emitRightLinearGrammar<ChainNode>({
    start,
    edgesOf: (node) => node.edges,
    isAccepting: (node) => node === accept,
    foldedNode: acceptIsFoldable ? accept : undefined,
  });
}

/**
 * Marker for the implicit accepting state behind `A -> a` rules. The leading
 * space keeps it distinct from every real non-terminal: the grammar parser
 * reads a left-hand side as `\S+`, so a name can never contain whitespace.
 */
const FINAL_NODE = " final";

/** A right-linear grammar seen as a labelled graph over its non-terminals. */
interface GrammarAutomaton {
  nodes: string[];
  edgesOf: Map<string, Array<{ terminal: string; to: string }>>;
  isAccepting: (node: string) => boolean;
}

/**
 * Read the grammar off as a graph: terminal-only rules (`A -> a`) point at the
 * shared {@link FINAL_NODE}, which exists only while some rule needs it.
 */
function toGrammarAutomaton(grammar: RegularGrammar): GrammarAutomaton {
  const epsilonProducers = new Set(grammar.epsilonProducingNonTerminals ?? []);
  const usesFinalNode = grammar.productions.some(
    (rule) => rule.nextNonTerminal === null,
  );

  const nodes = [...grammar.nonTerminals];
  if (usesFinalNode) nodes.push(FINAL_NODE);

  const edgesOf = new Map<string, Array<{ terminal: string; to: string }>>(
    nodes.map((node) => [node, []]),
  );
  for (const rule of grammar.productions) {
    edgesOf.get(rule.lhs)?.push({
      terminal: rule.terminal,
      to: rule.nextNonTerminal ?? FINAL_NODE,
    });
  }

  return {
    nodes,
    edgesOf,
    isAccepting: (node) => node === FINAL_NODE || epsilonProducers.has(node),
  };
}

/**
 * Partition refinement: separate the accepting nodes, then keep splitting a block
 * whenever two members disagree about which block a terminal leads into. Maps
 * every node to its block id.
 */
function refineIntoBlocks({
  nodes,
  edgesOf,
  isAccepting,
}: GrammarAutomaton): Map<string, number> {
  let blockOf = new Map<string, number>(
    nodes.map((node) => [node, isAccepting(node) ? 0 : 1]),
  );

  for (;;) {
    const signature = (node: string) => {
      const targets = new Set(
        (edgesOf.get(node) ?? []).map(
          (edge) => `${edge.terminal}${blockOf.get(edge.to)}`,
        ),
      );
      return `${blockOf.get(node)}${[...targets].sort().join("")}`;
    };

    const idBySignature = new Map<string, number>();
    const next = new Map<string, number>();
    for (const node of nodes) {
      const sig = signature(node);
      const id = idBySignature.get(sig) ?? idBySignature.size;
      idBySignature.set(sig, id);
      next.set(node, id);
    }

    if (idBySignature.size === new Set(blockOf.values()).size) return blockOf;
    blockOf = next;
  }
}

/** The nodes of each block, keyed by block id. */
function groupByBlock(
  nodes: string[],
  blockOf: Map<string, number>,
): Map<number, string[]> {
  const membersOf = new Map<number, string[]>();
  for (const node of nodes) {
    const block = blockOf.get(node)!;
    membersOf.set(block, [...(membersOf.get(block) ?? []), node]);
  }
  return membersOf;
}

/** The union of a block's outgoing edges, deduplicated and terminal-sorted. */
function mergeBlockEdges(
  members: string[],
  { edgesOf }: GrammarAutomaton,
  blockOf: Map<string, number>,
): Array<{ terminal: string; to: number }> {
  const seen = new Set<string>();
  const edges: Array<{ terminal: string; to: number }> = [];

  for (const member of members) {
    for (const edge of edgesOf.get(member) ?? []) {
      const target = blockOf.get(edge.to)!;
      const key = `${edge.terminal}${target}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ terminal: edge.terminal, to: target });
    }
  }

  edges.sort((a, b) =>
    a.terminal < b.terminal ? -1 : a.terminal > b.terminal ? 1 : 0,
  );
  return edges;
}

/**
 * Collapse a right-linear grammar to its smallest equivalent one by merging
 * non-terminals that derive the same words (a bisimulation quotient). The result
 * stays strictly right-linear, and an already minimal grammar comes back
 * unchanged.
 */
export function minimizeRightLinearGrammar(
  grammar: RegularGrammar,
): RegularGrammar {
  const automaton = toGrammarAutomaton(grammar);
  const blockOf = refineIntoBlocks(automaton);
  const membersOf = groupByBlock(automaton.nodes, blockOf);

  const blockEdges = new Map<number, Array<{ terminal: string; to: number }>>();
  const blockAccepting = new Map<number, boolean>();
  for (const [block, members] of membersOf) {
    blockAccepting.set(block, members.some(automaton.isAccepting));
    blockEdges.set(block, mergeBlockEdges(members, automaton, blockOf));
  }

  const startBlock = blockOf.get(grammar.startSymbol)!;
  // A block that only accepts ε folds away: `A -> aB` plus `B -> ε` is just
  // `A -> a`. The start block is kept even when it qualifies.
  const foldableBlock = [...membersOf.keys()].find(
    (block) =>
      block !== startBlock &&
      blockAccepting.get(block) === true &&
      (blockEdges.get(block) ?? []).length === 0,
  );

  return emitRightLinearGrammar<number>({
    start: startBlock,
    edgesOf: (block) => blockEdges.get(block) ?? [],
    isAccepting: (block) => blockAccepting.get(block) === true,
    foldedNode: foldableBlock,
  });
}

/** The literal word an atom stands for — only fixed atoms have one. */
function atomToTerminalString(node: RegexNode): string {
  if (node.kind === "symbol") return node.value;
  if (node.kind === "epsilon") return "";
  if (node.kind === "concat") {
    return atomToTerminalString(node.left) + atomToTerminalString(node.right);
  }
  // The set-builder parser never produces union/star/empty atoms, so this
  // path is only reachable from a bad call site — fail loudly rather than
  // silently emit garbage.
  throw new Error("Cannot render a non-linear atom as a flat terminal string.");
}

/**
 * Format a grammar as printable production lines for display.
 * Lines are grouped per non-terminal and alternatives joined with `|`.
 */
export function formatGrammar(grammar: RegularGrammar): string {
  const grouped = new Map<string, string[]>();
  const epsilonSet = new Set(grammar.epsilonProducingNonTerminals ?? []);

  for (const rule of grammar.productions) {
    const rhs = rule.nextNonTerminal
      ? `${rule.terminal}${rule.nextNonTerminal}`
      : rule.terminal;
    const list = grouped.get(rule.lhs) ?? [];
    list.push(rhs);
    grouped.set(rule.lhs, list);
  }

  // Ensure ε-only non-terminals also appear.
  for (const nt of epsilonSet) {
    if (!grouped.has(nt)) grouped.set(nt, []);
  }

  // Order: start symbol first, then by appearance.
  const ordered = [
    grammar.startSymbol,
    ...grammar.nonTerminals.filter((n) => n !== grammar.startSymbol),
  ];

  const lines: string[] = [];
  for (const nt of ordered) {
    if (!grouped.has(nt)) continue;
    const alts = grouped.get(nt)!;
    if (epsilonSet.has(nt)) alts.push("ε");
    if (alts.length === 0) continue;
    lines.push(`${nt} -> ${alts.join(" | ")}`);
  }
  return lines.join("\n");
}
