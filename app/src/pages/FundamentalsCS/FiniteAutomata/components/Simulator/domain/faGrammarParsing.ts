import type { TFunction } from "i18next";
import type { TranslationKey } from "@/types/i18n";
import type { RegularGrammar, ProductionRule } from "./faTypes";

/** Bare production lines, or the `type:`/`productions:` block form. */
export type GrammarFormat = "simple" | "structured";

/**
 * A parse failure as a translatable code plus its interpolation values.
 * The matching strings live under `grammar.errors.*` so both the Finite
 * Automata and the Regular Languages panels render the same wording.
 */
export interface GrammarParseIssue {
  code:
    | "noProductions"
    | "missingArrow"
    | "emptyAlternative"
    | "epsilonNotAlone"
    | "unitProduction"
    | "undefinedNonTerminal"
    | "unsupportedType"
    | "structuredLine"
    | "structuredMissingType";
  params?: Record<string, string>;
}

export interface ParseGrammarSuccess {
  ok: true;
  grammar: RegularGrammar;
  format: GrammarFormat;
}

export interface ParseGrammarFailure {
  ok: false;
  /** Untranslated fallback — always populated so logs and tests stay readable. */
  error: string;
  issue: GrammarParseIssue;
  format: GrammarFormat | null;
}

export type ParseGrammarResult = ParseGrammarSuccess | ParseGrammarFailure;

/** Translation key for a parse issue, for use with i18next's `t()`. */
function grammarIssueKey(issue: GrammarParseIssue): string {
  return `grammar.errors.${issue.code}`;
}

/**
 * Render a parse issue in the active language. `fallback` is the untranslated
 * message from the parser, used if a code ever ships without a translation.
 */
export function formatGrammarIssue(
  t: TFunction,
  issue: GrammarParseIssue,
  fallback: string,
): string {
  return t(grammarIssueKey(issue) as TranslationKey, {
    ...issue.params,
    defaultValue: fallback,
  });
}

/** Thrown internally; `parseGrammarSource` converts it into a failure result. */
class GrammarParseError extends Error {
  readonly issue: GrammarParseIssue;

  constructor(issue: GrammarParseIssue, message: string) {
    super(message);
    this.issue = issue;
  }
}

function fail(
  code: GrammarParseIssue["code"],
  message: string,
  params?: Record<string, string>,
): never {
  throw new GrammarParseError({ code, params }, message);
}

/**
 * Which format the user typed: "structured" when it opens with `type: grammar`
 * and a `productions:` block, "simple" for bare production lines.
 */
export function detectGrammarFormat(source: string): GrammarFormat {
  const lines = source.split(/\r?\n/);
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) continue;
    if (/^type\s*:/i.test(trimmed)) return "structured";
    return "simple";
  }
  return "simple";
}

/**
 * Parse either format into a fully-populated `RegularGrammar`. Only right-linear
 * (Type 3) grammars are accepted — see {@link buildGrammarFromProductions}.
 */
export function parseGrammarSource(source: string): ParseGrammarResult {
  const format = detectGrammarFormat(source);
  try {
    const productionLines =
      format === "structured"
        ? extractStructuredProductions(source)
        : extractSimpleProductions(source);

    if (productionLines.length === 0) {
      return {
        ok: false,
        error:
          "No production rules found. Add at least one rule like 'S -> 0S | 1A'.",
        issue: { code: "noProductions" },
        format,
      };
    }

    const grammar = buildGrammarFromProductions(productionLines);
    return { ok: true, grammar, format };
  } catch (e) {
    if (e instanceof GrammarParseError) {
      return { ok: false, error: e.message, issue: e.issue, format };
    }
    const message = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      error: message,
      issue: { code: "noProductions" },
      format,
    };
  }
}

/** Non-empty, non-comment lines of a simple-format source. */
function extractSimpleProductions(source: string): string[] {
  return source
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
}

/** A `key: value` header line, lower-cased key and trimmed value. */
function parseHeaderLine(
  trimmed: string,
): { key: string; value: string } | null {
  const match = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/.exec(trimmed);
  if (!match) return null;
  return { key: match[1].toLowerCase(), value: match[2].trim() };
}

/** `type:` is the one header whose value is constrained. */
function assertGrammarType(value: string): void {
  if (value.toLowerCase() !== "grammar") {
    fail(
      "unsupportedType",
      `Unsupported type '${value}'. Only 'type: grammar' is supported.`,
      { type: value },
    );
  }
}

/**
 * Read the structured format: a `type: grammar` header, then a `productions:`
 * block whose lines are the rules. Any other key ends the block it follows.
 */
