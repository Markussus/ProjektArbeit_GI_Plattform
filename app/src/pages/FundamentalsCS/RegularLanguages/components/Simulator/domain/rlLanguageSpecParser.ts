import type { TFunction } from "i18next";
import type { TranslationKey } from "@/types/i18n";
import type { RegexNode } from "./rlTypes";

export type ExponentSpec =
  | { kind: "none" }
  | { kind: "literal"; count: number }
  | { kind: "variable"; name: string; lowerBound: number };

export interface PatternFactor {
  atom: RegexNode;
  /** Pretty text of the atom: "a", "(ab)", "ε" */
  atomText: string;
  exponent: ExponentSpec;
  /** "a", "a^n", "(ab)^2" — used for diagnostics. */
  rawText: string;
}

export interface VariableBound {
  name: string;
  lowerBound: number;
}

export interface EnumerationLang {
  kind: "enumeration";
  words: string[];
}

export interface SetBuilderLang {
  kind: "setBuilder";
  pattern: PatternFactor[];
  variableBounds: VariableBound[];
}

export type LanguageSpec = EnumerationLang | SetBuilderLang;

/**
 * A parse failure as a translatable code plus its interpolation values.
 * The matching strings live under `regular-languages.languageErrors.*`.
 */
export interface LanguageParseIssue {
  code:
    | "empty"
    | "variableReused"
    | "patternUnexpectedChar"
    | "missingGroupClose"
    | "trailingCaret"
    | "badExponent"
    | "nestedRepetition"
    | "constraintVariable"
    | "expectedNaturals"
    | "expectedInteger"
    | "upperBound"
    | "unexpectedToken";
  params?: Record<string, string>;
}

export type ParseLanguageResult =
  | { ok: true; spec: LanguageSpec }
  | { ok: false; error: string; issue: LanguageParseIssue };

/** Translation key for a language-spec issue, for use with i18next's `t()`. */
function languageIssueKey(issue: LanguageParseIssue): string {
  return `regular-languages.languageErrors.${issue.code}`;
}

/** Render a language-spec issue in the active language. */
export function formatLanguageIssue(
  t: TFunction,
  issue: LanguageParseIssue,
  fallback: string,
): string {
  return t(languageIssueKey(issue) as TranslationKey, {
    ...issue.params,
    defaultValue: fallback,
  });
}

/** Thrown internally; the parse entry points convert it into a failure. */
class LanguageParseError extends Error {
  readonly issue: LanguageParseIssue;

  constructor(issue: LanguageParseIssue, message: string) {
    super(message);
    this.issue = issue;
  }
}

function fail(
  code: LanguageParseIssue["code"],
  message: string,
  params?: Record<string, string>,
): never {
  throw new LanguageParseError({ code, params }, message);
}

function toFailure(e: unknown): {
  ok: false;
  error: string;
  issue: LanguageParseIssue;
} {
  if (e instanceof LanguageParseError) {
    return { ok: false, error: e.message, issue: e.issue };
  }
  const message = e instanceof Error ? e.message : String(e);
  return {
    ok: false,
    error: message,
    issue: { code: "patternUnexpectedChar", params: { char: message } },
  };
}

/**
 * Parse a language description in either enumeration or set-builder form.
 *
 * Accepted shapes (the `L = ` / `L_1 = ` prefix and outer braces are optional):
 *   L = {"010", "0010", "00010"}            // enumeration
 *   {010, 0010, 00010}                       // enumeration (unquoted ok)
 *   L1 = {a^n c b^m | n, m > 0}              // set-builder
 *   {a^n | n in N}                           // set-builder, n ≥ 0
 *   {(ab)^n | n >= 1}                        // groups allowed
 *
 * Set-builder pattern: a sequence of factors. Each factor is either a single
 * symbol, ε, or a parenthesised sub-pattern, optionally followed by `^k` for
 * literal repetition or `^v` (single letter) for variable repetition.
 *
 * Set-builder constraints: comma-separated groups. Each group is one or more
 * variables followed by `in N`/`∈ ℕ` and/or comparison operators (`>`, `>=`,
 * `≥`, `=`). Upper bounds are not supported. Default is `≥ 0`. The same
 * variable may not appear in two factors — `a^n b^n`-style correlations are
 * rejected as non-regular.
 */
