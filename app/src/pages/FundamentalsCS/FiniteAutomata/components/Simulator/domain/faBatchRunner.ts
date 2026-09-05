import { createInitialRuntime, stepRuntime } from "./faMachine";
import type { FAProgram } from "./faTypes";

/**
 * Result of running a single word through the automaton to completion.
 */
export interface FABatchResult {
  /** The original input string */
  inputWord: string;
  /** Whether the word was accepted */
  accepted: boolean;
  /** How many simulation steps were taken */
  steps: number;
  /** Final active states when halted */
  finalStates: string[];
  /** Index of the step where no transition was available (dead end), or null */
  failStepIndex: number | null;
}

/**
 * Run a single word to completion on the given automaton.
 */
function runSingle(program: FAProgram, word: string): FABatchResult {
  const symbols = word.split("");
  let runtime = createInitialRuntime(program, symbols);
  let failStepIndex: number | null = null;

  while (!runtime.halted) {
    const prev = runtime;
    runtime = stepRuntime(program, runtime);

    // If we transitioned to zero states (dead end), record where it happened
    if (
      runtime.halted &&
      runtime.haltReason?.type === "rejected" &&
      runtime.activeStates.length === 0
    ) {
      failStepIndex = prev.stepCount;
    }
  }

  return {
    inputWord: word,
    accepted: runtime.haltReason?.type === "accepted",
    steps: runtime.stepCount,
    finalStates: [...runtime.activeStates],
    failStepIndex,
  };
}

/**
 * Run a batch of words through the automaton. Each word is simulated to
 * completion synchronously (no step-by-step).
 */
export function runBatch(program: FAProgram, words: string[]): FABatchResult[] {
  return words.map((w) => runSingle(program, w));
}
