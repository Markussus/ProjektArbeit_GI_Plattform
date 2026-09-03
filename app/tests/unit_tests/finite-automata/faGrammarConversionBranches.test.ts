import { describe, expect, it } from "vitest";
import {
  grammarToAutomaton,
  validateRegularGrammar,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faGrammarConversion";
import type { RegularGrammar } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";

/** `S -> aS | b` — one recursive rule plus one terminal-only rule. */
function grammar(overrides: Partial<RegularGrammar> = {}): RegularGrammar {
  return {
    nonTerminals: ["S"],
    terminals: ["a", "b"],
    startSymbol: "S",
    productions: [
      { lhs: "S", terminal: "a", nextNonTerminal: "S" },
      { lhs: "S", terminal: "b", nextNonTerminal: null },
    ],
    epsilonProducingNonTerminals: [],
    ...overrides,
  };
}

describe("grammarToAutomaton — the synthetic accept state", () => {
  it("names it sF when the grammar leaves that name free", () => {
    const fa = grammarToAutomaton(grammar());

    expect(fa.states).toEqual(["S", "sF"]);
    expect(fa.acceptStates).toEqual(["sF"]);
  });

  it("steps aside to sF2 when the grammar already uses sF", () => {
    const fa = grammarToAutomaton(
      grammar({
        nonTerminals: ["S", "sF"],
        productions: [
          { lhs: "S", terminal: "a", nextNonTerminal: "sF" },
          { lhs: "sF", terminal: "b", nextNonTerminal: null },
        ],
      }),
    );

    expect(fa.states).toEqual(["S", "sF", "sF2"]);
    expect(fa.acceptStates).toEqual(["sF2"]);
    // The grammar's own sF must not become accepting.
    expect(fa.transitions.S.a).toEqual(["sF"]);
  });

  it("keeps counting past sF2 when those names are taken too", () => {
    const fa = grammarToAutomaton(
      grammar({
        nonTerminals: ["S", "sF", "sF2", "sF3"],
        productions: [{ lhs: "S", terminal: "a", nextNonTerminal: null }],
        terminals: ["a"],
      }),
    );

    expect(fa.states).toContain("sF4");
  });

  it("omits the accept state when no rule ends in a bare terminal", () => {
    const fa = grammarToAutomaton(
      grammar({
        productions: [{ lhs: "S", terminal: "a", nextNonTerminal: "S" }],
        epsilonProducingNonTerminals: ["S"],
        terminals: ["a"],
      }),
    );

    expect(fa.states).toEqual(["S"]);
    expect(fa.acceptStates).toEqual(["S"]);
  });
});

describe("grammarToAutomaton — determinism", () => {
  it("labels a single-target table as a DFA", () => {
    expect(grammarToAutomaton(grammar()).type).toBe("DFA");
  });

  it("labels a table with a two-target cell as an NFA", () => {
    const fa = grammarToAutomaton(
      grammar({
        nonTerminals: ["S", "A"],
        productions: [
          { lhs: "S", terminal: "a", nextNonTerminal: "S" },
          { lhs: "S", terminal: "a", nextNonTerminal: "A" },
          { lhs: "A", terminal: "b", nextNonTerminal: null },
        ],
      }),
    );

    expect(fa.type).toBe("NFA");
    expect(fa.transitions.S.a).toEqual(["S", "A"]);
  });

  it("collapses a production that is written twice", () => {
    const fa = grammarToAutomaton(
      grammar({
        productions: [
          { lhs: "S", terminal: "a", nextNonTerminal: "S" },
          { lhs: "S", terminal: "a", nextNonTerminal: "S" },
          { lhs: "S", terminal: "b", nextNonTerminal: null },
        ],
      }),
    );

    expect(fa.transitions.S.a).toEqual(["S"]);
    expect(fa.type).toBe("DFA");
  });
});

describe("validateRegularGrammar", () => {
  it("accepts a well-formed right-linear grammar", () => {
    expect(validateRegularGrammar(grammar())).toEqual([]);
  });

  it("rejects a grammar with no non-terminals", () => {
    expect(
      validateRegularGrammar(
        grammar({ nonTerminals: [], productions: [], startSymbol: "S" }),
      ),
    ).toContain("grammar_no_nonterminals");
  });

  it("rejects a grammar with neither terminals nor ε productions", () => {
    expect(
      validateRegularGrammar(grammar({ terminals: [], productions: [] })),
    ).toContain("grammar_no_terminals");
  });

  it("accepts an ε-only grammar despite having no terminals", () => {
    expect(
      validateRegularGrammar(
        grammar({
          terminals: [],
          productions: [],
          epsilonProducingNonTerminals: ["S"],
        }),
      ),
    ).toEqual([]);
  });

  it("rejects a start symbol that is not a declared non-terminal", () => {
    expect(validateRegularGrammar(grammar({ startSymbol: "X" }))).toContain(
      "grammar_start_invalid",
    );
  });

  it("rejects a production whose left-hand side is undeclared", () => {
    expect(
      validateRegularGrammar(
        grammar({
          productions: [{ lhs: "X", terminal: "a", nextNonTerminal: null }],
        }),
      ),
    ).toContain("grammar_lhs_invalid");
  });

  it("rejects a production using an undeclared terminal", () => {
    expect(
      validateRegularGrammar(
        grammar({
          productions: [{ lhs: "S", terminal: "z", nextNonTerminal: null }],
        }),
      ),
    ).toContain("grammar_terminal_invalid");
  });

  it("rejects a production pointing at an undeclared non-terminal", () => {
    expect(
      validateRegularGrammar(
        grammar({
          productions: [{ lhs: "S", terminal: "a", nextNonTerminal: "X" }],
        }),
      ),
    ).toContain("grammar_rhs_nonterminal_invalid");
  });

  it("rejects an ε producer that is not a declared non-terminal", () => {
    expect(
      validateRegularGrammar(grammar({ epsilonProducingNonTerminals: ["X"] })),
    ).toContain("grammar_epsilon_lhs_invalid");
  });

  it("treats a missing epsilon list as empty", () => {
    const withoutList: RegularGrammar = grammar();
    delete withoutList.epsilonProducingNonTerminals;

    expect(validateRegularGrammar(withoutList)).toEqual([]);
  });

  it("reports every problem it finds, not just the first", () => {
    const errors = validateRegularGrammar(
      grammar({
        startSymbol: "X",
        productions: [{ lhs: "Y", terminal: "z", nextNonTerminal: "W" }],
      }),
    );

    expect(errors).toEqual([
      "grammar_start_invalid",
      "grammar_lhs_invalid",
      "grammar_terminal_invalid",
      "grammar_rhs_nonterminal_invalid",
    ]);
  });
});
