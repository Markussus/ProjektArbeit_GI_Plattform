import { describe, it, expect } from "vitest";
import { parseLanguageSpec } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlLanguageSpecParser";
import {
  formatGrammar,
  minimizeRightLinearGrammar,
  setBuilderToRightLinearGrammar,
} from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlRegexToGrammar";
import {
  enumerateLanguage,
  recognizeWord,
} from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlLanguageOps";
import type { RegularGrammar } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlTypes";

function rightLinearFor(source: string): RegularGrammar {
  const parsed = parseLanguageSpec(source);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error("unreachable");
  expect(parsed.spec.kind).toBe("setBuilder");
  if (parsed.spec.kind !== "setBuilder") throw new Error("unreachable");
  return setBuilderToRightLinearGrammar(parsed.spec);
}

describe("setBuilderToRightLinearGrammar", () => {
  it("only emits right-linear productions", () => {
    for (const source of [
      "L = {a^n c b^m | n, m > 0}",
      "L = {a^n | n in N}",
      "L = {(ab)^n | n >= 1}",
      "L = {a^n b | n >= 2}",
      "L = {0^n 1 0^m | n, m >= 1}",
    ]) {
      const grammar = rightLinearFor(source);
      for (const rule of grammar.productions) {
        expect(rule.terminal).toHaveLength(1);
        expect(grammar.nonTerminals).toContain(rule.lhs);
        if (rule.nextNonTerminal !== null) {
          expect(grammar.nonTerminals).toContain(rule.nextNonTerminal);
        }
      }
    }
  });

  it("derives exactly the words of {a^n c b^m | n, m > 0}", () => {
    const grammar = rightLinearFor("L = {a^n c b^m | n, m > 0}");
    for (const word of ["acb", "aacb", "acbb", "aaacbbb"]) {
      expect(recognizeWord(grammar, word).accepted).toBe(true);
    }
    for (const word of ["", "cb", "ac", "abc", "acbc", "aab"]) {
      expect(recognizeWord(grammar, word).accepted).toBe(false);
    }
  });

  it("handles a lower bound of zero", () => {
    const grammar = rightLinearFor("L = {a^n | n in N}");
    expect(recognizeWord(grammar, "").accepted).toBe(true);
    expect(recognizeWord(grammar, "aaa").accepted).toBe(true);
    expect(recognizeWord(grammar, "b").accepted).toBe(false);
  });

  it("keeps multi-symbol groups together", () => {
    const grammar = rightLinearFor("L = {(ab)^n | n >= 1}");
    expect(
      enumerateLanguage(grammar, { maxLen: 6, maxWords: 5 }).words,
    ).toEqual(["ab", "abab", "ababab"]);
    expect(recognizeWord(grammar, "aba").accepted).toBe(false);
  });

  it("respects a lower bound above one", () => {
    const grammar = rightLinearFor("L = {a^n b | n >= 2}");
    expect(recognizeWord(grammar, "ab").accepted).toBe(false);
    expect(recognizeWord(grammar, "aab").accepted).toBe(true);
    expect(recognizeWord(grammar, "aaab").accepted).toBe(true);
  });

  it("groups alternatives of the same non-terminal on one line", () => {
    const text = formatGrammar(rightLinearFor("L = {a^n c b^m | n, m > 0}"));
    expect(text).toBe(
      ["S -> aA", "A -> aA | cB", "B -> bC", "C -> bC | ε"].join("\n"),
    );
  });
});

describe("minimizeRightLinearGrammar (the Simplified view)", () => {
  const SOURCES = [
    "L = {a^n c b^m | n, m > 0}",
    "L = {a^n | n in N}",
    "L = {(ab)^n | n >= 1}",
    "L = {a^n b | n >= 2}",
    "L = {0^n 1 0^m | n, m >= 1}",
    "L = {a^n | n = 3}",
  ];

  it("never leaves right-linear form", () => {
    for (const source of SOURCES) {
      const grammar = minimizeRightLinearGrammar(rightLinearFor(source));
      for (const rule of grammar.productions) {
        // A regular rule is `A -> a` or `A -> aB` — one terminal, at most one
        // non-terminal, and never a non-terminal in the middle.
        expect(rule.terminal).toHaveLength(1);
        expect(grammar.nonTerminals).toContain(rule.lhs);
        if (rule.nextNonTerminal !== null) {
          expect(grammar.nonTerminals).toContain(rule.nextNonTerminal);
        }
      }
      expect(grammar.nonTerminals).toContain(grammar.startSymbol);
    }
  });

  it("generates the same language as the detailed grammar", () => {
    const probes = [
      "",
      "a",
      "b",
      "ab",
      "aa",
      "acb",
      "aacbb",
      "abab",
      "010",
      "0010",
      "00100",
      "aaa",
      "aaaa",
    ];
    for (const source of SOURCES) {
      const detailed = rightLinearFor(source);
      const simplified = minimizeRightLinearGrammar(detailed);
      for (const word of probes) {
        expect(
          recognizeWord(simplified, word).accepted,
          `${source} / ${JSON.stringify(word)}`,
        ).toBe(recognizeWord(detailed, word).accepted);
      }
    }
  });

  it("never grows the grammar", () => {
    for (const source of SOURCES) {
      const detailed = rightLinearFor(source);
      const simplified = minimizeRightLinearGrammar(detailed);
      expect(simplified.nonTerminals.length).toBeLessThanOrEqual(
        detailed.nonTerminals.length,
      );
    }
  });

  it("returns the detailed grammar unchanged when nothing can be merged", () => {
    // 0ⁿ 1 0ᵐ: every non-terminal derives a different set of suffixes.
    const detailed = rightLinearFor("L = {0^n 1 0^m | n, m >= 1}");
    expect(formatGrammar(minimizeRightLinearGrammar(detailed))).toBe(
      formatGrammar(detailed),
    );
  });

  it("merges non-terminals that derive the same words", () => {
    // a³ chains three separate non-terminals in the detailed form; the tail
    // states are not equivalent, but a bare a* collapses to a single rule.
    const detailed = rightLinearFor("L = {a^n | n in N}");
    const simplified = minimizeRightLinearGrammar(detailed);
    expect(formatGrammar(simplified)).toBe("S -> aS | ε");
  });
});

describe("exact exponents", () => {
  it("reads {a^n | n = 3} as the finite language {aaa}", () => {
    const grammar = rightLinearFor("L = {a^n | n = 3}");
    const { words } = enumerateLanguage(grammar, { maxLen: 8, maxWords: 20 });
    expect(words).toEqual(["aaa"]);
  });

  it("still treats >= as a lower bound", () => {
    const grammar = rightLinearFor("L = {a^n | n >= 3}");
    const { words } = enumerateLanguage(grammar, { maxLen: 5, maxWords: 20 });
    expect(words).toEqual(["aaa", "aaaa", "aaaaa"]);
  });
});

describe("enumerateLanguage truncation flag", () => {
  it("is false when the language ends exactly at the cap", () => {
    const grammar = rightLinearFor("L = {a^n | n = 3}");
    expect(enumerateLanguage(grammar, { maxLen: 8, maxWords: 1 })).toEqual({
      words: ["aaa"],
      truncated: false,
    });
  });

  it("is true when more words exist beyond the cap", () => {
    const grammar = rightLinearFor("L = {a^n | n >= 1}");
    const result = enumerateLanguage(grammar, { maxLen: 8, maxWords: 2 });
    expect(result.words).toEqual(["a", "aa"]);
    expect(result.truncated).toBe(true);
  });
});
