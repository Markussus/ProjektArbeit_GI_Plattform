import { describe, expect, it } from "vitest";
import {
  parseLanguageSpec,
  type LanguageSpec,
  type SetBuilderLang,
} from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlLanguageSpecParser";

function parse(source: string): LanguageSpec {
  const result = parseLanguageSpec(source);
  if (!result.ok) {
    throw new Error(`expected a parse, got issue ${result.issue.code}`);
  }
  return result.spec;
}

function setBuilder(source: string): SetBuilderLang {
  const spec = parse(source);
  if (spec.kind !== "setBuilder") {
    throw new Error(`expected a set-builder spec, got ${spec.kind}`);
  }
  return spec;
}

function issueCode(source: string): string {
  const result = parseLanguageSpec(source);
  if (result.ok) throw new Error("expected the parse to fail");
  return result.issue.code;
}

describe("parseLanguageSpec — enumeration form", () => {
  it("reads an empty body as the empty language", () => {
    expect(parse("L = {}")).toEqual({ kind: "enumeration", words: [] });
  });

  it("strips double and single quotes around words", () => {
    expect(parse(`L = {"ab", 'cd'}`)).toEqual({
      kind: "enumeration",
      words: ["ab", "cd"],
    });
  });

  it("accepts bare words without quotes", () => {
    expect(parse("L = {ab, cd}")).toEqual({
      kind: "enumeration",
      words: ["ab", "cd"],
    });
  });

  it("reads ε and the word 'epsilon' as the empty word", () => {
    expect(parse("L = {ε, epsilon, a}")).toEqual({
      kind: "enumeration",
      words: ["", "", "a"],
    });
  });

  it("ignores empty items left by a trailing comma", () => {
    expect(parse("L = {a, , b,}")).toEqual({
      kind: "enumeration",
      words: ["a", "b"],
    });
  });

  it("keeps commas that sit inside quotes", () => {
    expect(parse(`L = {"a,b"}`)).toEqual({
      kind: "enumeration",
      words: ["a,b"],
    });
  });

  it("keeps commas nested inside brackets", () => {
    expect(parse("L = {(a,b)}")).toEqual({
      kind: "enumeration",
      words: ["(a,b)"],
    });
  });

  it("promotes a continuation marker to a set-builder when it can", () => {
    const spec = parse('L = {"ab", "aab", "aaab", ..}');

    expect(spec.kind).toBe("setBuilder");
  });

  it("falls back to a plain enumeration when nothing can be inferred", () => {
    const spec = parse('L = {"ab", "xy", "qqq", ...}');

    expect(spec.kind).toBe("enumeration");
  });
});

describe("parseLanguageSpec — set-builder pattern", () => {
  it("reads a literal exponent", () => {
    const spec = setBuilder("L = {a^2 b | n > 0}");

    expect(spec.pattern[0].exponent).toEqual({ kind: "literal", count: 2 });
    expect(spec.pattern[1].exponent).toEqual({ kind: "none" });
  });

  it("reads a multi-digit literal exponent", () => {
    const spec = setBuilder("L = {a^12 | n > 0}");

    expect(spec.pattern[0].exponent).toEqual({ kind: "literal", count: 12 });
  });

  it("reads a variable exponent and its default bound", () => {
    const spec = setBuilder("L = {a^n | }");

    expect(spec.pattern[0].exponent).toMatchObject({
      kind: "variable",
      name: "n",
      lowerBound: 0,
    });
    expect(spec.variableBounds).toEqual([{ name: "n", lowerBound: 0 }]);
  });

  it("treats ε and λ as the empty atom", () => {
    const spec = setBuilder("L = {ε a | n > 0}");

    expect(spec.pattern[0].atomText).toBe("ε");
    expect(setBuilder("L = {λ a | n > 0}").pattern[0].atomText).toBe("ε");
  });

  it("ignores spaces and explicit concatenation dots", () => {
    const spec = setBuilder("L = {a · b ⋅ c | n > 0}");

    expect(spec.pattern.map((f) => f.atomText)).toEqual(["a", "b", "c"]);
  });

  it("reads a parenthesised group as one atom", () => {
    const spec = setBuilder("L = {(ab)^n | n > 0}");

    expect(spec.pattern[0].atomText).toBe("(ab)");
    expect(spec.pattern[0].rawText).toBe("(ab)^n");
  });

  it("rejects a caret with nothing after it", () => {
    expect(issueCode("L = {a^ | n > 0}")).toBe("trailingCaret");
  });

  it("rejects a caret followed by neither a digit nor a letter", () => {
    expect(issueCode("L = {a^# | n > 0}")).toBe("badExponent");
  });

  it("rejects a comma inside a set-builder pattern", () => {
    expect(issueCode("L = {a, b | n > 0}")).toBe("patternUnexpectedChar");
  });

  it("rejects a pattern it cannot consume to the end", () => {
    // The parens balance out, so the bar still counts as top level, but the
    // pattern parser stops dead at the closing one.
    expect(issueCode("L = {ab) ( | n > 0}")).toBe("patternUnexpectedChar");
  });

  it("accepts punctuation that is not a pattern operator as a symbol", () => {
    expect(setBuilder("L = {? b | n > 0}").pattern[0].atomText).toBe("?");
  });

  it("rejects a repetition nested inside a group", () => {
    expect(issueCode("L = {(a^n)b | n > 0}")).toBe("nestedRepetition");
  });

  it("rejects the same variable used in two factors", () => {
    expect(issueCode("L = {a^n b^n | n > 0}")).toBe("variableReused");
  });
});

