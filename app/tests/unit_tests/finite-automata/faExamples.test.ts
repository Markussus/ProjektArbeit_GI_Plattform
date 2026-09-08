import { describe, expect, it } from "vitest";
import {
  faExamples,
  findFAExample,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/faExamples";
import {
  createInitialRuntime,
  stepRuntime,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faMachine";
import { isFAProgramValid } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faProgramValidation";
import type { FAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import { EPSILON } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";

function makeSimulate(program: FAProgram) {
  return (word: string) => {
    let rt = createInitialRuntime(program, word.split(""));
    while (!rt.halted) rt = stepRuntime(program, rt);
    return rt;
  };
}

/**
 * The example exists to show the one construction the model cannot express
 * directly: a *set* of start states, rebuilt from the single `startState` plus
 * ε-transitions. If the ε row ever gets lost, the run no longer reaches `B0`
 * and the union collapses to a⁺ — hence the closure assertion below.
 */
describe("example: multiple start states via ε", () => {
  const example = findFAExample("multiple-start-states")!;
  const simulate = makeSimulate(example.program);

  it("is registered as an NFA in the nfa section", () => {
    expect(faExamples).toContain(example);
    expect(example.type).toBe("NFA");
    expect(example.category).toBe("nfa");
    expect(example.program.type).toBe("NFA");
  });

  it("is a valid program", () => {
    expect(isFAProgramValid(example.program)).toEqual(true);
  });

  it("reaches both intended start states through ε only", () => {
    expect(example.program.transitions.S).toEqual({
      [EPSILON]: ["A0", "B0"],
    });
  });

  it("begins the run in the ε-closure of the declared start state", () => {
    const rt = createInitialRuntime(example.program, ["a"]);
    expect([...rt.activeStates].sort()).toEqual(["A0", "B0", "S"]);
  });

  it.each(["a", "aaa", "b", "bbbb"])("accepts %s", (word) => {
    expect(simulate(word).haltReason?.type).toBe("accepted");
  });

  it.each(["", "ab", "ba", "aab", "bba"])("rejects %s", (word) => {
    expect(simulate(word).haltReason?.type).toBe("rejected");
  });

  it("accepts the input word it ships with", () => {
    expect(simulate(example.inputWord).haltReason?.type).toBe("accepted");
  });
});
