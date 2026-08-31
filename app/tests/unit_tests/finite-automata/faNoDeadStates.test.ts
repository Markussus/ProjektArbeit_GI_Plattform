import { describe, expect, it } from "vitest";
import type { FAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import {
  defaultDFAProgram,
  defaultNFAProgram,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/defaultFAProgram";
import { faExamples } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/faExamples";
import { allFAExercises } from "@/pages/FundamentalsCS/FiniteAutomata/exercises/faExerciseDefinitions";

/**
 * The course builds partial automata: a symbol with no transition *is* the
 * rejection, so no automaton we ship may carry a trap state. This guards the
 * shipped data against one creeping back in.
 *
 * Exercise starters are excluded on purpose — a blank canvas has no accept
 * state yet, so every state in it is trivially "dead" until the learner builds
 * something.
 */
function successors(program: FAProgram, state: string): string[] {
  return Object.values(program.transitions[state] ?? {}).flat();
}

function reachableStates(program: FAProgram): Set<string> {
  const reachable = new Set([program.startState]);
  const stack = [program.startState];
  while (stack.length > 0) {
    for (const target of successors(program, stack.pop()!)) {
      if (!reachable.has(target)) {
        reachable.add(target);
        stack.push(target);
      }
    }
  }
  return reachable;
}

/** Reachable states from which no accept state can be reached. */
function deadStates(program: FAProgram): string[] {
  const reachable = reachableStates(program);
  const live = new Set(program.acceptStates.filter((s) => reachable.has(s)));

  for (let grew = true; grew;) {
    grew = false;
    for (const state of reachable) {
      if (live.has(state)) continue;
      if (successors(program, state).some((t) => live.has(t))) {
        live.add(state);
        grew = true;
      }
    }
  }

  return [...reachable].filter((state) => !live.has(state)).sort();
}

const programs: Array<[string, FAProgram]> = [
  ["default DFA", defaultDFAProgram],
  ["default NFA", defaultNFAProgram],
  ...faExamples.map((e): [string, FAProgram] => [`example ${e.id}`, e.program]),
  ...allFAExercises.map((e): [string, FAProgram] => [
    `exercise ${e.id} solution`,
    e.solution,
  ]),
];

describe("shipped automata carry no trap state", () => {
  it.each(programs)("%s has no dead state", (_name, program) => {
    expect(deadStates(program)).toEqual([]);
  });

  it.each(programs)("%s declares no unreachable state", (_name, program) => {
    const reachable = reachableStates(program);
    expect(program.states.filter((s) => !reachable.has(s))).toEqual([]);
  });
});
