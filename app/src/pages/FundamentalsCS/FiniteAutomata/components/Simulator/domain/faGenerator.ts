import type { FAProgram, FATransitionMap, RegularGrammar } from "./faTypes";
import { EPSILON } from "./faTypes";
import {
  grammarToAutomaton,
  validateRegularGrammar,
} from "./faGrammarConversion";

/* ────────────────────────────────────────────────────────────
   Regex AST
   ──────────────────────────────────────────────────────────── */

type RegexNode =
  | { kind: "char"; value: string }
  | { kind: "epsilon" }
  | { kind: "concat"; left: RegexNode; right: RegexNode }
  | { kind: "union"; left: RegexNode; right: RegexNode }
  | { kind: "star"; child: RegexNode }
  | { kind: "plus"; child: RegexNode }
  | { kind: "optional"; child: RegexNode };

class RegexParser {
  private pos = 0;
  private readonly input: string;

  constructor(input: string) {
    this.input = input;
  }

  parse(): RegexNode {
    if (this.input.length === 0) {
      throw new Error("Invalid regex: pattern is empty");
    }
    const node = this.parseExpr();
    if (this.pos < this.input.length) {
      const c = this.input[this.pos];
      if (c === ")") {
        throw new Error(
          `Invalid regex: unexpected ')' at position ${this.pos} (no matching '(')`,
        );
      }
      throw new Error(
        `Invalid regex: unexpected '${c}' at position ${this.pos}`,
      );
    }
    return node;
  }

  private parseExpr(): RegexNode {
    let left = this.parseTerm();
    while (this.peek() === "|") {
      this.pos++;
      const right = this.parseTerm();
      left = { kind: "union", left, right };
    }
    return left;
  }

  private parseTerm(): RegexNode {
    if (this.atBoundary()) return { kind: "epsilon" };
    let left = this.parseFactor();
    while (!this.atBoundary()) {
      const right = this.parseFactor();
      left = { kind: "concat", left, right };
    }
    return left;
  }

  private parseFactor(): RegexNode {
    let atom = this.parseAtom();
    while (this.pos < this.input.length) {
      const c = this.input[this.pos];
      if (c === "*") {
        this.pos++;
        atom = { kind: "star", child: atom };
      } else if (c === "+") {
        this.pos++;
        atom = { kind: "plus", child: atom };
      } else if (c === "?") {
        this.pos++;
        atom = { kind: "optional", child: atom };
      } else {
        break;
      }
    }
    return atom;
  }

  private parseAtom(): RegexNode {
    if (this.pos >= this.input.length) {
      throw new Error("Invalid regex: unexpected end of pattern");
    }
    const c = this.input[this.pos++];
    if (c === "(") {
      const openPos = this.pos - 1;
      const inner = this.parseExpr();
      if (this.input[this.pos] !== ")") {
        throw new Error(
          `Invalid regex: missing closing ')' for '(' at position ${openPos}`,
        );
      }
      this.pos++;
      return inner;
    }
    if (c === "\\") {
      if (this.pos >= this.input.length) {
        throw new Error(
          "Invalid regex: dangling escape '\\' at end of pattern",
        );
      }
      return { kind: "char", value: this.input[this.pos++] };
    }
    if (c === "ε") return { kind: "epsilon" };
    if ("*+?".includes(c)) {
      throw new Error(
        `Invalid regex: '${c}' at position ${this.pos - 1} has nothing to repeat`,
      );
    }
    if (c === ")" || c === "|") {
      throw new Error(
        `Invalid regex: unexpected '${c}' at position ${this.pos - 1}`,
      );
    }
    return { kind: "char", value: c };
  }

  private peek(): string | undefined {
    return this.input[this.pos];
  }

  private atBoundary(): boolean {
    const c = this.peek();
    return c === undefined || c === "|" || c === ")";
  }
}

/* ────────────────────────────────────────────────────────────
   Thompson's construction: Regex AST → NFA
   ──────────────────────────────────────────────────────────── */

interface NFABuild {
  states: string[];
  alphabet: string[];
  transitions: FATransitionMap;
  startState: string;
  acceptStates: string[];
}

class ThompsonBuilder {
  private counter = 0;
  private transitions: FATransitionMap = {};
  private alphabet = new Set<string>();

  private newState(): string {
    const name = `s${this.counter++}`;
    this.transitions[name] = {};
    return name;
  }

