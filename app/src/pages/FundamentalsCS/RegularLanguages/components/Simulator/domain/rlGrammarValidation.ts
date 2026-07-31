import {
  parseGrammarSource,
  type GrammarParseIssue,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faGrammarParsing";
import { validateRegularGrammar } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faGrammarConversion";
import type { RegularGrammar } from "./rlTypes";

export interface ParsedGrammarState {
  ok: boolean;
  grammar: RegularGrammar | null;
  /** Untranslated fallback text; prefer {@link ParsedGrammarState.issue}. */
  error: string | null;
  /** Translatable failure, or null when the source is empty / valid. */
  issue: GrammarParseIssue | null;
  /** Structural problems reported by `validateRegularGrammar`. */
  validationCodes: string[];
}

const OK: ParsedGrammarState = {
  ok: false,
  grammar: null,
  error: null,
  issue: null,
  validationCodes: [],
};

/**
 * Parse + validate grammar source text in one step. Returns a state object
 * suitable for both gating downstream computations and rendering inline
 * error messages in the UI.
 */
export function parseGrammar(source: string): ParsedGrammarState {
  if (source.trim().length === 0) {
    return OK;
  }
  const parsed = parseGrammarSource(source);
  if (!parsed.ok) {
    return {
      ok: false,
      grammar: null,
      error: parsed.error,
      issue: parsed.issue,
      validationCodes: [],
    };
  }
  const validationErrors = validateRegularGrammar(parsed.grammar);
  if (validationErrors.length > 0) {
    return {
      ok: false,
      grammar: null,
      error: validationErrors.join(", "),
      issue: null,
      validationCodes: validationErrors,
    };
  }
  return {
    ok: true,
    grammar: parsed.grammar,
    error: null,
    issue: null,
    validationCodes: [],
  };
}
