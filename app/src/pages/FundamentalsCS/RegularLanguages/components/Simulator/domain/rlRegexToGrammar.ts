import type { ProductionRule, RegexNode, RegularGrammar } from "./rlTypes";
import type { SetBuilderLang } from "./rlLanguageSpecParser";

/**
 * Thompson-style ε-NFA used internally as the bridge between a regex AST
 * and a right-linear regular grammar.
 */
interface NFA {
  states: string[];
  start: string;
  accept: string;
  /** transitions[from][symbol] -> set of target states; symbol "" denotes ε. */
  transitions: Map<string, Map<string, Set<string>>>;
}

function freshNFA(prefix: { value: number }): {
  start: string;
  accept: string;
} {
  const start = `q${prefix.value++}`;
  const accept = `q${prefix.value++}`;
  return { start, accept };
}

function emptyTransitions(): Map<string, Map<string, Set<string>>> {
  return new Map();
}

function addTransition(
  trans: Map<string, Map<string, Set<string>>>,
  from: string,
  symbol: string,
  to: string,
) {
  let row = trans.get(from);
  if (!row) {
    row = new Map();
    trans.set(from, row);
  }
  let targets = row.get(symbol);
  if (!targets) {
    targets = new Set();
    row.set(symbol, targets);
  }
  targets.add(to);
}

function buildThompsonNFA(ast: RegexNode): NFA {
  const counter = { value: 0 };
  const transitions = emptyTransitions();
  const stateSet = new Set<string>();

  const register = (...ids: string[]) => ids.forEach((id) => stateSet.add(id));

  const build = (node: RegexNode): { start: string; accept: string } => {
    if (node.kind === "empty") {
      // L(∅) = {}; we still need start/accept but no path between them.
      const { start, accept } = freshNFA(counter);
      register(start, accept);
      return { start, accept };
    }
    if (node.kind === "epsilon") {
      const { start, accept } = freshNFA(counter);
      register(start, accept);
      addTransition(transitions, start, "", accept);
      return { start, accept };
    }
    if (node.kind === "symbol") {
      const { start, accept } = freshNFA(counter);
      register(start, accept);
      addTransition(transitions, start, node.value, accept);
      return { start, accept };
    }
    if (node.kind === "concat") {
      const a = build(node.left);
      const b = build(node.right);
      addTransition(transitions, a.accept, "", b.start);
      return { start: a.start, accept: b.accept };
    }
    if (node.kind === "union") {
      const a = build(node.left);
      const b = build(node.right);
      const { start, accept } = freshNFA(counter);
      register(start, accept);
      addTransition(transitions, start, "", a.start);
      addTransition(transitions, start, "", b.start);
      addTransition(transitions, a.accept, "", accept);
      addTransition(transitions, b.accept, "", accept);
      return { start, accept };
    }
    // star
    const inner = build(node.child);
    const { start, accept } = freshNFA(counter);
    register(start, accept);
    addTransition(transitions, start, "", inner.start);
    addTransition(transitions, start, "", accept);
    addTransition(transitions, inner.accept, "", inner.start);
    addTransition(transitions, inner.accept, "", accept);
    return { start, accept };
  };

  const { start, accept } = build(ast);

  return {
    states: [...stateSet],
    start,
    accept,
    transitions,
  };
}

function epsilonClosure(nfa: NFA, states: Set<string>): Set<string> {
  const closure = new Set(states);
  const stack = [...states];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const eps = nfa.transitions.get(current)?.get("");
    if (!eps) continue;
    for (const target of eps) {
      if (!closure.has(target)) {
        closure.add(target);
        stack.push(target);
      }
    }
  }
  return closure;
}

/**
 * Convert a regex AST to a right-linear regular grammar.
 *
 * Strategy: build a Thompson ε-NFA, then read it off as a grammar:
 *   - one non-terminal per state
 *   - transition (p, a, q) becomes  Np → a Nq
 *   - if a state's ε-closure contains the NFA's accept state,
 *     mark it as ε-producing
 * The start NFA state's ε-closure is the grammar's start symbol.
 */
