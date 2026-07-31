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
  /** Internal AST that the grammar builder consumes — not displayed. */
  regex: RegexNode;
}

export type LanguageSpec = EnumerationLang | SetBuilderLang;

/**
 * A parse failure as a translatable code plus its interpolation values.
 * The matching strings live under `rl.languageErrors.*`.
 */
export interface LanguageParseIssue {
  code:
    | "empty"
    | "variableReused"
    | "patternUnexpectedChar"
    | "missingGroupClose"
    | "trailingCaret"
    | "badExponent"
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
export function languageIssueKey(issue: LanguageParseIssue): string {
  return `rl.languageErrors.${issue.code}`;
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

function parseEnumerationBody(body: string): ParseLanguageResult {
  const items = splitTopLevelCommas(body);
  const words: string[] = [];
  let sawContinuation = false;
  for (const itemRaw of items) {
    let item = itemRaw.trim();
    if (item.length === 0) continue;
    if (
      (item.startsWith('"') && item.endsWith('"') && item.length >= 2) ||
      (item.startsWith("'") && item.endsWith("'") && item.length >= 2)
    ) {
      item = item.slice(1, -1);
    }
    if (/^\.{2,}$/.test(item)) {
      sawContinuation = true;
      continue;
    }
    if (item === "ε" || item === "epsilon") item = "";
    words.push(item);
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
    regex: patternToRegex(factors),
  };
}

/* ── Set-builder form ──────────────────────────────────────────────── */

function parseSetBuilderBody(
  patternText: string,
  constraintsText: string,
): ParseLanguageResult {
  try {
    const factors = parsePatternText(patternText);

    // A pattern with no factors means ε.
    const usage = new Map<string, number>();
    for (const f of factors) {
      if (f.exponent.kind === "variable") {
        usage.set(f.exponent.name, (usage.get(f.exponent.name) ?? 0) + 1);
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

    const constraintGroups = parseConstraintsText(constraintsText);
    const lowerBound = new Map<string, number>();
    const exactCount = new Map<string, number>();
    for (const group of constraintGroups) {
      for (const v of group.vars) {
        const prev = lowerBound.get(v) ?? 0;
        lowerBound.set(v, Math.max(prev, group.lowerBound));
        if (group.exact !== null) exactCount.set(v, group.exact);
      }
    }
    // Variables introduced in the pattern but unconstrained default to ≥ 0.
    for (const f of factors) {
      if (f.exponent.kind === "variable" && !lowerBound.has(f.exponent.name)) {
        lowerBound.set(f.exponent.name, 0);
      }
    }
    // Apply bounds to the factors. `n = k` pins the exponent to exactly k, so
    // the factor stops being variable — `{a^n | n = 3}` is the finite {aaa},
    // not a^3 a*.
    for (const f of factors) {
      if (f.exponent.kind !== "variable") continue;
      const exact = exactCount.get(f.exponent.name);
      if (exact !== undefined) {
        f.exponent = { kind: "literal", count: exact };
        continue;
      }
      f.exponent.lowerBound = lowerBound.get(f.exponent.name) ?? 0;
    }

    const regex = patternToRegex(factors);
    const variableBounds: VariableBound[] = [];
    // Preserve the order variables first appear in the pattern.
    for (const f of factors) {
      if (f.exponent.kind === "variable") {
        const name = f.exponent.name;
        if (!variableBounds.some((b) => b.name === name)) {
          variableBounds.push({ name, lowerBound: lowerBound.get(name) ?? 0 });
        }
      }
    }

    return {
      ok: true,
      spec: {
        kind: "setBuilder",
        pattern: factors,
        variableBounds,
        regex,
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

function parsePattern(
  source: string,
  startIdx: number,
): { factors: PatternFactor[]; endIdx: number } {
  let i = startIdx;
  const factors: PatternFactor[] = [];

  while (i < source.length) {
    const c = source[i];
    if (c === " " || c === "\t" || c === "·" || c === "⋅") {
      i++;
      continue;
    }
    if (c === ")") break;

    let atom: RegexNode;
    let atomText: string;

    if (c === "(") {
      i++;
      const sub = parsePattern(source, i);
      if (source[sub.endIdx] !== ")") {
        fail(
          "missingGroupClose",
          `Missing ')' to close group starting before position ${i}.`,
          { position: String(i) },
        );
      }
      atom = patternToRegex(sub.factors);
      atomText = `(${sub.factors.map((f) => f.rawText).join("")})`;
      i = sub.endIdx + 1;
    } else if (c === "ε" || c === "λ") {
      atom = { kind: "epsilon" };
      atomText = "ε";
      i++;
    } else if (isSymbolChar(c)) {
      atom = { kind: "symbol", value: c };
      atomText = c;
      i++;
    } else {
      fail(
        "patternUnexpectedChar",
        `Unexpected character '${c}' in pattern at position ${i}.`,
        { char: c, position: String(i) },
      );
    }

    let exponent: ExponentSpec = { kind: "none" };
    let rawSuffix = "";
    if (source[i] === "^") {
      i++;
      rawSuffix = "^";
      const next = source[i];
      if (next === undefined) {
        fail("trailingCaret", "Trailing '^' without exponent.");
      }
      if (/[0-9]/.test(next)) {
        let numStr = "";
        while (i < source.length && /[0-9]/.test(source[i])) {
          numStr += source[i];
          i++;
        }
        exponent = { kind: "literal", count: parseInt(numStr, 10) };
        rawSuffix += numStr;
      } else if (/[A-Za-z]/.test(next)) {
        exponent = { kind: "variable", name: next, lowerBound: 0 };
        rawSuffix += next;
        i++;
      } else {
        fail(
          "badExponent",
          `Expected a variable letter or an integer after '^' at position ${i}.`,
          { position: String(i) },
        );
      }
    }

    factors.push({
      atom,
      atomText,
      exponent,
      rawText: atomText + rawSuffix,
    });
  }

  return { factors, endIdx: i };
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

function computeBound(text: string): {
  lowerBound: number;
  exact: number | null;
} {
  // Normalise so the simple split works on `n>0` and `n >= 1` alike.
  const normalised = text
    .replace(/∈/g, " ∈ ")
    .replace(/\bin\b/gi, " in ")
    .replace(/(>=|<=|≥|≤|>|<|=)/g, " $1 ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = normalised.length === 0 ? [] : normalised.split(" ");
  let lb = 0;
  let exact: number | null = null;
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === "in" || t === "∈") {
      const next = tokens[i + 1];
      if (next === "N" || next === "ℕ") {
        // Default lb is 0 — no change.
        i += 2;
        continue;
      }
      if (next === "N0" || next === "ℕ0") {
        i += 2;
        continue;
      }
      fail(
        "expectedNaturals",
        `Expected ℕ (or N) after '${t}', got '${next ?? "end of input"}'.`,
        { op: t, got: next ?? "end of input" },
      );
    }
    if (t === ">" || t === ">=" || t === "≥" || t === "=") {
      const numStr = tokens[i + 1];
      if (numStr === undefined || !/^\d+$/.test(numStr)) {
        fail("expectedInteger", `Expected an integer after '${t}'.`, { op: t });
      }
      const num = parseInt(numStr, 10);
      // `=` pins the exponent exactly; the others only raise the lower bound.
      if (t === "=") exact = num;
      const opLb = t === ">" ? num + 1 : num;
      if (opLb > lb) lb = opLb;
      i += 2;
      continue;
    }
    if (t === "<" || t === "<=" || t === "≤") {
      fail(
        "upperBound",
        `Upper bounds ('${t}') are not supported — they would make the language finite. Use enumeration instead.`,
        { op: t },
      );
    }
    fail("unexpectedToken", `Unexpected token '${t}' in constraint.`, {
      token: t,
    });
  }

  return { lowerBound: lb, exact };
}

/* ── Shared helpers ────────────────────────────────────────────────── */

function findTopLevelBar(body: string): number {
  let depth = 0;
  let inQuote: string | null = null;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (inQuote) {
      if (c === inQuote) inQuote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      inQuote = c;
      continue;
    }
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === "|" && depth === 0) return i;
  }
  return -1;
}

function splitTopLevelCommas(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inQuote: string | null = null;
  let start = 0;
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
    if (c === "(" || c === "{") depth++;
    else if (c === ")" || c === "}") depth--;
    else if (c === "," && depth === 0) {
      parts.push(s.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(s.slice(start));
  return parts;
}

/** Format an enumeration back as canonical text for an editor seed. */
export function formatEnumerationSource(words: string[]): string {
  const items = words.map((w) => (w === "" ? "ε" : `"${w}"`));
  return `L = {${items.join(", ")}}`;
}
