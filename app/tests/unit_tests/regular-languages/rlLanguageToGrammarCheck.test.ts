import { describe, expect, it } from "vitest";
import { checkLanguageToGrammarExercise } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlSolutionChecker";
import { rlExercises } from "@/pages/FundamentalsCS/RegularLanguages/exercises/rlExerciseDefinitions";

// L = 0 1ⁿ 0, n ≥ 1
const SEED = 'L = {"010", "0110", "01110", "011110"}';
const REJECT = ["0", "00", "10", "01", "0100"];

describe("checkLanguageToGrammarExercise", () => {
  it("matches a correct grammar for the target language", () => {
    const grammar = ["START -> 0A", "A -> 1B", "B -> 1B | 0"].join("\n");
    const result = checkLanguageToGrammarExercise(grammar, SEED, REJECT);
    expect(result.status).toBe("match");
  });

  it("flags a grammar that over-generates a forbidden word", () => {
    // A -> 0 lets "00" through, which is a counter-example.
    const grammar = ["START -> 0A", "A -> 1B | 0", "B -> 1B | 0"].join("\n");
    const result = checkLanguageToGrammarExercise(grammar, SEED, REJECT);
    expect(result.status).toBe("mismatch");
    expect(result.wrong).toContain("00");
  });

  it("flags a grammar that does not generate every required word", () => {
    // B -> 0 only (no loop) generates just "010".
    const grammar = ["START -> 0A", "A -> 1B", "B -> 0"].join("\n");
    const result = checkLanguageToGrammarExercise(grammar, SEED, REJECT);
    expect(result.status).toBe("mismatch");
    expect(result.missing).toContain("0110");
  });

  it("rejects an unparseable grammar", () => {
    const result = checkLanguageToGrammarExercise(
      "not a grammar",
      SEED,
      REJECT,
    );
    expect(result.status).toBe("invalid");
    expect(result.reason).toBe("studentParse");
  });

  it("every Language → Grammar reference grammar passes its own check", () => {
    const exercises = rlExercises.filter(
      (e) => e.mode === "languageToGrammar" && e.referenceGrammar,
    );
    expect(exercises.length).toBeGreaterThan(0);
    for (const exercise of exercises) {
      const result = checkLanguageToGrammarExercise(
        exercise.referenceGrammar!,
        exercise.seed.languageSource ?? "",
        exercise.rejectWords ?? [],
      );
      expect(result, `reference grammar for ${exercise.id}`).toMatchObject({
        status: "match",
      });
    }
  });
});
