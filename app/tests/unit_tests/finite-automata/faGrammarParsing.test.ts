import { describe, it, expect } from "vitest";
import {
  detectGrammarFormat,
  parseGrammarSource,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faGrammarParsing";
import {
  grammarToAutomaton,
  validateRegularGrammar,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faGrammarConversion";

const SIMPLE = ["S -> 0S | 1A", "A -> 0A | 1"].join("\n");
const STRUCTURED = [
  "type: grammar",
  "productions:",
  "S -> 0S | 1A",
  "A -> 0A | 1",
].join("\n");

describe("detectGrammarFormat", () => {
  it("recognises a bare production list as simple", () => {
    expect(detectGrammarFormat(SIMPLE)).toBe("simple");
  });

  it("recognises a 'type: grammar' header as structured", () => {
    expect(detectGrammarFormat(STRUCTURED)).toBe("structured");
  });

  it("ignores leading blank lines and comments", () => {
    const src = [
      "",
      "# comment",
      "type: grammar",
      "productions:",
      "S -> a",
    ].join("\n");
    expect(detectGrammarFormat(src)).toBe("structured");
  });

  it("treats an empty input as simple by default", () => {
    expect(detectGrammarFormat("")).toBe("simple");
  });
});

describe("parseGrammarSource — simple format", () => {
  it("parses the default example into the expected grammar", () => {
    const result = parseGrammarSource(SIMPLE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.format).toBe("simple");
    expect(result.grammar.startSymbol).toBe("S");
    expect(result.grammar.nonTerminals.sort()).toEqual(["A", "S"]);
    expect(result.grammar.terminals.sort()).toEqual(["0", "1"]);
    expect(result.grammar.productions).toHaveLength(4);
  });

  it("expands alternatives separated by '|'", () => {
    const result = parseGrammarSource("S -> 0S | 1A | 1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.grammar.productions).toEqual([
      { lhs: "S", terminal: "0", nextNonTerminal: "S" },
      { lhs: "S", terminal: "1", nextNonTerminal: "A" },
      { lhs: "S", terminal: "1", nextNonTerminal: null },
    ]);
  });

  it("accepts the unicode arrow →", () => {
    const result = parseGrammarSource("S → 0S | 1");
    expect(result.ok).toBe(true);
  });

  it("accepts a standalone ε production", () => {
    const result = parseGrammarSource("S -> ε");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.grammar.epsilonProducingNonTerminals).toEqual(["S"]);
    expect(result.grammar.productions).toEqual([]);
  });

  it("accepts ε as one of several alternatives", () => {
    const result = parseGrammarSource("S -> 0S | ε");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.grammar.epsilonProducingNonTerminals).toEqual(["S"]);
    expect(result.grammar.productions).toEqual([
      { lhs: "S", terminal: "0", nextNonTerminal: "S" },
    ]);
  });

  it("accepts the literal word 'epsilon' as an ε production", () => {
    const result = parseGrammarSource("A -> epsilon");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.grammar.epsilonProducingNonTerminals).toEqual(["A"]);
  });

  it("rejects ε mixed with other symbols in the same alternative", () => {
    const result = parseGrammarSource("S -> εS");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/ε must stand alone/i);
  });

  it("returns an error for empty input", () => {
    const result = parseGrammarSource("");
    expect(result.ok).toBe(false);
  });

  it("returns an error for a malformed line", () => {
    const result = parseGrammarSource("just-a-word-no-arrow");
    expect(result.ok).toBe(false);
  });
});

describe("parseGrammarSource — structured format", () => {
  it("parses the structured equivalent of the simple example", () => {
    const result = parseGrammarSource(STRUCTURED);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.format).toBe("structured");
    expect(result.grammar.startSymbol).toBe("S");
    expect(result.grammar.productions).toHaveLength(4);
  });

  it("rejects an unknown 'type:' value", () => {
    const result = parseGrammarSource("type: regex\nproductions:\nS -> 0");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/grammar/i);
  });

  it("requires a 'type: grammar' header to be considered structured", () => {
    const result = parseGrammarSource("productions:\nS -> 0");
    // No leading 'type:' so it's parsed as simple → 'productions:' is malformed.
    expect(result.format).toBe("simple");
    expect(result.ok).toBe(false);
  });

  it("ignores comment lines inside the productions block", () => {
    const result = parseGrammarSource(
      ["type: grammar", "productions:", "# comment", "S -> 0S | 1"].join("\n"),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.grammar.productions).toHaveLength(2);
  });
});

describe("parseGrammarSource — round-trip via converter", () => {
  it("produces a valid right-linear grammar that the converter accepts", () => {
    const result = parseGrammarSource(SIMPLE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(validateRegularGrammar(result.grammar)).toEqual([]);
    const automaton = grammarToAutomaton(result.grammar);
    expect(automaton.startState).toBe("S");
    expect(automaton.acceptStates).toContain("sF");
  });

  it("simple and structured forms yield equivalent automata", () => {
    const simple = parseGrammarSource(SIMPLE);
    const structured = parseGrammarSource(STRUCTURED);
    expect(simple.ok && structured.ok).toBe(true);
    if (!simple.ok || !structured.ok) return;

    const a = grammarToAutomaton(simple.grammar);
    const b = grammarToAutomaton(structured.grammar);
    expect(a.startState).toBe(b.startState);
    expect(a.acceptStates).toEqual(b.acceptStates);
    expect(new Set(a.alphabet)).toEqual(new Set(b.alphabet));
    expect(new Set(a.states)).toEqual(new Set(b.states));
  });
});

describe("grammarToAutomaton — ε productions", () => {
  it("marks the LHS of an ε production as accepting (no ε-transitions)", () => {
    const result = parseGrammarSource("S -> 0S | ε");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const automaton = grammarToAutomaton(result.grammar);

    expect(automaton.acceptStates).toContain("S");
    // The empty word is accepted because the start state itself is accepting.
    expect(automaton.acceptStates).toContain(automaton.startState);

    // No ε-transition was produced in any state.
    for (const from of Object.keys(automaton.transitions)) {
      expect(automaton.transitions[from]).not.toHaveProperty("ε");
    }
  });

  it("does not introduce the sF accept state when no rule needs it", () => {
    const result = parseGrammarSource("S -> ε");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const automaton = grammarToAutomaton(result.grammar);

    expect(automaton.states).not.toContain("sF");
    expect(automaton.acceptStates).toEqual(["S"]);
  });

  it("keeps both the LHS and sF as accept states when both kinds exist", () => {
    const result = parseGrammarSource("S -> 0S | 1 | ε");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const automaton = grammarToAutomaton(result.grammar);

    expect(automaton.acceptStates).toContain("sF");
    expect(automaton.acceptStates).toContain("S");
  });
});