  private addTransition(from: string, symbol: string, to: string) {
    const row = this.transitions[from];
    if (!row[symbol]) row[symbol] = [];
    if (!row[symbol].includes(to)) row[symbol].push(to);
    if (symbol !== EPSILON) this.alphabet.add(symbol);
  }

  private buildFragment(node: RegexNode): { start: string; accept: string } {
    switch (node.kind) {
      case "char": {
        const s = this.newState();
        const a = this.newState();
        this.addTransition(s, node.value, a);
        return { start: s, accept: a };
      }
      case "epsilon": {
        const s = this.newState();
        const a = this.newState();
        this.addTransition(s, EPSILON, a);
        return { start: s, accept: a };
      }
      case "concat": {
        const l = this.buildFragment(node.left);
        const r = this.buildFragment(node.right);
        this.addTransition(l.accept, EPSILON, r.start);
        return { start: l.start, accept: r.accept };
      }
      case "union": {
        const s = this.newState();
        const a = this.newState();
        const l = this.buildFragment(node.left);
        const r = this.buildFragment(node.right);
        this.addTransition(s, EPSILON, l.start);
        this.addTransition(s, EPSILON, r.start);
        this.addTransition(l.accept, EPSILON, a);
        this.addTransition(r.accept, EPSILON, a);
        return { start: s, accept: a };
      }
      case "star": {
        const s = this.newState();
        const a = this.newState();
        const c = this.buildFragment(node.child);
        this.addTransition(s, EPSILON, c.start);
        this.addTransition(s, EPSILON, a);
        this.addTransition(c.accept, EPSILON, c.start);
        this.addTransition(c.accept, EPSILON, a);
        return { start: s, accept: a };
      }
      case "plus": {
        const s = this.newState();
        const a = this.newState();
        const c = this.buildFragment(node.child);
        this.addTransition(s, EPSILON, c.start);
        this.addTransition(c.accept, EPSILON, c.start);
        this.addTransition(c.accept, EPSILON, a);
        return { start: s, accept: a };
      }
      case "optional": {
        const s = this.newState();
        const a = this.newState();
        const c = this.buildFragment(node.child);
        this.addTransition(s, EPSILON, c.start);
        this.addTransition(s, EPSILON, a);
        this.addTransition(c.accept, EPSILON, a);
        return { start: s, accept: a };
      }
    }
  }

  build(ast: RegexNode): NFABuild {
    const frag = this.buildFragment(ast);
    return {
      states: Object.keys(this.transitions),
      alphabet: [...this.alphabet].sort(),
      transitions: this.transitions,
      startState: frag.start,
      acceptStates: [frag.accept],
    };
  }
}

function regexToNfa(pattern: string): NFABuild {
  const ast = new RegexParser(pattern).parse();
  return new ThompsonBuilder().build(ast);
}

/* ────────────────────────────────────────────────────────────
   Subset construction: NFA → DFA
   ──────────────────────────────────────────────────────────── */

function nfaToDfa(nfa: NFABuild): FAProgram {
  const epsilonClosure = (seed: Iterable<string>): Set<string> => {
    const result = new Set<string>(seed);
    const stack = [...result];
    while (stack.length > 0) {
      const s = stack.pop()!;
      const targets = nfa.transitions[s]?.[EPSILON] ?? [];
      for (const t of targets) {
        if (!result.has(t)) {
          result.add(t);
          stack.push(t);
        }
      }
    }
    return result;
  };

  const move = (states: Set<string>, symbol: string): Set<string> => {
    const out = new Set<string>();
    for (const s of states) {
      const targets = nfa.transitions[s]?.[symbol] ?? [];
      for (const t of targets) out.add(t);
    }
    return out;
  };

  const keyOf = (s: Set<string>) => [...s].sort().join("|");

  const startSet = epsilonClosure([nfa.startState]);
  const byKey = new Map<string, { set: Set<string>; name: string }>();
  byKey.set(keyOf(startSet), { set: startSet, name: "s0" });

  const queue = [keyOf(startSet)];
  const transitions: FATransitionMap = { s0: {} };
  let counter = 1;

  while (queue.length > 0) {
    const k = queue.shift()!;
    const entry = byKey.get(k)!;
    for (const symbol of nfa.alphabet) {
      const next = epsilonClosure(move(entry.set, symbol));
      if (next.size === 0) continue;
      const nk = keyOf(next);
      let nextEntry = byKey.get(nk);
      if (!nextEntry) {
        nextEntry = { set: next, name: `s${counter++}` };
        byKey.set(nk, nextEntry);
        transitions[nextEntry.name] = {};
        queue.push(nk);
      }
      transitions[entry.name][symbol] = [nextEntry.name];
    }
  }

  const states: string[] = [];
  const acceptStates: string[] = [];
  for (const { set, name } of byKey.values()) {
    states.push(name);
    if ([...set].some((s) => nfa.acceptStates.includes(s))) {
      acceptStates.push(name);
    }
  }

  return {
    type: "DFA",
    states,
    alphabet: nfa.alphabet,
    transitions,
    startState: "s0",
    acceptStates,
  };
}

