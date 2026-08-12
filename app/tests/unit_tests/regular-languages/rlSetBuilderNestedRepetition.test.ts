import { describe, expect, it } from "vitest";
import { parseLanguageSpec } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlLanguageSpecParser";
import {
  formatGrammar,
  setBuilderToRightLinearGrammar,
} from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlRegexToGrammar";

/**
 * A variable exponent inside a group used to parse cleanly and then throw out
 * of `setBuilderToRightLinearGrammar` — which runs inside a render `useMemo`,
 * so the whole panel came down. It has to fail as a normal parse issue.
 */
describe("variable exponent inside a group", () => {
  const rejected = [
    "L = {(a^n)b | n > 0}",
    "L = {(ab^n)c | n > 0}",
    "L = {x(a^n) | n >= 1}",
    "L = {(a^n) | n in N}",
  ];

  it.each(rejected)("%s is reported, not thrown", (source) => {
    const parsed = parseLanguageSpec(source);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issue.code).toBe("nestedRepetition");
    expect(parsed.error).toContain("repeats inside a group");
  });

  const accepted: Array<[string, string]> = [
    // The same language written the supported way still works.
    ["L = {a^n b | n > 0}", ["S -> aA", "A -> aA | b"].join("\n")],
    // Literal exponents inside a group stay fine: they spell a fixed word.
    [
      "L = {(a^2 b)^n | n > 0}",
      [
        "S -> aA",
        "A -> aB",
        "B -> bC",
        "C -> aD | ε",
        "D -> aE",
        "E -> bC",
      ].join("\n"),
    ],
    // Plain groups are unaffected.
    [
      "L = {(ab)^n | n >= 1}",
      ["S -> aA", "A -> bB", "B -> aC | ε", "C -> bB"].join("\n"),
    ],
  ];

  it.each(accepted)("%s still builds a grammar", (source, expected) => {
    const parsed = parseLanguageSpec(source);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok || parsed.spec.kind !== "setBuilder") return;
    expect(formatGrammar(setBuilderToRightLinearGrammar(parsed.spec))).toBe(
      expected,
    );
  });
});
