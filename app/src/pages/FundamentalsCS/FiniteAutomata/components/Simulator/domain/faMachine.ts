import type { FAProgram } from "./faTypes";
import type { FARuntime } from "./faRuntime";
import { EPSILON } from "./faTypes";

/**
 * Create the initial runtime for a finite automaton execution.
 */
export function createInitialRuntime(
  program: FAProgram,
  inputWord: string[],
): FARuntime {
  const initialStates = epsilonClosure(program, [program.startState]);

  const runtime: FARuntime = {
    activeStates: initialStates,
    inputWord,
    inputPosition: 0,
    stepCount: 0,
    halted: false,
    haltReason: null,
    stateHistory: [initialStates],
    transitionHistory: [],
  };

  // If input is empty, check acceptance immediately
  if (inputWord.length === 0) {
    return applyHaltCheck(program, runtime);
  }

  return runtime;
}

/**
 * Can we still step?
 */
function canStep(runtime: FARuntime): boolean {
  return !runtime.halted;
}

/**
 * Execute a single step: read the current symbol, compute next states.
 */
export function stepRuntime(program: FAProgram, runtime: FARuntime): FARuntime {
  if (!canStep(runtime)) {
    return runtime;
  }

  // If we've consumed all input, halt
  if (runtime.inputPosition >= runtime.inputWord.length) {
    return applyHaltCheck(program, runtime);
  }

  const symbol = runtime.inputWord[runtime.inputPosition];
  const fromStates = runtime.activeStates;

  // Compute next states
  let nextStates: string[] = [];
  for (const state of fromStates) {
    const targets = program.transitions[state]?.[symbol] ?? [];
    nextStates.push(...targets);
  }

  // Remove duplicates
  nextStates = [...new Set(nextStates)];

  // Always take the ε-closure, exactly like `createInitialRuntime` does. A
  // valid DFA has no ε-transitions, so this is a no-op there; gating it on the
  // declared type instead made step 0 and every later step disagree whenever a
  // program carried ε-transitions under a "DFA" label.
  nextStates = epsilonClosure(program, nextStates);

  // If no transitions available (dead end). The run has no reachable states
  // any more, so `activeStates` must be cleared too — otherwise the status
  // card and the state diagram keep highlighting the state we came from.
  if (nextStates.length === 0) {
    return {
      ...runtime,
      activeStates: [],
      inputPosition: runtime.inputPosition + 1,
      stepCount: runtime.stepCount + 1,
      halted: true,
      haltReason: {
        type: "rejected",
        states: [],
      },
      stateHistory: [...runtime.stateHistory, []],
      transitionHistory: [
        ...runtime.transitionHistory,
        { fromStates, symbol, toStates: [] },
      ],
    };
  }

  const newRuntime: FARuntime = {
    activeStates: nextStates,
    inputWord: runtime.inputWord,
    inputPosition: runtime.inputPosition + 1,
    stepCount: runtime.stepCount + 1,
    halted: false,
    haltReason: null,
    stateHistory: [...runtime.stateHistory, nextStates],
    transitionHistory: [
      ...runtime.transitionHistory,
      { fromStates, symbol, toStates: nextStates },
    ],
  };

  // If we've now consumed all input, check acceptance
  if (newRuntime.inputPosition >= newRuntime.inputWord.length) {
    return applyHaltCheck(program, newRuntime);
  }

  return newRuntime;
}

/**
 * Check whether current states include an accept state; halt accordingly.
 */
function applyHaltCheck(program: FAProgram, runtime: FARuntime): FARuntime {
  const hasAcceptState = runtime.activeStates.some((s) =>
    program.acceptStates.includes(s),
  );

  return {
    ...runtime,
    halted: true,
    haltReason: hasAcceptState
      ? { type: "accepted", states: runtime.activeStates }
      : { type: "rejected", states: runtime.activeStates },
  };
}

/**
 * Compute epsilon closure for a set of states (NFA only).
 */
export function epsilonClosure(program: FAProgram, states: string[]): string[] {
  const closure = new Set(states);
  const stack = [...states];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const epsilonTargets = program.transitions[current]?.[EPSILON] ?? [];
    for (const target of epsilonTargets) {
      if (!closure.has(target)) {
        closure.add(target);
        stack.push(target);
      }
    }
  }

  return [...closure];
}