export function regexToGrammar(ast: RegexNode): RegularGrammar {
  const nfa = buildThompsonNFA(ast);

  const stateName = (q: string) => q.replace("q", "S");
  const nonTerminals: string[] = nfa.states.map(stateName);
  const terminals = new Set<string>();
  const productions: ProductionRule[] = [];
  const epsilonProducingNonTerminals: string[] = [];

  for (const state of nfa.states) {
    const closure = epsilonClosure(nfa, new Set([state]));
    if (closure.has(nfa.accept)) {
      epsilonProducingNonTerminals.push(stateName(state));
    }
    // Aggregate transitions reachable from `state` via ε then one symbol then ε.
    for (const intermediate of closure) {
      const row = nfa.transitions.get(intermediate);
      if (!row) continue;
      for (const [symbol, targets] of row.entries()) {
        if (symbol === "") continue;
        terminals.add(symbol);
        for (const target of targets) {
          const reachable = epsilonClosure(nfa, new Set([target]));
          for (const r of reachable) {
            productions.push({
              lhs: stateName(state),
              terminal: symbol,
              nextNonTerminal: stateName(r),
            });
          }
        }
      }
    }
  }

  return {
    nonTerminals,
    terminals: [...terminals],
    startSymbol: stateName(nfa.start),
    productions: dedupeProductions(productions),
    epsilonProducingNonTerminals,
  };
}

