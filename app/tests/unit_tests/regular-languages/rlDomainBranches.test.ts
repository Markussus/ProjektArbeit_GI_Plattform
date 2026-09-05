import { describe, expect, it } from "vitest";
import {
  enumerateLanguage,
  languageToGrammar,
  recognizeWord,
  recognizeWords,
} from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlLanguageOps";
import {
  formatGrammar,
  minimizeRightLinearGrammar,
  setBuilderToRightLinearGrammar,
} from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlRegexToGrammar";
import { parseLanguageSpec } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlLanguageSpecParser";
import { parseGrammar } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlGrammarValidation";
import type { RegularGrammar } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlTypes";

function grammarOf(source: string): RegularGrammar {
  const parsed = parseGrammar(source);
  if (!parsed.grammar) throw new Error(`unparseable grammar: ${source}`);
  return parsed.grammar;
}

function setBuilderOf(source: string) {
  const parsed = parseLanguageSpec(source);
  if (!parsed.ok || parsed.spec.kind !== "setBuilder") {
    throw new Error(`not a set-builder spec: ${source}`);
  }
  return parsed.spec;
}

describe("enumerateLanguage — limits", () => {
  it("uses the default bounds when none are given", () => {
    const { words, truncated } = enumerateLanguage(grammarOf("S -> aS | b"));

    expect(words.length).toBeGreaterThan(0);
    expect(truncated).toBe(false);
  });

  it("flags truncation once more words exist than the cap allows", () => {
    const { words, truncated } = enumerateLanguage(grammarOf("S -> aS | b"), {
      maxLen: 10,
      maxWords: 3,
    });

    expect(words).toHaveLength(3);
    expect(truncated).toBe(true);
  });

  it("does not flag truncation when the language ends exactly at the cap", () => {
    const { words, truncated } = enumerateLanguage(grammarOf("S -> a | b"), {
      maxWords: 2,
    });

    expect(words).toEqual(["a", "b"]);
    expect(truncated).toBe(false);
  });

  it("returns nothing for a grammar that derives no finished word", () => {
    expect(enumerateLanguage(grammarOf("S -> aS | b"), { maxLen: 0 })).toEqual({
      words: [],
      truncated: false,
    });
  });

  it("orders words by length, then alphabetically", () => {
    const { words } = enumerateLanguage(grammarOf("S -> aS | bS | a | b"), {
      maxLen: 2,
    });

    expect(words).toEqual(["a", "b", "aa", "ab", "ba", "bb"]);
  });

  it("includes the empty word when the start symbol produces ε", () => {
    const { words } = enumerateLanguage(grammarOf("S -> aS | ε"), {
      maxLen: 2,
    });

    expect(words[0]).toBe("");
  });
});

describe("recognizeWord", () => {
  it("accepts a word the grammar derives", () => {
    const result = recognizeWord(grammarOf("S -> aS | b"), "aab");

    expect(result.accepted).toBe(true);
    expect(result.reasonCode).toBe("accepted");
  });

  it("rejects a word that ends in a non-accepting state", () => {
    const result = recognizeWord(grammarOf("S -> aS | b"), "aa");

    expect(result.accepted).toBe(false);
    expect(result.reasonCode).toBe("rejectedStates");
    expect(result.states.length).toBeGreaterThan(0);
  });

  it("reports a dead end when no transition is available", () => {
    const result = recognizeWord(grammarOf("S -> aS | b"), "ba");

    expect(result.accepted).toBe(false);
    expect(result.reasonCode).toBe("rejectedDeadEnd");
  });

  it("rejects a word using a symbol outside the alphabet", () => {
    expect(recognizeWord(grammarOf("S -> aS | b"), "z").accepted).toBe(false);
  });

  it("checks a whole list in one pass", () => {
    const results = recognizeWords(grammarOf("S -> aS | b"), ["b", "ab", "z"]);

    expect(results.map((r) => r.accepted)).toEqual([true, true, false]);
  });
});

