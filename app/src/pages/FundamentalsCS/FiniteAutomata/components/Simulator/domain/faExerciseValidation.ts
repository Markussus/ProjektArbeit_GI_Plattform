import type { FAProgram } from "./faTypes";
import { epsilonClosure } from "./faMachine";
import { validateFAProgram } from "./faProgramValidation";

/* ────────────────────────────────────────────────────────────
   Acceptance check shared by both programs — the set-at-a-time
   equivalent of stepping `faMachine`, without the step history.
   ──────────────────────────────────────────────────────────── */

function step(program: FAProgram, active: string[], symbol: string): string[] {
  const next = new Set<string>();
  for (const state of active) {
    for (const target of program.transitions[state]?.[symbol] ?? []) {
      next.add(target);
    }
  }
  return epsilonClosure(program, [...next]);
}

/**
 * An acceptance test for one program. Validation runs the same program over
 * hundreds of words, so the set lookups and the start closure are built once
 * up front rather than per word.
 */
function createAcceptor(program: FAProgram): (word: string) => boolean {
  const alphabet = new Set(program.alphabet);
  const acceptStates = new Set(program.acceptStates);
  const startClosure = epsilonClosure(program, [program.startState]);

  return (word) => {
    let active = startClosure;
    for (const ch of word) {
      if (!alphabet.has(ch)) return false;
      active = step(program, active, ch);
      if (active.length === 0) return false;
    }
    return active.some((state) => acceptStates.has(state));
  };
}

/*
* Test-string enumeration over a shared alphabet
*/
function enumerateWords(alphabet: string[], maxLen: number): string[] {
  const words: string[] = [""];
  let frontier: string[] = [""];
  for (let len = 1; len <= maxLen; len++) {
    const next: string[] = [];
    for (const prefix of frontier) {
      for (const sym of alphabet) next.push(prefix + sym);
    }
    words.push(...next);
    frontier = next;
  }
  return words;
}

/*
* Public API: compare student vs. reference automaton
*/
export interface TestCase {
  word: string;
  expected: boolean;
  got: boolean;
  passed: boolean;
}

export interface ValidationResult {
  /** True iff every enumerated test case matches expected behavior. */
  passed: boolean;
  total: number;
  passedCount: number;
  failedCount: number;
  firstFailure: TestCase | null;
  /** Full per-word detail (capped by maxSamples for UI display). */
  cases: TestCase[];
  structuralIssues: string[];
}

export interface ValidateOptions {
  /** Words 0..maxLen are enumerated. Default 4. */
  maxLen?: number;
  /** Cap the number of TestCase rows returned. Default 50. */
  maxSamples?: number;
}

/** Compare both automata on every word up to `maxLen`. */
export function validateAgainstSolution(
  student: FAProgram,
  solution: FAProgram,
  options: ValidateOptions = {},
): ValidationResult {
  const maxLen = options.maxLen ?? 4;
  const maxSamples = options.maxSamples ?? 50;
  const structuralIssues: string[] = [];
  const studentIssues = validateFAProgram(student);
  for (const issue of studentIssues) {
    structuralIssues.push(issue.code);
  }

  const sharedAlphabet = Array.from(
    new Set([...student.alphabet, ...solution.alphabet]),
  );
  const words = enumerateWords(sharedAlphabet, maxLen);

  const cases: TestCase[] = [];
  let passedCount = 0;
  let firstFailure: TestCase | null = null;

  const solutionAccepts = createAcceptor(solution);
  const studentAccepts = createAcceptor(student);

  for (const word of words) {
    const expected = solutionAccepts(word);
    const got = studentAccepts(word);
    const passed = expected === got;
    const tc: TestCase = { word, expected, got, passed };
    if (passed) passedCount++;
    else if (firstFailure === null) firstFailure = tc;
    if (cases.length < maxSamples) cases.push(tc);
  }

  const total = words.length;
  const failedCount = total - passedCount;

  return {
    passed: failedCount === 0 && structuralIssues.length === 0,
    total,
    passedCount,
    failedCount,
    firstFailure,
    cases,
    structuralIssues,
  };
}