export function parseLanguageSpec(rawSource: string): ParseLanguageResult {
  let source = rawSource.trim();
  if (source.length === 0) {
    return {
      ok: false,
      error: "Language definition is empty.",
      issue: { code: "empty" },
    };
  }

  // Strip optional "L = " / "L_1 = " / "L1 = " prefix.
  source = source.replace(/^L[\w]*\s*=\s*/i, "");

  // Strip outer braces if present.
  const braced = source.match(/^\{([\s\S]*)\}$/);
  const body = (braced ? braced[1] : source).trim();

  if (body.length === 0) {
    return { ok: true, spec: { kind: "enumeration", words: [] } };
  }

  const barIdx = findTopLevelBar(body);
  if (barIdx >= 0) {
    return parseSetBuilderBody(
      body.slice(0, barIdx).trim(),
      body.slice(barIdx + 1).trim(),
    );
  }
  return parseEnumerationBody(body);
}

/* ── Enumeration form ──────────────────────────────────────────────── */

/** Strip one matching pair of surrounding quotes, if the item has them. */
function unquoteItem(item: string): string {
  const quoted =
    (item.startsWith('"') && item.endsWith('"')) ||
    (item.startsWith("'") && item.endsWith("'"));
  return quoted && item.length >= 2 ? item.slice(1, -1) : item;
}

/** `..` / `...` stands for "and so on", not for a word. */
function isContinuationMarker(item: string): boolean {
  return /^\.{2,}$/.test(item);
}

function parseEnumerationBody(body: string): ParseLanguageResult {
  const words: string[] = [];
  let sawContinuation = false;

  for (const rawItem of splitTopLevelCommas(body)) {
    const trimmed = rawItem.trim();
    // Skips the gap an empty item leaves, e.g. after a trailing comma.
    if (trimmed.length === 0) continue;

    const item = unquoteItem(trimmed);
    if (isContinuationMarker(item)) {
      sawContinuation = true;
      continue;
    }

    words.push(item === "ε" || item === "epsilon" ? "" : item);
  }

  // A trailing `..` / `...` marker signals "this is a pattern" — try to
  // infer a set-builder spec; fall back to a plain enumeration if we can't.
  if (sawContinuation) {
    const inferred = inferSetBuilderFromWords(words);
    if (inferred) return { ok: true, spec: inferred };
  }

  return { ok: true, spec: { kind: "enumeration", words } };
}

/* ── Inference: enumeration → set-builder ──────────────────────────── */

/**
 * Try to read a list of example words as a set-builder description.
 * Currently recognises the shape `α^n y β^m` (with optional empty α / β),
 * i.e. some single character repeated 0+ times, a unique pivot character
 * that appears exactly once in every word, and another single character
 * repeated 0+ times. This is enough to capture textbook patterns like
 * 0^n 1 0^m, a^n c b^m, a^n b, …
 *
 * Returns `null` if no recognised pattern fits all the words.
 */
function inferSetBuilderFromWords(words: string[]): SetBuilderLang | null {
  const cleaned = words.filter((w) => w.length > 0);
  if (cleaned.length === 0) return null;

  const candidatePivots = new Set<string>(cleaned[0]);
  for (const pivot of candidatePivots) {
    if (!cleaned.every((w) => countChar(w, pivot) === 1)) continue;

    const leftParts: string[] = [];
    const rightParts: string[] = [];
    for (const w of cleaned) {
      const idx = w.indexOf(pivot);
      leftParts.push(w.slice(0, idx));
      rightParts.push(w.slice(idx + 1));
    }

    const left = analyseRepeatedPart(leftParts);
    const right = analyseRepeatedPart(rightParts);
    if (!left || !right) continue;

    return buildInferredSetBuilder({
      leftChar: left.char,
      leftMinK: left.minK,
      pivot,
      rightChar: right.char,
      rightMinK: right.minK,
    });
  }

  return null;
}

function countChar(s: string, c: string): number {
  let n = 0;
  for (const ch of s) if (ch === c) n++;
  return n;
}

function analyseRepeatedPart(
  parts: string[],
): { char: string | null; minK: number } | null {
  const chars = new Set<string>();
  for (const p of parts) for (const c of p) chars.add(c);
  if (chars.size > 1) return null;
  if (chars.size === 0) return { char: null, minK: 0 };
  const char = [...chars][0];
  if (!parts.every((p) => [...p].every((c) => c === char))) return null;
  const minK = Math.min(...parts.map((p) => p.length));
  return { char, minK };
}