function nfaAsProgram(nfa: NFABuild): FAProgram {
  return {
    type: "NFA",
    states: nfa.states,
    alphabet: nfa.alphabet,
    transitions: nfa.transitions,
    startState: nfa.startState,
    acceptStates: nfa.acceptStates,
  };
}

/* ────────────────────────────────────────────────────────────
   Modulo DFA: accept w in alphabet* where numeric(w) % divisor == remainder
   ──────────────────────────────────────────────────────────── */

function moduloDfa(
  alphabet: string[],
  divisor: number,
  remainder: number,
): FAProgram {
  if (divisor < 1) throw new Error("divisor must be >= 1");
  if (alphabet.length < 1) throw new Error("alphabet must be non-empty");
  if (remainder < 0 || remainder >= divisor) {
    throw new Error(`remainder must satisfy 0 <= r < ${divisor}`);
  }

  const base = alphabet.length;
  const states = Array.from({ length: divisor }, (_, i) => `s${i}`);
  const transitions: FATransitionMap = {};
  for (let i = 0; i < divisor; i++) {
    transitions[`s${i}`] = {};
    for (let v = 0; v < base; v++) {
      const next = (i * base + v) % divisor;
      transitions[`s${i}`][alphabet[v]] = [`s${next}`];
    }
  }

  return {
    type: "DFA",
    states,
    alphabet,
    transitions,
    startState: "s0",
    acceptStates: [`s${remainder}`],
  };
}

/* ────────────────────────────────────────────────────────────
   DSL parser and public API
   ──────────────────────────────────────────────────────────── */

export type GeneratorSpec =
  | {
      type: "regex";
      pattern: string;
      /** "dfa" (default, subset-constructed) or "nfa" (Thompson output) */
      output: "dfa" | "nfa";
      inputWord?: string;
    }
  | {
      type: "modulo";
      alphabet: string[];
      divisor: number;
      remainder: number;
      inputWord?: string;
    }
  | {
      type: "grammar";
      grammar: RegularGrammar;
      inputWord?: string;
    };

/**
 * Parse a minimal `key: value` DSL. Lines starting with `#` are comments.
 * Required: `type`. Per-type fields follow.
 *
 * Examples:
 *   type: regex
 *   value: (0|1)*00
 *   output: dfa
 *
 *   type: modulo
 *   alphabet: {0,1}
 *   divisor: 4
 *   remainder: 0
 */
