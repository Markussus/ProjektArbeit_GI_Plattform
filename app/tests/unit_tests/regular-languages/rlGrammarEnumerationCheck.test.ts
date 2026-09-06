import { describe, expect, it } from "vitest";
import {
  checkGrammarEnumerationExercise,
  parseEnumerationInput,
} from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlSolutionChecker";

// L = {100, 101, 110, 111}
const FINITE_GRAMMAR = ["START -> 1A", "A -> 0B | 1B", "B -> 0 | 1"].join("\n");

describe("parseEnumerationInput", () => {
  it("splits on commas and newlines and maps ε to the empty word", () => {
    expect(parseEnumerationInput("100, 101\n110")).toEqual([
      "100",
      "101",
      "110",
    ]);
    expect(parseEnumerationInput("ε, 1")).toEqual(["", "1"]);
    expect(parseEnumerationInput("  100 ,, ")).toEqual(["100"]);
  });

  it("reads the word epsilon as the empty word too", () => {
    expect(parseEnumerationInput("epsilon, 1")).toEqual(["", "1"]);
    expect(parseEnumerationInput("ε, epsilon")).toEqual(["", ""]);
  });

  it("takes a word that only contains epsilon literally", () => {
    expect(parseEnumerationInput("epsilonx, 0epsilon")).toEqual([
      "epsilonx",
      "0epsilon",
    ]);
  });
});

describe("checkGrammarEnumerationExercise", () => {
  it("matches when the learner lists exactly the generated words", () => {
    const result = checkGrammarEnumerationExercise(
      "100, 101, 110, 111",
      FINITE_GRAMMAR,
    );
    expect(result.status).toBe("match");
    expect(result.wrong).toEqual([]);
    expect(result.missing).toEqual([]);
  });

  it("reports words the grammar does not generate", () => {
    const result = checkGrammarEnumerationExercise("100, 999", FINITE_GRAMMAR);
    expect(result.status).toBe("mismatch");
    expect(result.wrong).toContain("999");
  });

  it("reports words the learner is still missing", () => {
    const result = checkGrammarEnumerationExercise("100, 101", FINITE_GRAMMAR);
    expect(result.status).toBe("mismatch");
    expect(result.missing.sort()).toEqual(["110", "111"]);
  });

  it("rejects an empty enumeration as invalid", () => {
    const result = checkGrammarEnumerationExercise("", FINITE_GRAMMAR);
    expect(result.status).toBe("invalid");
    expect(result.reason).toBe("studentEmpty");
  });

  it("reports an unparseable given grammar as a reference problem", () => {
    const result = checkGrammarEnumerationExercise("100", "not a grammar @@@");
    expect(result.status).toBe("invalid");
    expect(result.reason).toBe("reference");
  });
});
