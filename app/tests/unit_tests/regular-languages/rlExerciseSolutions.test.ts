import { describe, expect, it } from "vitest";
import {
  checkExerciseSolution,
  revealExerciseSolution,
} from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/application/rlExerciseSolutions";
import type { RLExerciseDefinition } from "@/pages/FundamentalsCS/RegularLanguages/exercises/rlExerciseDefinitions";
import { rlExercises } from "@/pages/FundamentalsCS/RegularLanguages/exercises/rlExerciseDefinitions";

const grammarExercise = rlExercises.find(
  (e) => e.mode === "grammarToLanguage",
)!;
const languageExercise = rlExercises.find(
  (e) => e.mode === "languageToGrammar" && e.referenceGrammar,
)!;

/** A minimal exercise so a single field can be varied in isolation. */
function exercise(
  overrides: Partial<RLExerciseDefinition>,
): RLExerciseDefinition {
  return { ...grammarExercise, ...overrides };
}

describe("revealExerciseSolution", () => {
  it("enumerates the language of a grammar exercise", () => {
    const revealed = revealExerciseSolution(grammarExercise);

    expect(revealed).not.toBeNull();
    expect(revealed!.length).toBeGreaterThan(0);
    expect(revealed).not.toContain("undefined");
  });

  it("writes the empty word as ε", () => {
    const revealed = revealExerciseSolution(
      exercise({ seed: { grammarSource: "S -> aS | ε" } }),
    );

    expect(revealed!.split(", ")).toContain("ε");
  });

  it("returns null when the seeded grammar does not parse", () => {
    expect(
      revealExerciseSolution(exercise({ seed: { grammarSource: "?!?" } })),
    ).toBeNull();
  });

  it("returns null when a grammar exercise has no seed at all", () => {
    expect(revealExerciseSolution(exercise({ seed: {} }))).toBeNull();
  });

  it("returns the reference grammar of a language exercise", () => {
    expect(revealExerciseSolution(languageExercise)).toBe(
      languageExercise.referenceGrammar,
    );
  });

  it("returns null for a language exercise without a reference grammar", () => {
    expect(
      revealExerciseSolution(
        exercise({ mode: "languageToGrammar", referenceGrammar: undefined }),
      ),
    ).toBeNull();
  });

  it("returns null for a mode that has no solution to reveal", () => {
    expect(
      revealExerciseSolution(exercise({ mode: "recognizeWord" })),
    ).toBeNull();
  });
});

describe("checkExerciseSolution", () => {
  it("accepts the revealed enumeration of a grammar exercise", () => {
    const revealed = revealExerciseSolution(grammarExercise)!;

    expect(checkExerciseSolution(grammarExercise, revealed)).toMatchObject({
      status: "match",
    });
  });

  it("rejects an empty answer for a grammar exercise", () => {
    expect(checkExerciseSolution(grammarExercise, "")).toMatchObject({
      status: "invalid",
    });
  });

  it("reports words the target language does not contain", () => {
    const result = checkExerciseSolution(grammarExercise, "zzzz");

    expect(result!.status).not.toBe("match");
    expect(result!.wrong).toContain("zzzz");
  });

  it("accepts the reference grammar of a language exercise", () => {
    expect(
      checkExerciseSolution(
        languageExercise,
        languageExercise.referenceGrammar!,
      ),
    ).toMatchObject({ status: "match" });
  });

  it("rejects an unparseable grammar for a language exercise", () => {
    expect(checkExerciseSolution(languageExercise, "?!?")).toMatchObject({
      status: "invalid",
    });
  });

  it("returns null for a mode that cannot be graded", () => {
    expect(
      checkExerciseSolution(exercise({ mode: "recognizeWord" }), "anything"),
    ).toBeNull();
  });
});
