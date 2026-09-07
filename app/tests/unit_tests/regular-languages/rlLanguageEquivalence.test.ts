import { describe, expect, it } from "vitest";
import { compareGrammarLanguages } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlLanguageEquivalence";
import { parseGrammar } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlGrammarValidation";
import type { RegularGrammar } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlTypes";

function grammar(...lines: string[]): RegularGrammar {
  const parsed = parseGrammar(lines.join("\n"));
  if (!parsed.ok || !parsed.grammar) {
    throw new Error(`test grammar does not parse: ${lines.join(" / ")}`);
  }
  return parsed.grammar;
}

/** L = {0 1ⁿ 0 | n ≥ 1} — the exercise this check was built for. */
const zeroOnesZero = grammar("START -> 0A", "A -> 1B", "B -> 1B | 0");

describe("compareGrammarLanguages", () => {
  it("reports no difference for a grammar compared with itself", () => {
    expect(compareGrammarLanguages(zeroOnesZero, zeroOnesZero)).toEqual({
      extra: null,
      missing: null,
      incomplete: false,
    });
  });

  it("reports no difference for a differently named but equivalent grammar", () => {
    const renamed = grammar("S -> 0X", "X -> 1Y", "Y -> 1Y | 0");
    expect(compareGrammarLanguages(renamed, zeroOnesZero)).toEqual({
      extra: null,
      missing: null,
      incomplete: false,
    });
  });

  it("finds the shortest extra word of an over-general grammar", () => {
    const overGeneral = grammar("S -> 0A | 1A", "A -> 1B", "B -> 1B | 0");
    const difference = compareGrammarLanguages(overGeneral, zeroOnesZero);
    expect(difference.extra).toBe("110");
    expect(difference.missing).toBeNull();
  });

  it("finds the shortest missing word of an under-general grammar", () => {
    // Only 010 — every longer word of the language is unreachable.
    const tooNarrow = grammar("S -> 0A", "A -> 1B", "B -> 0");
    const difference = compareGrammarLanguages(tooNarrow, zeroOnesZero);
    expect(difference.missing).toBe("0110");
    expect(difference.extra).toBeNull();
  });

  it("reports both directions when the languages merely overlap", () => {
    const overlapping = grammar("S -> 0A | 1A", "A -> 1B", "B -> 1B | 1");
    const difference = compareGrammarLanguages(overlapping, zeroOnesZero);
    expect(difference.extra).not.toBeNull();
    expect(difference.missing).not.toBeNull();
  });

  it("compares over the union of both alphabets", () => {
    // "2" exists only in the candidate, so a symbol-wise walk that only knew
    // the reference alphabet would miss the extra word entirely.
    const withExtraSymbol = grammar(
      "START -> 0A | 2A",
      "A -> 1B",
      "B -> 1B | 0",
    );
    expect(compareGrammarLanguages(withExtraSymbol, zeroOnesZero).extra).toBe(
      "210",
    );
  });

  it("handles grammars whose language contains the empty word", () => {
    const withEpsilon = grammar("S -> 0S | ε");
    const withoutEpsilon = grammar("S -> 0S | 0");
    expect(compareGrammarLanguages(withEpsilon, withoutEpsilon).extra).toBe("");
  });
});