export function parseGeneratorDSL(source: string): GeneratorSpec {
  const fields = new Map<string, string>();
  const productionLines: string[] = [];
  const lines = source.split(/\r?\n/);
  let inProductionsBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) continue;
    const keyMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/.exec(trimmed);

    if (keyMatch) {
      const key = keyMatch[1].toLowerCase();
      const value = keyMatch[2].trim();
      if (key === "productions") {
        inProductionsBlock = true;
        if (value.length > 0) productionLines.push(value);
        continue;
      }
      inProductionsBlock = false;
      fields.set(key, value);
    } else if (inProductionsBlock) {
      productionLines.push(trimmed);
    } else {
      throw new Error(`Line ${i + 1}: expected "key: value"`);
    }
  }

  const type = fields.get("type");
  if (!type) {
    throw new Error("Missing required field 'type' (regex | modulo | grammar)");
  }

  const inputWord = fields.get("input") ?? fields.get("inputword");

  if (type === "regex") {
    const pattern = fields.get("value") ?? fields.get("pattern");
    if (!pattern) throw new Error("regex: missing 'value' (the pattern)");
    const outputRaw = (fields.get("output") ?? "dfa").toLowerCase();
    if (outputRaw !== "dfa" && outputRaw !== "nfa") {
      throw new Error("regex: 'output' must be 'dfa' or 'nfa'");
    }
    return { type: "regex", pattern, output: outputRaw, inputWord };
  }

  if (type === "modulo") {
    const alphabetRaw = fields.get("alphabet");
    if (!alphabetRaw) throw new Error("modulo: missing 'alphabet'");
    const alphabet = alphabetRaw
      .replace(/^\{|}$/g, "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (alphabet.length === 0) {
      throw new Error("modulo: 'alphabet' must list at least one symbol");
    }
    const divisorRaw = fields.get("divisor");
    if (!divisorRaw) throw new Error("modulo: missing 'divisor'");
    const divisor = Number.parseInt(divisorRaw, 10);
    if (!Number.isFinite(divisor) || divisor < 1) {
      throw new Error("modulo: 'divisor' must be a positive integer");
    }
    const remainderRaw = fields.get("remainder") ?? "0";
    const remainder = Number.parseInt(remainderRaw, 10);
    if (!Number.isFinite(remainder) || remainder < 0 || remainder >= divisor) {
      throw new Error(
        `modulo: 'remainder' must be an integer in [0, ${divisor - 1}]`,
      );
    }
    return { type: "modulo", alphabet, divisor, remainder, inputWord };
  }

  if (type === "grammar") {
    if (productionLines.length === 0) {
      throw new Error(
        "grammar: missing 'productions' block (each production on its own line, e.g. S -> 0S | 1S | ε)",
      );
    }
    const grammar = parseGrammarDSL({
      productionLines,
      nonTerminalsField: fields.get("nonterminals") ?? fields.get("nt"),
      terminalsField: fields.get("terminals") ?? fields.get("t"),
      startSymbolField: fields.get("start") ?? fields.get("startsymbol"),
    });
    const errs = validateRegularGrammar(grammar);
    if (errs.length > 0) {
      throw new Error(`grammar: validation failed (${errs.join(", ")})`);
    }
    return { type: "grammar", grammar, inputWord };
  }

  throw new Error(`Unknown type '${type}'. Supported: regex, modulo, grammar`);
}

/* ────────────────────────────────────────────────────────────
   Grammar DSL helpers
   ──────────────────────────────────────────────────────────── */

interface GrammarDSLInput {
  productionLines: string[];
  nonTerminalsField?: string;
  terminalsField?: string;
  startSymbolField?: string;
}

