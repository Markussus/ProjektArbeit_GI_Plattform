import {
  enumerateLanguage,
  recognizeWords,
  resolveEmptyWord,
} from "./rlLanguageOps";
import { parseGrammar } from "./rlGrammarValidation";
import type { RegularGrammar } from "./rlTypes";
import { parseLanguageSpec } from "./rlLanguageSpecParser";
import { compareGrammarLanguages } from "./rlLanguageEquivalence";

/**
 * Enumeration bounds for Grammar → Language exercises. "Load solution" reveals
 * exactly this set, so a coverage check against it always matches afterwards.
 */
export const G2L_EXERCISE_ENUMERATION = { maxLen: 6, maxWords: 12 } as const;

/**
 * Parse a learner's enumeration input: words separated by commas or newlines.
 * "ε" and "epsilon" denote the empty word; surrounding whitespace and empty
 * pieces (e.g. a trailing comma) are ignored.
 */
export function parseEnumerationInput(source: string): string[] {
  return source
    .split(/[\n,]/)
    .map((piece) => piece.trim())
    .filter((piece) => piece.length > 0)
    .map(resolveEmptyWord);
}

/** `invalid` means the input could not be judged; `reason` says why. */
export type RLCheckStatus = "match" | "mismatch" | "invalid";

export interface RLCheckResult {
  status: RLCheckStatus;
  reason?: "studentParse" | "studentEmpty" | "reference";
  wrong: string[];
  missing: string[];
}

/** Trim, drop duplicates, and keep the order the words came in. */
function uniqueTrimmed(words: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of words) {
    const word = raw.trim();
    if (!seen.has(word)) {
      seen.add(word);
      result.push(word);
    }
  }
  return result;
}

/**
 * The example words of a fixed exercise language. Exercise seeds are authored
 * as explicit word lists, so anything else yields no words to check against.
 */
function enumerationWords(source: string): string[] {
  const parsed = parseLanguageSpec(source);
  if (!parsed.ok || parsed.spec.kind !== "enumeration") {
    return [];
  }
  return uniqueTrimmed(parsed.spec.words);
}

/** Append `word` unless it is already listed. */
function withWord(words: string[], word: string | null): string[] {
  if (word === null || words.includes(word)) return words;
  return [...words, word];
}

/**
 * Compare the learner's grammar against the exercise's reference grammar by
 * language, and fold the shortest counter-example of each direction into the
 * word lists the summary already renders.
 */
function withEquivalenceFindings(
  grammar: RegularGrammar,
  referenceGrammarSource: string,
  found: { wrong: string[]; missing: string[] },
): { wrong: string[]; missing: string[] } {
  const reference = parseGrammar(referenceGrammarSource);
  if (!reference.ok || !reference.grammar) return found;

  const difference = compareGrammarLanguages(grammar, reference.grammar);
  return {
    wrong: withWord(found.wrong, difference.extra),
    missing: withWord(found.missing, difference.missing),
  };
}

/**
 * Check for the Language → Grammar exercises
 */
export function checkLanguageToGrammarExercise(
  studentGrammarSource: string,
  seedLanguageSource: string,
  rejectWords: string[],
  referenceGrammarSource?: string,
): RLCheckResult {
  const parsed = parseGrammar(studentGrammarSource);
  if (!parsed.ok || !parsed.grammar) {
    return {
      status: "invalid",
      reason: "studentParse",
      wrong: [],
      missing: [],
    };
  }
  const grammar = parsed.grammar;

  const acceptWords = enumerationWords(seedLanguageSource);
  const forbiddenWords = uniqueTrimmed(rejectWords);

  // One pass over both lists, so the grammar is compiled once rather than
  // once per word.
  const verdicts = recognizeWords(grammar, [...acceptWords, ...forbiddenWords]);
  let found = {
    missing: acceptWords.filter((_, i) => !verdicts[i].accepted),
    wrong: forbiddenWords.filter(
      (_, i) => verdicts[acceptWords.length + i].accepted,
    ),
  };

  if (referenceGrammarSource) {
    found = withEquivalenceFindings(grammar, referenceGrammarSource, found);
  }

  return {
    status:
      found.wrong.length === 0 && found.missing.length === 0
        ? "match"
        : "mismatch",
    wrong: found.wrong,
    missing: found.missing,
  };
}

/**
 * Check for the Grammar → Language exercises
 */
export function checkGrammarEnumerationExercise(
  studentSource: string,
  givenGrammarSource: string,
): RLCheckResult {
  const parsed = parseGrammar(givenGrammarSource);
  if (!parsed.ok || !parsed.grammar) {
    return { status: "invalid", reason: "reference", wrong: [], missing: [] };
  }
  const grammar = parsed.grammar;

  const studentWords = uniqueTrimmed(parseEnumerationInput(studentSource));
  if (studentWords.length === 0) {
    return {
      status: "invalid",
      reason: "studentEmpty",
      wrong: [],
      missing: [],
    };
  }

  const verdicts = recognizeWords(grammar, studentWords);
  const wrong = studentWords.filter((_, i) => !verdicts[i].accepted);

  const { words: expected } = enumerateLanguage(grammar, {
    maxLen: G2L_EXERCISE_ENUMERATION.maxLen,
    maxWords: G2L_EXERCISE_ENUMERATION.maxWords,
  });
  const studentSet = new Set(studentWords);
  const missing = expected.filter((word) => !studentSet.has(word));

  return {
    status: wrong.length === 0 && missing.length === 0 ? "match" : "mismatch",
    wrong,
    missing,
  };
}
