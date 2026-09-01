import { describe, expect, it } from "vitest";
import { parseGrammarSource } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faGrammarParsing";

/** The issue code of a failed parse, or "ok" when it succeeded. */
function issueCode(source: string): string {
  const result = parseGrammarSource(source);
  return result.ok ? "ok" : result.issue.code;
}

describe("parseGrammarSource — structured header handling", () => {
  it("accepts productions written inline after the key", () => {
    const result = parseGrammarSource(
      ["type: grammar", "productions: S -> aS | b"].join("\n"),
    );

    expect(result.ok).toBe(true);
    expect(result.ok && result.format).toBe("structured");
    expect(result.ok && result.grammar.startSymbol).toBe("S");
  });

  it("accepts the header after a leading comment and blank line", () => {
    const result = parseGrammarSource(
      ["# a grammar", "", "type: grammar", "productions:", "S -> a"].join("\n"),
    );

    expect(result.ok).toBe(true);
  });

  it("ignores an unknown key and closes the productions block", () => {
    // `S -> b` follows `note:`, so it is no longer inside the block.
    expect(
      issueCode(
        [
          "type: grammar",
          "productions:",
          "S -> aS | b",
          "note: anything",
          "S -> b",
        ].join("\n"),
      ),
    ).toBe("structuredLine");
  });

  it("keeps parsing after an unknown key when a productions key follows", () => {
    const result = parseGrammarSource(
      ["type: grammar", "note: anything", "productions:", "S -> aS | b"].join(
        "\n",
      ),
    );

    expect(result.ok).toBe(true);
  });

  it("rejects a production line before the productions block opens", () => {
    expect(issueCode(["type: grammar", "S -> a"].join("\n"))).toBe(
      "structuredLine",
    );
  });

  it("rejects a type other than 'grammar'", () => {
    expect(
      issueCode(["type: automaton", "productions:", "S -> a"].join("\n")),
    ).toBe("unsupportedType");
  });

  it("accepts the type value in any casing", () => {
    const result = parseGrammarSource(
      ["Type: Grammar", "productions:", "S -> a"].join("\n"),
    );

    expect(result.ok).toBe(true);
  });

  it("closes the productions block again when a second type key appears", () => {
    expect(
      issueCode(
        ["type: grammar", "productions:", "type: grammar", "S -> a"].join("\n"),
      ),
    ).toBe("structuredLine");
  });

  it("reports an empty structured grammar as having no productions", () => {
    expect(issueCode(["type: grammar", "productions:"].join("\n"))).toBe(
      "noProductions",
    );
  });
});

describe("parseGrammarSource — production splitting", () => {
  it("rejects an empty alternative between two bars", () => {
    expect(issueCode("S -> a | | b")).toBe("emptyAlternative");
  });

  it("rejects a trailing bar with nothing after it", () => {
    expect(issueCode("S -> a |")).toBe("emptyAlternative");
  });

  it("takes the first rule's left-hand side as the start symbol", () => {
    const result = parseGrammarSource(["A -> aB", "B -> b"].join("\n"));

    expect(result.ok && result.grammar.startSymbol).toBe("A");
  });

  it("collects a non-terminal that is only ever referenced, never defined last", () => {
    const result = parseGrammarSource(["S -> aA", "A -> ε"].join("\n"));

    expect(result.ok && result.grammar.nonTerminals.sort()).toEqual(["A", "S"]);
    expect(result.ok && result.grammar.epsilonProducingNonTerminals).toEqual([
      "A",
    ]);
  });

  it("ignores comment lines in the simple format", () => {
    const result = parseGrammarSource(
      ["# start here", "S -> aS | b", "# done"].join("\n"),
    );

    expect(result.ok && result.grammar.productions).toHaveLength(2);
  });

  it("rejects 'epsilon' embedded in a longer alternative", () => {
    expect(issueCode("S -> a epsilon")).toBe("epsilonNotAlone");
  });

  it("treats a word merely containing 'epsilon' as an ordinary alternative", () => {
    // No word boundary before "epsilon", so it is not the empty-word keyword.
    expect(issueCode("S -> xepsilonx")).toBe("undefinedNonTerminal");
  });
});