function extractStructuredProductions(source: string): string[] {
  const productionLines: string[] = [];
  let sawType = false;
  let inProductionsBlock = false;

  source.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) return;

    const header = parseHeaderLine(trimmed);
    if (header) {
      inProductionsBlock = header.key === "productions";
      if (header.key === "type") {
        assertGrammarType(header.value);
        sawType = true;
      } else if (inProductionsBlock && header.value.length > 0) {
        // `productions: S -> aS` puts the first rule on the header line.
        productionLines.push(header.value);
      }
      return;
    }

    if (!inProductionsBlock) {
      fail(
        "structuredLine",
        `Line ${index + 1}: expected 'key: value' or production rule`,
        { line: String(index + 1) },
      );
    }
    productionLines.push(trimmed);
  });

  if (!sawType) {
    fail(
      "structuredMissingType",
      "Structured format requires a 'type: grammar' header.",
    );
  }

  return productionLines;
}

/** A production line after the arrow split, before parsing alternatives. */
interface SplitLine {
  lhs: string;
  alternatives: string[];
  raw: string;
}

/** Pass 1: split each line into its left-hand side and its alternatives. */
function splitProductionLines(productionLines: string[]): SplitLine[] {
  return productionLines.map((line) => {
    const arrowMatch = line.match(/^(\S+)\s*(?:->|→)\s*(.+)$/);
    if (!arrowMatch) {
      fail(
        "missingArrow",
        `Cannot parse production '${line}' (expected 'LHS -> RHS')`,
        { line },
      );
    }

    return {
      lhs: arrowMatch[1],
      alternatives: arrowMatch[2].split("|").map((s) => s.trim()),
      raw: line,
    };
  });
}

/** What one right-hand-side alternative means, once it has been validated. */
type Alternative =
  | { kind: "epsilon" }
  | { kind: "rule"; terminal: string; nextNonTerminal: string | null };

/**
 * Read one alternative, rejecting everything that is not right-linear. A name may
 * be both (`A -> AA` is terminal A then non-terminal A), so the split needs
 * `declared` rather than the characters alone.
 */
function classifyAlternative(
  alt: string,
  raw: string,
  declared: Set<string>,
): Alternative {
  if (alt.length === 0) {
    fail("emptyAlternative", `Empty alternative in '${raw}'`, { line: raw });
  }

  if (alt === "ε" || alt === "epsilon") {
    return { kind: "epsilon" };
  }

  if (alt.includes("ε") || /(^|[^a-z])epsilon([^a-z]|$)/i.test(alt)) {
    fail(
      "epsilonNotAlone",
      `ε must stand alone as an alternative (got '${alt}' in '${raw}')`,
      { alternative: alt, line: raw },
    );
  }

  // `A -> B`: a bare non-terminal is a unit production, not right-linear.
  if (declared.has(alt)) {
    fail(
      "unitProduction",
      `'${alt}' in '${raw}' is only a non-terminal. A right-linear rule needs a terminal first, e.g. 'aB'.`,
      { alternative: alt, line: raw },
    );
  }

  const terminal = alt[0];
  const rest = alt.slice(1);
  if (rest.length === 0) {
    return { kind: "rule", terminal, nextNonTerminal: null };
  }

  // Anything after the terminal has to be a non-terminal with its own rule.
  // This is what catches `S -> ab` (two terminals) and `S -> aSb` (not
  // right-linear) instead of inventing a bogus non-terminal.
  if (!declared.has(rest)) {
    fail(
      "undefinedNonTerminal",
      `'${alt}' in '${raw}' is not right-linear: '${rest}' has no rule of its own. Write a single terminal ('A -> a') or a terminal followed by a defined non-terminal ('A -> aB').`,
      { alternative: alt, rest, line: raw },
    );
  }

  return { kind: "rule", terminal, nextNonTerminal: rest };
}

/**
 * Build a right-linear grammar from production lines: every alternative is `ε`
 * alone, a single terminal, or a terminal plus a non-terminal. Left-hand sides
 * are collected in a first pass, so a rule may reference a non-terminal defined
 * further down.
 */
function buildGrammarFromProductions(
  productionLines: string[],
): RegularGrammar {
  const lines = splitProductionLines(productionLines);
  const declared = new Set(lines.map((line) => line.lhs));

  const productions: ProductionRule[] = [];
  const nonTerminals = new Set<string>(declared);
  const terminals = new Set<string>();
  const epsilonProducers = new Set<string>();

  for (const { lhs, alternatives, raw } of lines) {
    for (const alt of alternatives) {
      const parsed = classifyAlternative(alt, raw, declared);
      if (parsed.kind === "epsilon") {
        epsilonProducers.add(lhs);
        continue;
      }

      terminals.add(parsed.terminal);
      if (parsed.nextNonTerminal !== null) {
        nonTerminals.add(parsed.nextNonTerminal);
      }
      productions.push({
        lhs,
        terminal: parsed.terminal,
        nextNonTerminal: parsed.nextNonTerminal,
      });
    }
  }

  return {
    nonTerminals: [...nonTerminals],
    terminals: [...terminals],
    startSymbol: lines[0]?.lhs ?? "S",
    productions,
    epsilonProducingNonTerminals: [...epsilonProducers],
  };
}
