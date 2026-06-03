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
 * Build a CFG-style grammar directly from a set-builder spec.
 *
 * Each factor with a variable exponent gets its own non-terminal so that
 * independent exponents stay independent — e.g. {a^n c b^m | n, m > 0}
 * produces
 *     S -> A c B
 *     A -> aA | a
 *     B -> bB | b
 * instead of the Thompson-NFA expansion that the regex-driven path would
 * emit. The output is a *general* CFG (the S production may contain
 * non-terminals in the middle of the right-hand side), so callers that
 * need a strictly right-linear grammar should not rely on it.
 */
export interface SetBuilderGrammar {
  nonTerminals: string[];
  terminals: string[];
  startSymbol: string;
  /** Pre-rendered production text, one rule group per line. */
  displayText: string;
}

export function setBuilderToGrammar(spec: SetBuilderLang): SetBuilderGrammar {
  const startSymbol = "S";
  const terminals = new Set<string>();
  const productionLines: string[] = [];
  const nonTerminals: string[] = [startSymbol];

  // Collapse the trivial case `{x^n | n ≥ k}` into a single recursive S so
  // we don't emit a pointless `S -> A`. Anything more interesting goes
  // through the general path so the resulting grammar reads naturally.
  if (spec.pattern.length === 1) {
    const f = spec.pattern[0];
    const exp = f.exponent;
    if (exp.kind === "variable") {
      const atomText = atomToTerminalString(f.atom);
      collectTerminals(f.atom, terminals);
      productionLines.push(
        formatRecursiveRule(startSymbol, atomText, exp.lowerBound),
      );
      return {
        nonTerminals,
        terminals: [...terminals],
        startSymbol,
        displayText: productionLines.join("\n"),
      };
    }
  }

  // Pool of non-terminal names for variable factors: A, B, C, … (skip S).
  const LETTERS = "ABCDEFGHIJKLMNOPQRTUVWXYZ";
  let letterIdx = 0;
  const factorNT: (string | null)[] = spec.pattern.map(() => null);
  for (let i = 0; i < spec.pattern.length; i++) {
    if (spec.pattern[i].exponent.kind === "variable") {
      const name = LETTERS[letterIdx++] ?? `N${letterIdx}`;
      factorNT[i] = name;
      nonTerminals.push(name);
    }
  }

  const startRhsParts: string[] = [];
  for (let i = 0; i < spec.pattern.length; i++) {
    const f = spec.pattern[i];
    if (f.atom.kind === "epsilon" && f.exponent.kind === "none") continue;
    collectTerminals(f.atom, terminals);
    const atomText = atomToTerminalString(f.atom);

    if (f.exponent.kind === "none") {
      startRhsParts.push(atomText);
    } else if (f.exponent.kind === "literal") {
      startRhsParts.push(atomText.repeat(f.exponent.count));
    } else {
      const nt = factorNT[i]!;
      startRhsParts.push(nt);
      productionLines.push(
        formatRecursiveRule(nt, atomText, f.exponent.lowerBound),
      );
    }
  }

  const startRhs = startRhsParts.length === 0 ? "ε" : startRhsParts.join(" ");
  productionLines.unshift(`${startSymbol} -> ${startRhs}`);

  return {
    nonTerminals,
    terminals: [...terminals],
    startSymbol,
    displayText: productionLines.join("\n"),
  };
}

function formatRecursiveRule(
  nt: string,
  atomText: string,
  lowerBound: number,
): string {
  if (lowerBound <= 0) return `${nt} -> ${atomText}${nt} | ε`;
  if (lowerBound === 1) return `${nt} -> ${atomText}${nt} | ${atomText}`;
  return `${nt} -> ${atomText}${nt} | ${atomText.repeat(lowerBound)}`;
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

function collectTerminals(node: RegexNode, out: Set<string>): void {
  if (node.kind === "symbol") {
    out.add(node.value);
    return;
  }
  if (node.kind === "concat" || node.kind === "union") {
    collectTerminals(node.left, out);
    collectTerminals(node.right, out);
    return;
  }
  if (node.kind === "star") {
    collectTerminals(node.child, out);
  }
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
