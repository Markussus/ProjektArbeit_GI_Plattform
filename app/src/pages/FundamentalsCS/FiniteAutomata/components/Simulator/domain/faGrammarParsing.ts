import type { TFunction } from "i18next";
import type { TranslationKey } from "@/types/i18n";
import type { RegularGrammar, ProductionRule } from "./faTypes";

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
export function grammarIssueKey(issue: GrammarParseIssue): string {
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
 * Detect which grammar input format the user typed.
 *
 * - "structured": starts with `type: grammar` followed by a `productions:` block
 * - "simple": one production per line, e.g. `S -> 0S | 1A`
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
 * Parse either grammar format and return a fully-populated `RegularGrammar`.
 *
 * Format 1 (simple):
 *   S -> 0S | 1A
 *   A -> 0A | 1
 *
 * Format 2 (structured):
 *   type: grammar
 *   productions:
 *   S -> 0S | 1A
 *   A -> 0A | 1
 *
 * Only right-linear (Type 3) grammars are accepted — see
 * {@link buildGrammarFromProductions} for the exact rule.
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

function extractSimpleProductions(source: string): string[] {
  return source
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
}

function extractStructuredProductions(source: string): string[] {
  const lines = source.split(/\r?\n/);
  const productionLines: string[] = [];
  let sawType = false;
  let inProductionsBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) continue;

    const keyMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/.exec(trimmed);
    if (keyMatch) {
      const key = keyMatch[1].toLowerCase();
      const value = keyMatch[2].trim();
      if (key === "type") {
        sawType = true;
        if (value.toLowerCase() !== "grammar") {
          fail(
            "unsupportedType",
            `Unsupported type '${value}'. Only 'type: grammar' is supported.`,
            { type: value },
          );
        }
        inProductionsBlock = false;
        continue;
      }
      if (key === "productions") {
        inProductionsBlock = true;
        if (value.length > 0) productionLines.push(value);
        continue;
      }
      // Unknown key: ignore but exit the productions block.
      inProductionsBlock = false;
      continue;
    }

    if (inProductionsBlock) {
      productionLines.push(trimmed);
    } else {
      fail(
        "structuredLine",
        `Line ${i + 1}: expected 'key: value' or production rule`,
        { line: String(i + 1) },
      );
    }
  }

  if (!sawType) {
    fail(
      "structuredMissingType",
      "Structured format requires a 'type: grammar' header.",
    );
  }

  return productionLines;
}

interface SplitLine {
  lhs: string;
  alternatives: string[];
  raw: string;
}

/**
 * Build a right-linear grammar from production lines.
 *
 * Every alternative on a right-hand side must be one of
 *   - `ε` (or the word `epsilon`), standing alone;
 *   - a single terminal symbol,      e.g. `A -> a`;
 *   - a terminal plus a non-terminal, e.g. `A -> aB`.
 *
 * Terminals and non-terminals may share a name (`A -> AA` reads "terminal A
 * followed by non-terminal A"), so the split cannot be decided from the
 * characters alone. The left-hand sides are the ground truth: a symbol is a
 * non-terminal exactly when some rule defines it. That is why this runs in two
 * passes — it also lets rules reference non-terminals defined further down.
 */
function buildGrammarFromProductions(
  productionLines: string[],
): RegularGrammar {
  // ── Pass 1: collect the declared non-terminals ──────────────────────────
  const declared = new Set<string>();
  const lines: SplitLine[] = [];

  for (const line of productionLines) {
    const arrowMatch = line.match(/^(\S+)\s*(?:->|→)\s*(.+)$/);
    if (!arrowMatch) {
      fail(
        "missingArrow",
        `Cannot parse production '${line}' (expected 'LHS -> RHS')`,
        { line },
      );
    }
    const lhs = arrowMatch[1];
    declared.add(lhs);
    lines.push({
      lhs,
      alternatives: arrowMatch[2].split("|").map((s) => s.trim()),
      raw: line,
    });
  }

  // ── Pass 2: split each alternative into terminal + optional non-terminal ─
  const productions: ProductionRule[] = [];
  const nonTerminals = new Set<string>(declared);
  const terminals = new Set<string>();
  const epsilonProducers = new Set<string>();

  for (const { lhs, alternatives, raw } of lines) {
    for (const alt of alternatives) {
      if (alt.length === 0) {
        fail("emptyAlternative", `Empty alternative in '${raw}'`, {
          line: raw,
        });
      }
      if (alt === "ε" || alt === "epsilon") {
        epsilonProducers.add(lhs);
        continue;
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
        terminals.add(terminal);
        productions.push({ lhs, terminal, nextNonTerminal: null });
        continue;
      }

      // Anything after the terminal has to be a non-terminal with its own
      // rule. This is what catches `S -> ab` (two terminals) and `S -> aSb`
      // (not right-linear) instead of inventing a bogus non-terminal.
      if (!declared.has(rest)) {
        fail(
          "undefinedNonTerminal",
          `'${alt}' in '${raw}' is not right-linear: '${rest}' has no rule of its own. Write a single terminal ('A -> a') or a terminal followed by a defined non-terminal ('A -> aB').`,
          { alternative: alt, rest, line: raw },
        );
      }

      terminals.add(terminal);
      nonTerminals.add(rest);
      productions.push({ lhs, terminal, nextNonTerminal: rest });
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
