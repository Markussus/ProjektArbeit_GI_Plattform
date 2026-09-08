import { describe, expect, it } from "vitest";
import {
  checkExerciseSolution,
  revealExerciseSolution,
} from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/application/rlExerciseSolutions";
import {
  findRLExercise,
  rlExercises,
} from "@/pages/FundamentalsCS/RegularLanguages/exercises/rlExerciseDefinitions";

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz".split("");
const LETTERS = [...LOWERCASE, ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];
const DIGITS = "0123456789".split("");
const NONZERO_DIGITS = "123456789".split("");

/**
 * Grammars that generate the whole target language *and more*. Each satisfies
 * every curated accept and reject word of its exercise, so the word lists on
 * their own grade all five as correct — the reference-grammar comparison is
 * what catches them. `counterExample` is the shortest word the grammar
 * generates that the language does not, so it also pins down that the check
 * reports the *shortest* witness rather than an arbitrary one.
 */
const OVER_GENERAL: Array<{
  id: string;
  what: string;
  grammar: string;
  counterExample: string;
}> = [
  {
    id: "l2g-zero-ones-zero",
    what: "lets the word start with 1 as well as 0",
    grammar: ["S -> 0A | 1A", "A -> 1B", "B -> 1B | 0"].join("\n"),
    counterExample: "110",
  },
  {
    id: "l2g-four-words",
    what: "adds a 0-loop, so words grow past length four",
    grammar: [
      "START -> 0A | 1A",
      "A -> 0A | 0B | 1B",
      "B -> 1C",
      "C -> 1",
    ].join("\n"),
    counterExample: "00011",
  },
  {
    id: "l2g-nested-zeros",
    what: "allows a third 0-block",
    grammar: [
      "START -> 1A",
      "A -> 0B",
      "B -> 0B | 1C",
      "C -> 0D",
      "D -> 0D | 1 | 1A",
    ].join("\n"),
    counterExample: "101010101",
  },
  {
    id: "applied-integers",
    what: "accepts a leading + as well as a leading -",
    grammar: [
      `START -> -A | +A | 0 | ${NONZERO_DIGITS.map((d) => `${d}B`).join(" | ")}`,
      `A -> ${NONZERO_DIGITS.map((d) => `${d}B`).join(" | ")}`,
      `B -> ${DIGITS.map((d) => `${d}B`).join(" | ")} | ε`,
    ].join("\n"),
    counterExample: "+1",
  },
  {
    id: "applied-identifiers",
    what: "allows an underscore after the first letter",
    grammar: [
      `START -> ${LOWERCASE.map((c) => `${c}A`).join(" | ")}`,
      `A -> ${[...LETTERS, "_"].map((c) => `${c}A`).join(" | ")} | ε`,
    ].join("\n"),
    counterExample: "a_",
  },
];

describe("Language → Grammar exercises reject over-general grammars", () => {
  it.each(OVER_GENERAL)("$id $what", ({ id, grammar, counterExample }) => {
    const exercise = findRLExercise(id);
    expect(exercise, `exercise ${id} still exists`).toBeDefined();

    const result = checkExerciseSolution(exercise!, grammar);
    expect(result?.status).toBe("mismatch");
    expect(result?.wrong).toContain(counterExample);
  });
});

describe("shipped RL exercises grade their own revealed solution", () => {
  it.each(rlExercises.map((e) => [e.id, e] as const))(
    "%s accepts what Load solution reveals",
    (_id, exercise) => {
      const revealed = revealExerciseSolution(exercise);
      expect(revealed).not.toBeNull();
      expect(checkExerciseSolution(exercise, revealed!)).toMatchObject({
        status: "match",
      });
    },
  );
});
