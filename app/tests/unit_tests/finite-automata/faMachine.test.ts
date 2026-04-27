import { describe, it, expect } from "vitest";
import {
  createInitialRuntime,
  stepRuntime,
  epsilonClosure,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faMachine";
import type { FAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import { EPSILON } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import {
  defaultDFAProgram,
  defaultNFAProgram,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/defaultFAProgram";

const simpleDFA: FAProgram = {
  type: "DFA",
  states: ["q0", "q1"],
  alphabet: ["a"],
  transitions: {
    q0: { a: ["q1"] },
    q1: { a: ["q0"] },
  },
  startState: "q0",
  acceptStates: ["q1"],
};

const deadEndDFA: FAProgram = {
  type: "DFA",
  states: ["q0"],
  alphabet: ["a", "b"],
  transitions: { q0: { a: ["q0"] } },
  startState: "q0",
  acceptStates: ["q0"],
};

const nfaWithEpsilon: FAProgram = {
  type: "NFA",
  states: ["q0", "q1", "q2"],
  alphabet: ["a"],
  transitions: {
    q0: { [EPSILON]: ["q1"] },
    q1: { [EPSILON]: ["q2"] },
    q2: {},
  },
  startState: "q0",
  acceptStates: ["q2"],
};

function makeSimulate(program: FAProgram) {
  return (word: string) => {
    let rt = createInitialRuntime(program, word.split(""));
    while (!rt.halted) rt = stepRuntime(program, rt);
    return rt;
  };
}

describe("createInitialRuntime", () => {
  it("sets activeStates to the start state", () => {
    const rt = createInitialRuntime(simpleDFA, ["a"]);
    expect(rt.activeStates).toEqual(["q0"]);
  });

  it("sets inputPosition to 0", () => {
    const rt = createInitialRuntime(simpleDFA, ["a"]);
    expect(rt.inputPosition).toBe(0);
  });

  it("sets stepCount to 0", () => {
    const rt = createInitialRuntime(simpleDFA, ["a"]);
    expect(rt.stepCount).toBe(0);
  });

  it("is not halted for non-empty input", () => {
    const rt = createInitialRuntime(simpleDFA, ["a"]);
    expect(rt.halted).toBe(false);
    expect(rt.haltReason).toBeNull();
  });

  it("records the start state in stateHistory", () => {
    const rt = createInitialRuntime(simpleDFA, ["a"]);
    expect(rt.stateHistory).toEqual([["q0"]]);
  });

  it("has an empty transitionHistory", () => {
    const rt = createInitialRuntime(simpleDFA, ["a"]);
    expect(rt.transitionHistory).toHaveLength(0);
  });

  it("halts immediately for empty input — rejected when start state is not accepting", () => {
    const rt = createInitialRuntime(simpleDFA, []);
    expect(rt.halted).toBe(true);
    expect(rt.haltReason?.type).toBe("rejected");
  });

  it("halts immediately for empty input — accepted when start state is accepting", () => {
    const acceptStartDFA: FAProgram = { ...simpleDFA, acceptStates: ["q0"] };
    const rt = createInitialRuntime(acceptStartDFA, []);
    expect(rt.halted).toBe(true);
    expect(rt.haltReason?.type).toBe("accepted");
  });

  it("includes epsilon-reachable states in activeStates for NFA", () => {
    const rt = createInitialRuntime(nfaWithEpsilon, ["a"]);
    expect(rt.activeStates).toContain("q0");
    expect(rt.activeStates).toContain("q1");
    expect(rt.activeStates).toContain("q2");
  });
});

describe("stepRuntime", () => {
  it("returns the same runtime unchanged when already halted", () => {
    const rt = createInitialRuntime(simpleDFA, []);
    const next = stepRuntime(simpleDFA, rt);
    expect(next).toBe(rt);
  });

  it("advances inputPosition by 1", () => {
    const rt = createInitialRuntime(simpleDFA, ["a", "a"]);
    const next = stepRuntime(simpleDFA, rt);
    expect(next.inputPosition).toBe(1);
  });

  it("increments stepCount", () => {
    const rt = createInitialRuntime(simpleDFA, ["a", "a"]);
    const next = stepRuntime(simpleDFA, rt);
    expect(next.stepCount).toBe(1);
  });

  it("transitions to the correct next state", () => {
    const rt = createInitialRuntime(simpleDFA, ["a", "a"]);
    const next = stepRuntime(simpleDFA, rt);
    expect(next.activeStates).toEqual(["q1"]);
  });

  it("records the transition in transitionHistory", () => {
    const rt = createInitialRuntime(simpleDFA, ["a", "a"]);
    const next = stepRuntime(simpleDFA, rt);
    expect(next.transitionHistory).toHaveLength(1);
    expect(next.transitionHistory[0]).toEqual({
      fromStates: ["q0"],
      symbol: "a",
      toStates: ["q1"],
    });
  });

  it("appends to stateHistory", () => {
    const rt = createInitialRuntime(simpleDFA, ["a", "a"]);
    const next = stepRuntime(simpleDFA, rt);
    expect(next.stateHistory).toHaveLength(2);
    expect(next.stateHistory[1]).toEqual(["q1"]);
  });

  it("halts with accepted when landing on an accept state after last symbol", () => {
    const rt = createInitialRuntime(simpleDFA, ["a"]);
    const next = stepRuntime(simpleDFA, rt);
    expect(next.halted).toBe(true);
    expect(next.haltReason?.type).toBe("accepted");
  });

  it("halts with rejected when landing on a non-accept state after last symbol", () => {
    const rt = createInitialRuntime(simpleDFA, ["a", "a"]);
    const step1 = stepRuntime(simpleDFA, rt);
    const step2 = stepRuntime(simpleDFA, step1);
    expect(step2.halted).toBe(true);
    expect(step2.haltReason?.type).toBe("rejected");
  });

  it("halts with rejected when no transition is available", () => {
    const rt = createInitialRuntime(deadEndDFA, ["b"]);
    const next = stepRuntime(deadEndDFA, rt);
    expect(next.halted).toBe(true);
    expect(next.haltReason).toEqual({ type: "rejected", states: [] });
  });

  it("does not mutate the previous runtime", () => {
    const rt = createInitialRuntime(simpleDFA, ["a", "a"]);
    const originalPosition = rt.inputPosition;
    stepRuntime(simpleDFA, rt);
    expect(rt.inputPosition).toBe(originalPosition);
  });
});

describe("epsilonClosure", () => {
  it("returns the same state when there are no epsilon transitions", () => {
    const closure = epsilonClosure(defaultDFAProgram, ["s0"]);
    expect(closure).toEqual(["s0"]);
  });

  it("follows a single epsilon transition", () => {
    const closure = epsilonClosure(nfaWithEpsilon, ["q0"]);
    expect(closure).toContain("q0");
    expect(closure).toContain("q1");
  });

  it("follows epsilon transitions transitively", () => {
    const closure = epsilonClosure(nfaWithEpsilon, ["q0"]);
    expect(closure).toContain("q2");
  });

  it("does not produce duplicate states", () => {
    const closure = epsilonClosure(nfaWithEpsilon, ["q0", "q1"]);
    const unique = new Set(closure);
    expect(unique.size).toBe(closure.length);
  });

  it("handles a state with no outgoing epsilon transitions", () => {
    const closure = epsilonClosure(nfaWithEpsilon, ["q2"]);
    expect(closure).toEqual(["q2"]);
  });

  it("handles an empty state list", () => {
    const closure = epsilonClosure(defaultDFAProgram, []);
    expect(closure).toEqual([]);
  });
});

describe("full DFA simulation — defaultDFAProgram", () => {
  const simulate = makeSimulate(defaultDFAProgram);

  it.each(["aab", "ab", "aaab", "aabab"])("accepts '%s'", (word) => {
    expect(simulate(word).haltReason?.type).toBe("accepted");
  });

  it.each(["", "a", "bb", "ba"])("rejects '%s'", (word) => {
    expect(simulate(word).haltReason?.type).toBe("rejected");
  });

  it("produces the correct number of steps for 'aab'", () => {
    expect(simulate("aab").stepCount).toBe(3);
  });
});

describe("full NFA simulation — defaultNFAProgram", () => {
  const simulate = makeSimulate(defaultNFAProgram);

  it.each(["aab", "ab", "aaab"])("accepts '%s'", (word) => {
    expect(simulate(word).haltReason?.type).toBe("accepted");
  });

  it.each(["a", "bb", ""])("rejects '%s'", (word) => {
    expect(simulate(word).haltReason?.type).toBe("rejected");
  });
});
