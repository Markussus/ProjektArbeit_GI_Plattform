import type { RegularGrammar, ProductionRule } from "./faTypes";

export type GrammarFormat = "simple" | "structured";

export interface ParseGrammarSuccess {
  ok: true;
  grammar: RegularGrammar;
  format: GrammarFormat;
}

export interface ParseGrammarFailure {
  ok: false;
  error: string;
  format: GrammarFormat | null;
}

export type ParseGrammarResult = ParseGrammarSuccess | ParseGrammarFailure;

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
        format,
      };
    }

    const grammar = buildGrammarFromProductions(productionLines);
    return { ok: true, grammar, format };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
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
          throw new Error(
            `Unsupported type '${value}'. Only 'type: grammar' is supported.`,
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
      throw new Error(
        `Line ${i + 1}: expected 'key: value' or production rule`,
      );
    }
  }

  if (!sawType) {
    throw new Error("Structured format requires a 'type: grammar' header.");
  }

  return productionLines;
}

function buildGrammarFromProductions(
  productionLines: string[],
): RegularGrammar {
  const productions: ProductionRule[] = [];
  const inferredNT = new Set<string>();
  const inferredT = new Set<string>();
  const epsilonProducers = new Set<string>();
  let firstLhs: string | null = null;

  for (const line of productionLines) {
    const arrowMatch = line.match(/^(\S+)\s*(?:->|→)\s*(.+)$/);
    if (!arrowMatch) {
      throw new Error(
        `Cannot parse production '${line}' (expected 'LHS -> RHS')`,
      );
    }
    const lhs = arrowMatch[1];
    const rhsAll = arrowMatch[2];
    if (firstLhs === null) firstLhs = lhs;
    inferredNT.add(lhs);

    const alternatives = rhsAll.split("|").map((s) => s.trim());
    for (const alt of alternatives) {
      if (alt.length === 0) {
        throw new Error(`Empty alternative in '${line}'`);
      }
      if (alt === "ε" || alt === "epsilon") {
        epsilonProducers.add(lhs);
        continue;
      }
      if (alt.includes("ε") || /(^|[^a-z])epsilon([^a-z]|$)/i.test(alt)) {
        throw new Error(
          `ε must stand alone as an alternative (got '${alt}' in '${line}')`,
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

  return {
    nonTerminals: [...inferredNT],
    terminals: [...inferredT],
    startSymbol: firstLhs ?? "S",
    productions,
    epsilonProducingNonTerminals: [...epsilonProducers],
  };
}