function buildInferredSetBuilder(input: {
  leftChar: string | null;
  leftMinK: number;
  pivot: string;
  rightChar: string | null;
  rightMinK: number;
}): SetBuilderLang {
  const factors: PatternFactor[] = [];
  const variableBounds: VariableBound[] = [];
  const candidateNames = ["n", "m"];
  let nameIdx = 0;

  if (input.leftChar !== null) {
    const name = candidateNames[nameIdx++];
    factors.push({
      atom: { kind: "symbol", value: input.leftChar },
      atomText: input.leftChar,
      exponent: { kind: "variable", name, lowerBound: input.leftMinK },
      rawText: `${input.leftChar}^${name}`,
    });
    variableBounds.push({ name, lowerBound: input.leftMinK });
  }

  factors.push({
    atom: { kind: "symbol", value: input.pivot },
    atomText: input.pivot,
    exponent: { kind: "none" },
    rawText: input.pivot,
  });

  if (input.rightChar !== null) {
    const name = candidateNames[nameIdx++];
    factors.push({
      atom: { kind: "symbol", value: input.rightChar },
      atomText: input.rightChar,
      exponent: { kind: "variable", name, lowerBound: input.rightMinK },
      rawText: `${input.rightChar}^${name}`,
    });
    variableBounds.push({ name, lowerBound: input.rightMinK });
  }

  return {
    kind: "setBuilder",
    pattern: factors,
    variableBounds,
  };
}

/* ── Set-builder form ──────────────────────────────────────────────── */

/**
 * A variable exponent inside a group, as in `(a^n)b`, makes the group's atom a
 * repetition rather than a fixed word. The grammar builder walks atoms symbol
 * by symbol and has nothing to walk here, so reject it with a message instead
 * of letting it throw out of the render.
 */
function rejectNestedRepetitions(factors: PatternFactor[]): void {
  for (const factor of factors) {
    if (!isFixedWordAtom(factor.atom)) {
      fail(
        "nestedRepetition",
        `'${factor.rawText}' repeats inside a group. Write the repetition once, e.g. 'a^n b' instead of '(a^n)b'.`,
        { factor: factor.rawText },
      );
    }
  }
}

/**
 * The same variable in two factors correlates their lengths (a^n b^n), which
 * is not a regular language — reject rather than silently drop it.
 */
function rejectReusedVariables(factors: PatternFactor[]): void {
  const usage = new Map<string, number>();
  for (const factor of factors) {
    if (factor.exponent.kind === "variable") {
      const { name } = factor.exponent;
      usage.set(name, (usage.get(name) ?? 0) + 1);
    }
  }

  for (const [name, count] of usage) {
    if (count > 1) {
      fail(
        "variableReused",
        `Variable '${name}' is used in more than one factor. That describes a non-regular language (like a^n b^n) and cannot be expressed as a regular grammar.`,
        { name },
      );
    }
  }
}

/**
 * Fold the constraint groups into per-variable bounds. Variables introduced in
 * the pattern but left unconstrained default to ≥ 0.
 */
function collectVariableBounds(
  constraintsText: string,
  factors: PatternFactor[],
): { lowerBound: Map<string, number>; exactCount: Map<string, number> } {
  const lowerBound = new Map<string, number>();
  const exactCount = new Map<string, number>();

  for (const group of parseConstraintsText(constraintsText)) {
    for (const name of group.vars) {
      const prev = lowerBound.get(name) ?? 0;
      lowerBound.set(name, Math.max(prev, group.lowerBound));
      if (group.exact !== null) exactCount.set(name, group.exact);
    }
  }

  for (const factor of factors) {
    if (
      factor.exponent.kind === "variable" &&
      !lowerBound.has(factor.exponent.name)
    ) {
      lowerBound.set(factor.exponent.name, 0);
    }
  }

  return { lowerBound, exactCount };
}

/**
 * `n = k` pins the exponent to exactly k, so the factor stops being variable —
 * `{a^n | n = 3}` is the finite {aaa}, not a^3 a*. Every other bound only
 * raises the variable's lower bound.
 */
function applyVariableBounds(
  factors: PatternFactor[],
  lowerBound: Map<string, number>,
  exactCount: Map<string, number>,
): void {
  for (const factor of factors) {
    if (factor.exponent.kind !== "variable") continue;
    const exact = exactCount.get(factor.exponent.name);
    if (exact !== undefined) {
      factor.exponent = { kind: "literal", count: exact };
      continue;
    }
    factor.exponent.lowerBound = lowerBound.get(factor.exponent.name) ?? 0;
  }
}

