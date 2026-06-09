import { parseGrammarSource } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faGrammarParsing";
import { validateRegularGrammar } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faGrammarConversion";
import type { RegularGrammar } from "./rlTypes";

export interface ParsedGrammarState {
  ok: boolean;
  grammar: RegularGrammar | null;
  error: string | null;
}

/**
 * Parse + validate grammar source text in one step. Returns a state object
 * suitable for both gating downstream computations and rendering inline
 * error messages in the UI.
 */
export function parseGrammar(source: string): ParsedGrammarState {
  if (source.trim().length === 0) {
    return { ok: false, grammar: null, error: null };
  }
  const parsed = parseGrammarSource(source);
  if (!parsed.ok) {
    return { ok: false, grammar: null, error: parsed.error };
  }
  const validationErrors = validateRegularGrammar(parsed.grammar);
  if (validationErrors.length > 0) {
    return {
      ok: false,
      grammar: null,
      error: validationErrors.join(", "),
    };
  }
  return { ok: true, grammar: parsed.grammar, error: null };
}
