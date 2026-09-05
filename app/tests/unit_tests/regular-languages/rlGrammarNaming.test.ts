import { describe, expect, it } from "vitest";
import {
  NON_TERMINAL_NAMES,
  emitRightLinearGrammar,
  nonTerminalName,
} from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlGrammarNaming";
import {
  formatGrammar,
  minimizeRightLinearGrammar,
  setBuilderToRightLinearGrammar,
} from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlRegexToGrammar";
import { languageToGrammarMinimal } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlLanguageOps";
import { parseLanguageSpec } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlLanguageSpecParser";
import { parseGrammar } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlGrammarValidation";

function setBuilderGrammar(source: string) {
  const parsed = parseLanguageSpec(source);
  if (!parsed.ok || parsed.spec.kind !== "setBuilder") {
    throw new Error(`not a set-builder spec: ${source}`);
  }
  return setBuilderToRightLinearGrammar(parsed.spec);
}

describe("nonTerminalName", () => {
  it("never hands out the start symbol", () => {
    expect(NON_TERMINAL_NAMES.sequence).not.toContain(NON_TERMINAL_NAMES.start);
    const names = Array.from({ length: 25 }, (_, i) => nonTerminalName(i));
    expect(names).not.toContain("S");
    expect(names[0]).toBe("A");
    expect(names[24]).toBe("Z");
  });

  it("falls back to numbered names past the alphabet", () => {
    expect(nonTerminalName(25)).toBe("N26");
    expect(nonTerminalName(26)).toBe("N27");
  });
});

describe("emitRightLinearGrammar", () => {
  it("drops nodes unreachable from the start symbol", () => {
    const edges: Record<string, Array<{ terminal: string; to: string }>> = {
      start: [{ terminal: "a", to: "reachable" }],
      reachable: [],
      orphan: [{ terminal: "b", to: "start" }],
    };
    const grammar = emitRightLinearGrammar<string>({
      start: "start",
      edgesOf: (node) => edges[node],
      isAccepting: (node) => node === "reachable",
    });
    expect(grammar.nonTerminals).toEqual(["S", "A"]);
    expect(formatGrammar(grammar)).toBe(["S -> aA", "A -> ε"].join("\n"));
  });

  it("turns an edge into the folded node into a terminal-only rule", () => {
    const edges: Record<string, Array<{ terminal: string; to: string }>> = {
      start: [{ terminal: "a", to: "end" }],
      end: [],
    };
    const grammar = emitRightLinearGrammar<string>({
      start: "start",
      edgesOf: (node) => edges[node],
      isAccepting: (node) => node === "end",
      foldedNode: "end",
    });
    expect(grammar.nonTerminals).toEqual(["S"]);
    expect(formatGrammar(grammar)).toBe("S -> a");
  });
});

describe("non-terminal names have no gaps", () => {
  // A folded accept state used to consume a letter before being dropped, so
  // the printed grammar skipped one: "… D -> bF, F -> cC" with no E anywhere.
  const cases: Array<[string, () => { nonTerminals: string[] }]> = [
    [
      "set-builder with a group loop",
      () => setBuilderGrammar("L = {(abc)^n d | n > 0}"),
    ],
    [
      "set-builder with two variables",
      () => setBuilderGrammar("L = {a^n c b^m | n, m > 0}"),
    ],
    [
      "minimal prefix-tree grammar",
      () => languageToGrammarMinimal(["ab", "cb", "abc"]),
    ],
    [
      "minimised grammar",
      () => {
        const parsed = parseGrammar("S -> aA\nA -> aA | bB\nB -> bB | c");
        if (!parsed.grammar) throw new Error("unparseable");
        return minimizeRightLinearGrammar(parsed.grammar);
      },
    ],
  ];

  it.each(cases)("%s", (_name, build) => {
    const { nonTerminals } = build();
    const expected = [
      NON_TERMINAL_NAMES.start,
      ...Array.from({ length: nonTerminals.length - 1 }, (_, i) =>
        nonTerminalName(i),
      ),
    ];
    expect(nonTerminals).toEqual(expected);
  });

  it("keeps the group-loop grammar gapless end to end", () => {
    expect(formatGrammar(setBuilderGrammar("L = {(abc)^n d | n > 0}"))).toBe(
      [
        "S -> aA",
        "A -> bB",
        "B -> cC",
        "C -> aD | d",
        "D -> bE",
        "E -> cC",
      ].join("\n"),
    );
  });
});