/** The bounds in the order their variables first appear in the pattern. */
function orderedVariableBounds(
  factors: PatternFactor[],
  lowerBound: Map<string, number>,
): VariableBound[] {
  const bounds: VariableBound[] = [];
  for (const factor of factors) {
    if (factor.exponent.kind !== "variable") continue;
    const { name } = factor.exponent;
    if (!bounds.some((b) => b.name === name)) {
      bounds.push({ name, lowerBound: lowerBound.get(name) ?? 0 });
    }
  }
  return bounds;
}

function parseSetBuilderBody(
  patternText: string,
  constraintsText: string,
): ParseLanguageResult {
  try {
    const factors = parsePatternText(patternText);
    rejectNestedRepetitions(factors);
    rejectReusedVariables(factors);

    const { lowerBound, exactCount } = collectVariableBounds(
      constraintsText,
      factors,
    );
    applyVariableBounds(factors, lowerBound, exactCount);

    return {
      ok: true,
      spec: {
        kind: "setBuilder",
        pattern: factors,
        variableBounds: orderedVariableBounds(factors, lowerBound),
      },
    };
  } catch (e) {
    return toFailure(e);
  }
}

/* ── Pattern parser ────────────────────────────────────────────────── */

function parsePatternText(text: string): PatternFactor[] {
  const result = parsePattern(text, 0);
  if (result.endIdx !== text.length) {
    fail(
      "patternUnexpectedChar",
      `Unexpected character '${text[result.endIdx]}' in pattern at position ${result.endIdx}.`,
      { char: text[result.endIdx], position: String(result.endIdx) },
    );
  }
  return result.factors;
}

/** Characters that only separate factors and carry no meaning of their own. */
function isPatternFiller(c: string): boolean {
  return c === " " || c === "\t" || c === "·" || c === "⋅";
}

/**
 * One atom of a pattern: a parenthesised group, ε, or a single symbol.
 * Returns the atom together with the index just past it.
 */
function parseAtom(
  source: string,
  startIdx: number,
): { atom: RegexNode; atomText: string; endIdx: number } {
  const c = source[startIdx];

  if (c === "(") {
    const sub = parsePattern(source, startIdx + 1);
    if (source[sub.endIdx] !== ")") {
      fail(
        "missingGroupClose",
        `Missing ')' to close group starting before position ${startIdx + 1}.`,
        { position: String(startIdx + 1) },
      );
    }
    return {
      atom: patternToRegex(sub.factors),
      atomText: `(${sub.factors.map((f) => f.rawText).join("")})`,
      endIdx: sub.endIdx + 1,
    };
  }

  if (c === "ε" || c === "λ") {
    return { atom: { kind: "epsilon" }, atomText: "ε", endIdx: startIdx + 1 };
  }

  if (isSymbolChar(c)) {
    return {
      atom: { kind: "symbol", value: c },
      atomText: c,
      endIdx: startIdx + 1,
    };
  }

  fail(
    "patternUnexpectedChar",
    `Unexpected character '${c}' in pattern at position ${startIdx}.`,
    { char: c, position: String(startIdx) },
  );
}

/**
 * The optional `^…` suffix of a factor: a literal count (`a^2`) or a variable
 * (`a^n`). An atom with no caret keeps the `none` exponent.
 */
function parseExponent(
  source: string,
  startIdx: number,
): { exponent: ExponentSpec; rawSuffix: string; endIdx: number } {
  if (source[startIdx] !== "^") {
    return { exponent: { kind: "none" }, rawSuffix: "", endIdx: startIdx };
  }

  let i = startIdx + 1;
  const next = source[i];
  if (next === undefined) {
    fail("trailingCaret", "Trailing '^' without exponent.");
  }

  if (/[0-9]/.test(next)) {
    let digits = "";
    while (i < source.length && /[0-9]/.test(source[i])) {
      digits += source[i];
      i++;
    }
    return {
      exponent: { kind: "literal", count: parseInt(digits, 10) },
      rawSuffix: `^${digits}`,
      endIdx: i,
    };
  }

  if (/[A-Za-z]/.test(next)) {
    return {
      exponent: { kind: "variable", name: next, lowerBound: 0 },
      rawSuffix: `^${next}`,
      endIdx: i + 1,
    };
  }

  fail(
    "badExponent",
    `Expected a variable letter or an integer after '^' at position ${i}.`,
    { position: String(i) },
  );
}