describe("parseLanguageSpec — set-builder constraints", () => {
  it("reads a strict lower bound as one more than the number", () => {
    expect(setBuilder("L = {a^n | n > 2}").variableBounds).toEqual([
      { name: "n", lowerBound: 3 },
    ]);
  });

  it("reads a non-strict lower bound as the number itself", () => {
    expect(setBuilder("L = {a^n | n >= 2}").variableBounds).toEqual([
      { name: "n", lowerBound: 2 },
    ]);
    expect(setBuilder("L = {a^n | n ≥ 4}").variableBounds).toEqual([
      { name: "n", lowerBound: 4 },
    ]);
  });

  it("keeps the strongest bound when a variable is constrained twice", () => {
    expect(setBuilder("L = {a^n | n > 0, n >= 5}").variableBounds).toEqual([
      { name: "n", lowerBound: 5 },
    ]);
  });

  it("pins an exponent that is constrained with '='", () => {
    const spec = setBuilder("L = {a^n | n = 3}");

    expect(spec.pattern[0].exponent).toEqual({ kind: "literal", count: 3 });
    expect(spec.variableBounds).toEqual([]);
  });

  it("accepts membership in the naturals as the default bound", () => {
    for (const naturals of ["N", "ℕ", "N0", "ℕ0"]) {
      expect(setBuilder(`L = {a^n | n in ${naturals}}`).variableBounds).toEqual(
        [{ name: "n", lowerBound: 0 }],
      );
    }
    expect(setBuilder("L = {a^n | n ∈ ℕ}").variableBounds).toEqual([
      { name: "n", lowerBound: 0 },
    ]);
  });

  it("constrains several variables at once", () => {
    expect(setBuilder("L = {a^n c b^m | n, m > 0}").variableBounds).toEqual([
      { name: "n", lowerBound: 1 },
      { name: "m", lowerBound: 1 },
    ]);
  });

  it("lists the bounds in the order the pattern introduces them", () => {
    expect(setBuilder("L = {b^m a^n | n > 1, m > 2}").variableBounds).toEqual([
      { name: "m", lowerBound: 3 },
      { name: "n", lowerBound: 2 },
    ]);
  });

  it("rejects a set other than the naturals", () => {
    expect(issueCode("L = {a^n | n ∈ Z}")).toBe("expectedNaturals");
  });

  it("rejects a comparison with no integer after it", () => {
    expect(issueCode("L = {a^n | n > }")).toBe("expectedInteger");
    expect(issueCode("L = {a^n | n > x}")).toBe("expectedInteger");
  });

  it("rejects an upper bound", () => {
    expect(issueCode("L = {a^n | n < 5}")).toBe("upperBound");
    expect(issueCode("L = {a^n | n <= 5}")).toBe("upperBound");
    expect(issueCode("L = {a^n | n ≤ 5}")).toBe("upperBound");
  });

  it("rejects a token that is not part of a constraint", () => {
    expect(issueCode("L = {a^n | n 5}")).toBe("unexpectedToken");
  });
});

describe("parseLanguageSpec — locating the constraint bar", () => {
  it("splits on the top-level bar", () => {
    expect(setBuilder("L = {a^n | n > 0}").pattern).toHaveLength(1);
  });

  it("ignores a bar nested inside parentheses", () => {
    // No top-level bar, so the body reads as an enumeration.
    expect(parse("L = {(a|b)}")).toEqual({
      kind: "enumeration",
      words: ["(a|b)"],
    });
  });

  it("ignores a bar inside quotes", () => {
    expect(parse(`L = {"a|b"}`)).toEqual({
      kind: "enumeration",
      words: ["a|b"],
    });
  });
});