function dedupeProductions(rules: ProductionRule[]): ProductionRule[] {
  const seen = new Set<string>();
  const out: ProductionRule[] = [];
  for (const rule of rules) {
    const key = `${rule.lhs}->${rule.terminal}${rule.nextNonTerminal ?? "ε"}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(rule);
  }
  return out;
}

/**
 * Build a strictly right-linear grammar for a set-builder spec.
 *
 * Walks the pattern symbol by symbol and reads the result off as
 * `A -> aB | a | ε` rules only — the shape this module is actually about. An
 * earlier version printed a compact `S -> A c B`, which is a general CFG and
 * therefore not a regular grammar at all; {@link minimizeRightLinearGrammar}
 * now provides the shorter view without leaving Type 3.
 *
 * The pattern is first laid out as a chain of nodes: every mandatory
 * repetition consumes one symbol and advances, and every variable exponent
 * adds a self-loop at the position it reached. Node names are then assigned in
 * chain order (S, A, B, …) and each edge becomes one production.
 */
export function setBuilderToRightLinearGrammar(
  spec: SetBuilderLang,
): RegularGrammar {
  interface Node {
    edges: Array<{ symbol: string; to: Node }>;
  }
  const makeNode = (): Node => ({ edges: [] });

  const start = makeNode();
  let current = start;

  for (const factor of spec.pattern) {
    const chars = [...atomToTerminalString(factor.atom)];
    // `ε` and empty groups contribute nothing — and a zero-length loop would
    // never terminate.
    if (chars.length === 0) continue;

    const exponent = factor.exponent;
    const mandatory =
      exponent.kind === "literal"
        ? exponent.count
        : exponent.kind === "variable"
          ? exponent.lowerBound
          : 1;

    for (let repeat = 0; repeat < mandatory; repeat++) {
      for (const symbol of chars) {
        const next = makeNode();
        current.edges.push({ symbol, to: next });
        current = next;
      }
    }

    if (exponent.kind === "variable") {
      // Any number of extra repetitions: a loop back to where we are now.
      const loopStart = current;
      let node = loopStart;
      chars.forEach((symbol, index) => {
        const next = index === chars.length - 1 ? loopStart : makeNode();
        node.edges.push({ symbol, to: next });
        node = next;
      });
    }
  }

  const accept = current;

  // Name the nodes in breadth-first chain order: S first, then A, B, C, …
  const LETTERS = "ABCDEFGHIJKLMNOPQRTUVWXYZ";
  const names = new Map<Node, string>([[start, "S"]]);
  const order: Node[] = [start];
  const queue: Node[] = [start];
  let letterIdx = 0;
  while (queue.length > 0) {
    const node = queue.shift()!;
    for (const edge of node.edges) {
      if (names.has(edge.to)) continue;
      names.set(edge.to, LETTERS[letterIdx++] ?? `N${letterIdx}`);
      order.push(edge.to);
      queue.push(edge.to);
    }
  }

  // A transition into the accepting node folds into a terminal-only rule
  // (`A -> a`) as long as nothing leaves that node — when the last factor has
  // a variable exponent the accept node carries the loop, so it stays and
  // becomes ε-producing instead.
  const acceptIsFoldable = accept.edges.length === 0 && accept !== start;

  const nonTerminals: string[] = [];
  const terminals = new Set<string>();
  const productions: ProductionRule[] = [];
  const epsilonNTs: string[] = [];

  for (const node of order) {
    if (acceptIsFoldable && node === accept) continue;
    const name = names.get(node)!;
    nonTerminals.push(name);
    if (node === accept) epsilonNTs.push(name);
    for (const edge of node.edges) {
      terminals.add(edge.symbol);
      productions.push({
        lhs: name,
        terminal: edge.symbol,
        nextNonTerminal:
          acceptIsFoldable && edge.to === accept ? null : names.get(edge.to)!,
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

/**
 * Marker for the implicit accepting state behind `A -> a` rules. The leading
 * space keeps it distinct from every real non-terminal: the grammar parser
 * reads a left-hand side as `\S+`, so a name can never contain whitespace.
 */
const FINAL_NODE = " final";

/**
 * Collapse a right-linear grammar to its smallest equivalent right-linear
 * grammar, by merging non-terminals that derive the same set of words.
 *
 * This is a bisimulation quotient: start by separating ε-producing (accepting)
 * non-terminals from the rest, then keep splitting a block whenever two of its
 * members disagree about which block some terminal leads into. Merging what is
 * left over never changes the generated language, and it can only shrink the
 * grammar — a grammar that is already minimal comes back unchanged.
 *
 * The result stays strictly right-linear (`A -> aB | a | ε`), so switching to
 * the simplified view never turns a regular grammar into something else.
 */
export function minimizeRightLinearGrammar(
  grammar: RegularGrammar,
): RegularGrammar {
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
  const isAccepting = (node: string) =>
    node === FINAL_NODE || epsilonProducers.has(node);

  // ── Partition refinement ────────────────────────────────────────────────
  let blockOf = new Map<string, number>(
    nodes.map((node) => [node, isAccepting(node) ? 0 : 1]),
  );
  for (;;) {
    const signature = (node: string) => {
      const targets = new Set(
        (edgesOf.get(node) ?? []).map(
          (edge) => `${edge.terminal}${blockOf.get(edge.to)}`,
        ),
      );
      return `${blockOf.get(node)}${[...targets].sort().join("")}`;
    };

    const idBySignature = new Map<string, number>();
    const next = new Map<string, number>();
    for (const node of nodes) {
      const sig = signature(node);
      let id = idBySignature.get(sig);
      if (id === undefined) {
        id = idBySignature.size;
        idBySignature.set(sig, id);
      }
      next.set(node, id);
    }

    if (idBySignature.size === new Set(blockOf.values()).size) break;
    blockOf = next;
  }

  // ── Rebuild one non-terminal per block ──────────────────────────────────
  const membersOf = new Map<number, string[]>();
  for (const node of nodes) {
    const block = blockOf.get(node)!;
    membersOf.set(block, [...(membersOf.get(block) ?? []), node]);
  }

  const blockEdges = new Map<number, Array<{ terminal: string; to: number }>>();
  const blockAccepting = new Map<number, boolean>();
  for (const [block, members] of membersOf) {
    blockAccepting.set(block, members.some(isAccepting));
    const seen = new Set<string>();
    const edges: Array<{ terminal: string; to: number }> = [];
    for (const member of members) {
      for (const edge of edgesOf.get(member) ?? []) {
        const target = blockOf.get(edge.to)!;
        const key = `${edge.terminal}${target}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({ terminal: edge.terminal, to: target });
      }
    }
    edges.sort((a, b) =>
      a.terminal < b.terminal ? -1 : a.terminal > b.terminal ? 1 : 0,
    );
    blockEdges.set(block, edges);
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

  // ── Name the kept blocks in BFS order: S, then A, B, C, … ────────────────
  const LETTERS = "ABCDEFGHIJKLMNOPQRTUVWXYZ";
  const names = new Map<number, string>([[startBlock, "S"]]);
  const order: number[] = [startBlock];
  const queue: number[] = [startBlock];
  let letterIdx = 0;
  while (queue.length > 0) {
    const block = queue.shift()!;
    for (const edge of blockEdges.get(block) ?? []) {
      if (edge.to === foldableBlock || names.has(edge.to)) continue;
      names.set(edge.to, LETTERS[letterIdx++] ?? `N${letterIdx}`);
      order.push(edge.to);
      queue.push(edge.to);
    }
  }

  const nonTerminals: string[] = [];
  const terminals = new Set<string>();
  const productions: ProductionRule[] = [];
  const epsilonNTs: string[] = [];
  for (const block of order) {
    const name = names.get(block)!;
    nonTerminals.push(name);
    if (blockAccepting.get(block)) epsilonNTs.push(name);
    for (const edge of blockEdges.get(block) ?? []) {
      terminals.add(edge.terminal);
      productions.push({
        lhs: name,
        terminal: edge.terminal,
        nextNonTerminal:
          edge.to === foldableBlock ? null : (names.get(edge.to) ?? null),
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