function parsePattern(
  source: string,
  startIdx: number,
): { factors: PatternFactor[]; endIdx: number } {
  let i = startIdx;
  const factors: PatternFactor[] = [];

  while (i < source.length && source[i] !== ")") {
    if (isPatternFiller(source[i])) {
      i++;
      continue;
    }

    const { atom, atomText, endIdx } = parseAtom(source, i);
    const exponent = parseExponent(source, endIdx);
    i = exponent.endIdx;

    factors.push({
      atom,
      atomText,
      exponent: exponent.exponent,
      rawText: atomText + exponent.rawSuffix,
    });
  }

  return { factors, endIdx: i };
}

/**
 * Whether an atom spells out one fixed word, so the grammar builder can walk
 * it symbol by symbol. `ε`, a symbol and a concatenation of those qualify;
 * a `star` (from a variable exponent inside a group) does not.
 */
function isFixedWordAtom(node: RegexNode): boolean {
  switch (node.kind) {
    case "epsilon":
    case "symbol":
      return true;
    case "concat":
      return isFixedWordAtom(node.left) && isFixedWordAtom(node.right);
    default:
      return false;
  }
}

function isSymbolChar(c: string): boolean {
  // A terminal symbol is any printable single char that's not a special token.
  if (c === "(" || c === ")" || c === "^" || c === "|" || c === ",")
    return false;
  return /^[\S]$/.test(c);
}

function patternToRegex(factors: PatternFactor[]): RegexNode {
  if (factors.length === 0) return { kind: "epsilon" };
  let acc: RegexNode | null = null;
  for (const f of factors) {
    const r = factorToRegex(f);
    acc = acc ? { kind: "concat", left: acc, right: r } : r;
  }
  return acc!;
}

function factorToRegex(f: PatternFactor): RegexNode {
  const exp = f.exponent;
  if (exp.kind === "none") return f.atom;
  if (exp.kind === "literal") return repeatExactly(f.atom, exp.count);
  // variable
  const fixed = repeatExactly(f.atom, exp.lowerBound);
  const star: RegexNode = { kind: "star", child: f.atom };
  if (exp.lowerBound === 0) return star;
  return { kind: "concat", left: fixed, right: star };
}

function repeatExactly(atom: RegexNode, n: number): RegexNode {
  if (n <= 0) return { kind: "epsilon" };
  let acc: RegexNode = atom;
  for (let i = 1; i < n; i++) {
    acc = { kind: "concat", left: acc, right: atom };
  }
  return acc;
}

/* ── Constraint parser ─────────────────────────────────────────────── */

interface ConstraintGroup {
  vars: string[];
  lowerBound: number;
  /** Set when the constraint pins the variable with `=`, e.g. `n = 3`. */
  exact: number | null;
}

function parseConstraintsText(text: string): ConstraintGroup[] {
  if (text.length === 0) return [];
  const pieces = splitTopLevelCommas(text);
  const groups: ConstraintGroup[] = [];
  const buffered: string[] = [];

  for (const rawPiece of pieces) {
    const piece = rawPiece.trim();
    if (piece.length === 0) continue;

    // Find first whitespace or operator-ish boundary after the leading identifier.
    const headMatch = piece.match(/^([A-Za-z])\s*(.*)$/);
    if (!headMatch) {
      fail(
        "constraintVariable",
        `Expected a variable name at start of constraint '${piece}'.`,
        { constraint: piece },
      );
    }
    const varName = headMatch[1];
    const rest = headMatch[2].trim();

    if (rest.length === 0) {
      buffered.push(varName);
      continue;
    }

    const vars = [...buffered, varName];
    buffered.length = 0;
    groups.push({ vars, ...computeBound(rest) });
  }

  if (buffered.length > 0) {
    // Variables with no constraint default to ≥ 0.
    groups.push({ vars: buffered.slice(), lowerBound: 0, exact: null });
  }
  return groups;
}

/** ℕ and ℕ0 both say "≥ 0", which is already the default lower bound. */
const NATURAL_NUMBER_SETS = new Set(["N", "ℕ", "N0", "ℕ0"]);
const LOWER_BOUND_OPERATORS = new Set([">", ">=", "≥", "="]);
const UPPER_BOUND_OPERATORS = new Set(["<", "<=", "≤"]);

