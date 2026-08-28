import { describe, expect, it } from "vitest";
import {
  languageToGrammar,
  languageToGrammarMinimal,
} from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlLanguageOps";
import { formatGrammar } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlRegexToGrammar";

describe("languageToGrammarMinimal", () => {
  it("merges a shared suffix into one non-terminal", () => {
    // {ab, cb} share the suffix "b", so both 'a' and 'c' should lead to the
    // same state, and the accepting end is folded into terminal-only rules.
    const grammar = languageToGrammarMinimal(["ab", "cb"]);
    expect(grammar.startSymbol).toBe("S");
    expect(grammar.terminals.sort()).toEqual(["a", "b", "c"]);
    // S, plus one shared mid-state — the accepting leaf is folded away.
    expect(grammar.nonTerminals).toEqual(["S", "A"]);
    expect(formatGrammar(grammar)).toBe(["S -> aA | cA", "A -> b"].join("\n"));
  });

  it("is at least as compact as the detailed prefix-tree grammar", () => {
    const words = ["ab", "abb", "abbb"];
    const minimal = languageToGrammarMinimal(words);
    const detailed = languageToGrammar(words);
    expect(minimal.nonTerminals.length).toBeLessThan(
      detailed.nonTerminals.length,
    );
    // Folding the accepting leaf yields terminal-only productions (A -> b).
    expect(
      minimal.productions.some((rule) => rule.nextNonTerminal === null),
    ).toBe(true);
  });

  it("keeps a prefix that is also a full word as an ε-producing state", () => {
    // {0, 01}: after reading "0" the word may end (ε) or continue with "1".
    const grammar = languageToGrammarMinimal(["0", "01"]);
    const text = formatGrammar(grammar);
    expect(text).toContain("ε");
    expect(text.startsWith("S -> 0")).toBe(true);
  });

  it("represents the empty language with no productions", () => {
    const grammar = languageToGrammarMinimal([]);
    expect(grammar.productions).toEqual([]);
    expect(grammar.nonTerminals).toEqual(["S"]);
  });
});
