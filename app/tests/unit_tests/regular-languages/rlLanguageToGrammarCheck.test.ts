import { describe, expect, it } from "vitest";
import { checkLanguageToGrammarExercise } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlSolutionChecker";
import { rlExercises } from "@/pages/FundamentalsCS/RegularLanguages/exercises/rlExerciseDefinitions";

// L = 0 1ⁿ 0, n ≥ 1
const SEED = 'L = {"010", "0110", "01110", "011110"}';
const REJECT = ["0", "00", "10", "01", "0100"];
const REFERENCE = ["START -> 0A", "A -> 1B", "B -> 1B | 0"].join("\n");

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
        exercise.referenceGrammar,
      );
      expect(result, `reference grammar for ${exercise.id}`).toMatchObject({
        status: "match",
      });
    }
  });

  it("accepts an equivalent grammar that only renames its non-terminals", () => {
    const grammar = ["S -> 0X", "X -> 1Y", "Y -> 1Y | 0"].join("\n");
    const result = checkLanguageToGrammarExercise(
      grammar,
      SEED,
      REJECT,
      REFERENCE,
    );
    expect(result.status).toBe("match");
  });

  /**
   * The regression this reference-grammar layer exists for. `S -> 0A | 1A`
   * also generates 1 1ⁿ 0, but it satisfies every curated word of the
   * exercise, so the word lists on their own call it correct.
   */
  it("flags an over-general grammar the curated words cannot catch", () => {
    const grammar = ["S -> 0A | 1A", "A -> 1B", "B -> 1B | 0"].join("\n");

    const withoutReference = checkLanguageToGrammarExercise(
      grammar,
      SEED,
      REJECT,
    );
    expect(withoutReference.status).toBe("match");

    const withReference = checkLanguageToGrammarExercise(
      grammar,
      SEED,
      REJECT,
      REFERENCE,
    );
    expect(withReference.status).toBe("mismatch");
    expect(withReference.wrong).toContain("110");
  });

  it("ignores a reference grammar that does not parse", () => {
    const result = checkLanguageToGrammarExercise(
      REFERENCE,
      SEED,
      REJECT,
      "not a grammar",
    );
    expect(result.status).toBe("match");
  });

  it("keeps reporting curated words alongside a derived counter-example", () => {
    // Generates "00" (a curated counter-example) and misses "0110".
    const grammar = ["START -> 0A", "A -> 1B | 0", "B -> 0"].join("\n");
    const result = checkLanguageToGrammarExercise(
      grammar,
      SEED,
      REJECT,
      REFERENCE,
    );
    expect(result.status).toBe("mismatch");
    expect(result.wrong).toContain("00");
    expect(result.missing).toContain("0110");
  });
});