/** Normalise so the simple split works on `n>0` and `n >= 1` alike. */
function tokenizeConstraint(text: string): string[] {
  const normalised = text
    .replace(/∈/g, " ∈ ")
    .replace(/\bin\b/gi, " in ")
    .replace(/(>=|<=|≥|≤|>|<|=)/g, " $1 ")
    .replace(/\s+/g, " ")
    .trim();

  return normalised.length === 0 ? [] : normalised.split(" ");
}

/** `n ∈ ℕ` only restates the default bound; any other set is rejected. */
function assertNaturalNumberSet(op: string, operand: string | undefined): void {
  if (operand !== undefined && NATURAL_NUMBER_SETS.has(operand)) return;

  fail(
    "expectedNaturals",
    `Expected ℕ (or N) after '${op}', got '${operand ?? "end of input"}'.`,
    { op, got: operand ?? "end of input" },
  );
}

/** The bound one comparison imposes. `>` is strict, `=` pins the value. */
function readComparison(
  op: string,
  operand: string | undefined,
): { lowerBound: number; exact: number | null } {
  if (operand === undefined || !/^\d+$/.test(operand)) {
    fail("expectedInteger", `Expected an integer after '${op}'.`, { op });
  }

  const value = parseInt(operand, 10);
  return {
    lowerBound: op === ">" ? value + 1 : value,
    exact: op === "=" ? value : null,
  };
}

/**
 * Fold one variable's constraint text into a lower bound and, for `n = k`, the
 * exact value. Every accepted token comes with an operand, so the scan always
 * advances in pairs.
 */
function computeBound(text: string): {
  lowerBound: number;
  exact: number | null;
} {
  const tokens = tokenizeConstraint(text);
  let lowerBound = 0;
  let exact: number | null = null;

  for (let i = 0; i < tokens.length; i += 2) {
    const token = tokens[i];
    const operand = tokens[i + 1];

    if (token === "in" || token === "∈") {
      assertNaturalNumberSet(token, operand);
      continue;
    }

    if (LOWER_BOUND_OPERATORS.has(token)) {
      const bound = readComparison(token, operand);
      if (bound.exact !== null) exact = bound.exact;
      if (bound.lowerBound > lowerBound) lowerBound = bound.lowerBound;
      continue;
    }

    if (UPPER_BOUND_OPERATORS.has(token)) {
      fail(
        "upperBound",
        `Upper bounds ('${token}') are not supported — they would make the language finite. Use enumeration instead.`,
        { op: token },
      );
    }

    fail("unexpectedToken", `Unexpected token '${token}' in constraint.`, {
      token,
    });
  }

  return { lowerBound, exact };
}

/* ── Shared helpers ────────────────────────────────────────────────── */

/** +1 for an opening bracket, -1 for a closing one, 0 for anything else. */
function bracketDelta(c: string, openers: string, closers: string): number {
  if (openers.includes(c)) return 1;
  if (closers.includes(c)) return -1;
  return 0;
}

/**
 * Walk `s` and hand `visit` every character that sits at bracket depth 0 and
 * outside any quoted run; returning `true` stops the walk. Both the constraint
 * bar search and the comma split need exactly this, and neither should have to
 * re-implement the quote and bracket bookkeeping.
 */
function forEachTopLevelChar(
  s: string,
  openers: string,
  closers: string,
  visit: (char: string, index: number) => boolean | void,
): void {
  let depth = 0;
  let inQuote: string | null = null;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];

    if (inQuote) {
      if (c === inQuote) inQuote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      inQuote = c;
      continue;
    }

    const delta = bracketDelta(c, openers, closers);
    if (delta !== 0) {
      depth += delta;
      continue;
    }
    if (depth === 0 && visit(c, i) === true) return;
  }
}

/** Index of the `|` that separates pattern from constraints, or -1. */
function findTopLevelBar(body: string): number {
  let barIndex = -1;
  forEachTopLevelChar(body, "(", ")", (c, i) => {
    if (c !== "|") return;
    barIndex = i;
    return true;
  });
  return barIndex;
}

/** Split on commas that belong to the list itself, not to a nested item. */
function splitTopLevelCommas(s: string): string[] {
  const parts: string[] = [];
  let start = 0;

  forEachTopLevelChar(s, "({", ")}", (c, i) => {
    if (c !== ",") return;
    parts.push(s.slice(start, i));
    start = i + 1;
  });

  parts.push(s.slice(start));
  return parts;
}
