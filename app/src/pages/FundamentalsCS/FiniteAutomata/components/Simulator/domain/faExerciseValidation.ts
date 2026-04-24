import type { FAProgram } from "./faTypes";
import { EPSILON } from "./faTypes";
import { validateFAProgram } from "./faProgramValidation";

/* ────────────────────────────────────────────────────────────
   Configuration-based simulator shared by both programs so the
   same evaluator is used regardless of DFA/NFA type.
   ──────────────────────────────────────────────────────────── */

function epsilonClosure(
  program: FAProgram,
  seed: Iterable<string>,
): Set<string> {
  const result = new Set<string>(seed);
  const stack = [...result];
  while (stack.length > 0) {
    const s = stack.pop()!;
    const eps = program.transitions[s]?.[EPSILON] ?? [];
    for (const t of eps) {
      if (!result.has(t)) {
        result.add(t);
        stack.push(t);
      }
    }
  }
  return result;
}

function step(
  program: FAProgram,
  active: Set<string>,
  symbol: string,
): Set<string> {
  const next = new Set<string>();
  for (const s of active) {
    const targets = program.transitions[s]?.[symbol] ?? [];
    for (const t of targets) next.add(t);
  }
  return epsilonClosure(program, next);
}

/** Run `program` on `word`; return true iff any active state is accepting. */
export function accepts(program: FAProgram, word: string): boolean {
  let active = epsilonClosure(program, [program.startState]);
  for (const ch of word) {
    if (!program.alphabet.includes(ch)) return false;
    active = step(program, active, ch);
    if (active.size === 0) return false;
  }
  const acceptSet = new Set(program.acceptStates);
  for (const s of active) if (acceptSet.has(s)) return true;
  return false;
}

/* ────────────────────────────────────────────────────────────
   Test-string enumeration over a shared alphabet
   ──────────────────────────────────────────────────────────── */

export function enumerateWords(alphabet: string[], maxLen: number): string[] {
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

/* ────────────────────────────────────────────────────────────
   Public API: compare student vs. reference automaton
   ──────────────────────────────────────────────────────────── */

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
  /** The first failing test, if any — used as the counterexample in UI. */
  firstFailure: TestCase | null;
  /** Full per-word detail (capped by maxSamples for UI display). */
  cases: TestCase[];
  /** Structural issues in the student's program (invalid transitions, etc). */
  structuralIssues: string[];
}

export interface ValidateOptions {
  /** Words 0..maxLen are enumerated. Default 4. */
  maxLen?: number;
  /** Cap the number of TestCase rows returned. Default 50. */
  maxSamples?: number;
}

export function validateAgainstSolution(
  student: FAProgram,
  solution: FAProgram,
  options: ValidateOptions = {},
): ValidationResult {
  const maxLen = options.maxLen ?? 4;
  const maxSamples = options.maxSamples ?? 50;

  // Surface structural problems first — they're usually the real reason an
  // automaton fails, and blaming test-string mismatches would be misleading.
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

  for (const word of words) {
    const expected = accepts(solution, word);
    // If the student's alphabet doesn't cover a symbol, `accepts` returns
    // false — which is a legitimate rejection to report, not a crash.
    const got = accepts(student, word);
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