describe("languageToGrammar", () => {
  it("builds a prefix-tree grammar for a word list", () => {
    const grammar = languageToGrammar(["ab", "aa"]);

    expect(grammar.startSymbol).toBe("S");
    expect(grammar.terminals.sort()).toEqual(["a", "b"]);
  });

  it("drops duplicates and surrounding whitespace", () => {
    const grammar = languageToGrammar([" ab ", "ab"]);

    expect(grammar.productions.filter((p) => p.lhs === "S")).toHaveLength(1);
  });

  it("returns the empty-language grammar for an empty list", () => {
    const grammar = languageToGrammar([]);

    expect(grammar.productions).toEqual([]);
    expect(grammar.epsilonProducingNonTerminals ?? []).toEqual([]);
  });

  it("marks the start symbol as ε-producing for the language {ε}", () => {
    const grammar = languageToGrammar([""]);

    expect(grammar.epsilonProducingNonTerminals).toEqual(["S"]);
    expect(grammar.productions).toEqual([]);
  });
});

describe("setBuilderToRightLinearGrammar", () => {
  it("spells out a literal exponent", () => {
    const grammar = setBuilderToRightLinearGrammar(
      setBuilderOf("L = {a^3 | n > 0}"),
    );

    expect(formatGrammar(grammar)).toBe("S -> aA\nA -> aB\nB -> a");
  });

  it("adds a self-loop for a variable exponent", () => {
    const grammar = setBuilderToRightLinearGrammar(
      setBuilderOf("L = {a^n | n > 0}"),
    );

    expect(formatGrammar(grammar)).toContain("S -> a");
  });

  it("skips a factor that contributes no symbol", () => {
    const grammar = setBuilderToRightLinearGrammar(
      setBuilderOf("L = {ε a | n > 0}"),
    );

    expect(formatGrammar(grammar)).toBe("S -> a");
  });

  it("walks a multi-character group symbol by symbol", () => {
    const grammar = setBuilderToRightLinearGrammar(
      setBuilderOf("L = {(ab)^n | n > 0}"),
    );

    expect(grammar.terminals.sort()).toEqual(["a", "b"]);
  });

  it("keeps the accepting node when the last factor loops", () => {
    const grammar = setBuilderToRightLinearGrammar(
      setBuilderOf("L = {b a^n | n > 0}"),
    );

    expect(grammar.epsilonProducingNonTerminals?.length).toBeGreaterThan(0);
  });
});

describe("minimizeRightLinearGrammar", () => {
  it("leaves an already-minimal grammar unchanged", () => {
    const grammar = grammarOf("S -> aS | b");

    expect(formatGrammar(minimizeRightLinearGrammar(grammar))).toBe(
      formatGrammar(grammar),
    );
  });

  it("merges non-terminals that derive the same language", () => {
    // A and B are indistinguishable: both derive exactly {b}.
    const merged = minimizeRightLinearGrammar(
      grammarOf(["S -> aA | bB", "A -> b", "B -> b"].join("\n")),
    );

    expect(merged.nonTerminals.length).toBeLessThan(3);
  });

  it("keeps the start symbol even when it only accepts ε", () => {
    const merged = minimizeRightLinearGrammar(grammarOf("S -> ε"));

    expect(merged.startSymbol).toBe("S");
    expect(merged.epsilonProducingNonTerminals).toContain("S");
  });

  it("stays right-linear after minimising", () => {
    const merged = minimizeRightLinearGrammar(
      grammarOf(["S -> aA | aB", "A -> b", "B -> b"].join("\n")),
    );

    for (const rule of merged.productions) {
      expect(rule.terminal).toHaveLength(1);
    }
  });
});

describe("formatGrammar", () => {
  it("prints the start symbol first", () => {
    const printed = formatGrammar(grammarOf(["A -> aS", "S -> b"].join("\n")));

    expect(printed.split("\n")[0].startsWith("A ->")).toBe(true);
  });

  it("joins alternatives with a bar and appends ε last", () => {
    expect(formatGrammar(grammarOf("S -> aS | b | ε"))).toBe("S -> aS | b | ε");
  });

  it("prints an ε-only non-terminal that has no other alternative", () => {
    expect(formatGrammar(grammarOf(["S -> aA", "A -> ε"].join("\n")))).toBe(
      "S -> aA\nA -> ε",
    );
  });

  it("returns an empty string for a grammar with no productions", () => {
    expect(
      formatGrammar({
        nonTerminals: ["S"],
        terminals: [],
        startSymbol: "S",
        productions: [],
        epsilonProducingNonTerminals: [],
      }),
    ).toBe("");
  });
});
