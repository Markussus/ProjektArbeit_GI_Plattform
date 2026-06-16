import { recognizeWord } from "./rlLanguageOps";
import { parseGrammar } from "./rlGrammarValidation";
import { parseLanguageSpec } from "./rlLanguageSpecParser";

export type RLCheckStatus = "match" | "mismatch" | "invalid";

export interface RLCheckResult {
  status: RLCheckStatus;
  /** Why the input couldn't be checked (only set when status is "invalid"). */
  reason?:
    | "studentParse"
    | "studentNotEnumerated"
    | "studentEmpty"
    | "reference";
  /** Words the student listed that the target language does not contain. */
  wrong: string[];
  /** Example words the student did not include. */
  missing: string[];
}

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

function enumerationWords(
  source: string,
): string[] | "parse" | "notEnumerated" {
  const parsed = parseLanguageSpec(source);
  if (!parsed.ok) {
    return "parse";
  }
  if (parsed.spec.kind !== "enumeration") {
    return "notEnumerated";
  }
  return uniqueTrimmed(parsed.spec.words);
}

/**
 * Approximate, practice-oriented check for the Language → Grammar exercises.
 *
 * The learner enters the target language as an explicit word list (the
 * simulator then derives a grammar from it). We confirm two things against the
 * reference solution grammar:
 *  - correctness: every word they listed is actually in the target language;
 *  - coverage: they included all of the worked example words.
 *
 * This guarantees "Load solution" → "Check" always matches, and is meant as a
 * learning aid rather than a formal grader.
 */
export function checkLanguageExercise(
  studentSource: string,
  referenceGrammarSource: string,
  seedLanguageSource: string,
): RLCheckResult {
  const referenceGrammar = parseGrammar(referenceGrammarSource);
  if (!referenceGrammar.ok || !referenceGrammar.grammar) {
    return { status: "invalid", reason: "reference", wrong: [], missing: [] };
  }

  const studentWords = enumerationWords(studentSource);
  if (studentWords === "parse") {
    return {
      status: "invalid",
      reason: "studentParse",
      wrong: [],
      missing: [],
    };
  }
  if (studentWords === "notEnumerated") {
    return {
      status: "invalid",
      reason: "studentNotEnumerated",
      wrong: [],
      missing: [],
    };
  }
  if (studentWords.length === 0) {
    return {
      status: "invalid",
      reason: "studentEmpty",
      wrong: [],
      missing: [],
    };
  }

  const grammar = referenceGrammar.grammar;
  const wrong = studentWords.filter(
    (word) => !recognizeWord(grammar, word).accepted,
  );

  const parsedSeed = enumerationWords(seedLanguageSource);
  const seedWords = Array.isArray(parsedSeed) ? parsedSeed : [];
  const studentSet = new Set(studentWords);
  const missing = seedWords.filter((word) => !studentSet.has(word));

  return {
    status: wrong.length === 0 && missing.length === 0 ? "match" : "mismatch",
    wrong,
    missing,
  };
}