function parseGrammarDSL(input: GrammarDSLInput): RegularGrammar {
  const productions: RegularGrammar["productions"] = [];
  const inferredNT = new Set<string>();
  const inferredT = new Set<string>();
  let firstLhs: string | null = null;

  for (const line of input.productionLines) {
    // Each line: "LHS -> RHS1 | RHS2 | ..."
    const arrowMatch = line.match(/^(\S+)\s*(?:->|→)\s*(.+)$/);
    if (!arrowMatch) {
      throw new Error(
        `grammar: cannot parse production '${line}' (expected 'LHS -> RHS')`,
      );
    }
    const lhs = arrowMatch[1];
    const rhsAll = arrowMatch[2];
    if (firstLhs === null) firstLhs = lhs;
    inferredNT.add(lhs);

    const alternatives = rhsAll.split("|").map((s) => s.trim());
    for (const alt of alternatives) {
      if (alt.length === 0) {
        throw new Error(`grammar: empty alternative in '${line}'`);
      }
      if (alt === "ε" || alt === "epsilon") {
        // Empty production: treated as a direct accept for LHS.
        // Represent via: if LHS is start, start state must be accepting.
        // The current grammar model doesn't express A → ε directly, so we
        // surface a clear error rather than silently breaking it.
        throw new Error(
          `grammar: ε productions are not supported by the right-linear converter; use '${lhs} -> a' with a terminal that leads to accept`,
        );
      }
      if (alt.length === 1) {
        const term = alt;
        inferredT.add(term);
        productions.push({ lhs, terminal: term, nextNonTerminal: null });
      } else {
        const term = alt[0];
        const nt = alt.slice(1);
        inferredT.add(term);
        inferredNT.add(nt);
        productions.push({ lhs, terminal: term, nextNonTerminal: nt });
      }
    }
  }

  const nonTerminals = input.nonTerminalsField
    ? input.nonTerminalsField
        .replace(/^\{|}$/g, "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [...inferredNT];

  const terminals = input.terminalsField
    ? input.terminalsField
        .replace(/^\{|}$/g, "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [...inferredT];

  const startSymbol = input.startSymbolField?.trim() || firstLhs || "S";

  return { nonTerminals, terminals, startSymbol, productions };
}

export function generateAutomaton(spec: GeneratorSpec): FAProgram {
  if (spec.type === "regex") {
    const nfa = regexToNfa(spec.pattern);
    return spec.output === "nfa" ? nfaAsProgram(nfa) : nfaToDfa(nfa);
  }
  if (spec.type === "modulo") {
    return moduloDfa(spec.alphabet, spec.divisor, spec.remainder);
  }
  return grammarToAutomaton(spec.grammar);
}

/* ────────────────────────────────────────────────────────────
   Accepted-word finder (BFS over configurations)
   ──────────────────────────────────────────────────────────── */

function epsilonClosureOn(
  program: FAProgram,
  seed: Iterable<string>,
): Set<string> {
  const result = new Set<string>(seed);
  const stack = [...result];
  while (stack.length > 0) {
    const s = stack.pop()!;
    const eps = program.transitions[s]?.[EPSILON] ?? [];
    for (const t of eps) {
      if (!result.has(t)) {
        result.add(t);
        stack.push(t);
      }
    }
  }
  return result;
}

function moveOn(
  program: FAProgram,
  states: Set<string>,
  symbol: string,
): Set<string> {
  const out = new Set<string>();
  for (const s of states) {
    const ts = program.transitions[s]?.[symbol] ?? [];
    for (const t of ts) out.add(t);
  }
  return out;
}

/**
 * Find the shortest word accepted by `program`, up to `maxLen` symbols.
 * Returns `null` if no such word exists within that bound, or `""` if
 * the empty word is already accepted.
 */
export function findShortestAcceptedWord(
  program: FAProgram,
  maxLen = 10,
): string | null {
  const acceptSet = new Set(program.acceptStates);
  const start = epsilonClosureOn(program, [program.startState]);
  if ([...start].some((s) => acceptSet.has(s))) return "";

  const seen = new Set<string>();
  const keyOf = (s: Set<string>) => [...s].sort().join("|");
  seen.add(keyOf(start));

  const queue: { active: Set<string>; word: string }[] = [
    { active: start, word: "" },
  ];
  while (queue.length > 0) {
    const { active, word } = queue.shift()!;
    if (word.length >= maxLen) continue;
    for (const sym of program.alphabet) {
      const next = epsilonClosureOn(program, moveOn(program, active, sym));
      if (next.size === 0) continue;
      const w = word + sym;
      if ([...next].some((s) => acceptSet.has(s))) return w;
      const k = keyOf(next);
      if (!seen.has(k)) {
        seen.add(k);
        queue.push({ active: next, word: w });
      }
    }
  }
  return null;
}

/* ────────────────────────────────────────────────────────────
   Human-readable language description
   ──────────────────────────────────────────────────────────── */

export function describeSpec(spec: GeneratorSpec): string {
  if (spec.type === "regex") {
    const sink = spec.output === "nfa" ? "NFA (Thompson)" : "DFA (subset)";
    return `Regular language defined by \`${spec.pattern}\`, compiled to ${sink}.`;
  }
  if (spec.type === "modulo") {
    const base = spec.alphabet.length;
    const baseName =
      base === 2
        ? "Binary"
        : base === 10
          ? "Decimal"
          : base === 16
            ? "Hex"
            : `Base-${base}`;
    const rem = spec.remainder;
    const d = spec.divisor;
    const tail =
      rem === 0
        ? `divisible by ${d}`
        : `that leave remainder ${rem} when divided by ${d}`;
    return `${baseName} numbers ${tail} (alphabet: {${spec.alphabet.join(",")}}).`;
  }
  const g = spec.grammar;
  return `Right-linear grammar with start symbol ${g.startSymbol} and ${g.productions.length} production${g.productions.length === 1 ? "" : "s"}.`;
}

/**
 * One-shot: parse → generate → suggest a short accepted word → describe.
 */
export function generateWithInfo(spec: GeneratorSpec): {
  program: FAProgram;
  suggestedWord: string | null;
  description: string;
} {
  const program = generateAutomaton(spec);
  const suggestedWord =
    spec.inputWord !== undefined
      ? spec.inputWord
      : findShortestAcceptedWord(program);
  return { program, suggestedWord, description: describeSpec(spec) };
}

/** Exposed for testing and for users who want the intermediate NFA. */
export const _internals = { regexToNfa, nfaToDfa, moduloDfa };
