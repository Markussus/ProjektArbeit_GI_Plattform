import { describe, it, expect } from "vitest";
import {
  defaultDFAProgram,
  defaultNFAProgram,
  defaultInputWord,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/defaultFAProgram";
import { isFAProgramValid } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faProgramValidation";
import {
  createInitialRuntime,
  stepRuntime,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faMachine";
import type { FAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";

function runToEnd(program: FAProgram, word: string) {
  let runtime = createInitialRuntime(program, word.split(""));
  while (!runtime.halted) {
    runtime = stepRuntime(program, runtime);
  }
  return runtime;
}

describe("defaultDFAProgram — structure", () => {
  it("has type DFA", () => {
    expect(defaultDFAProgram.type).toBe("DFA");
  });

  it("has exactly 3 states: S0, S1, S2", () => {
    expect(defaultDFAProgram.states).toEqual(["S0", "S1", "S2"]);
  });

  it("has alphabet [a, b]", () => {
    expect(defaultDFAProgram.alphabet).toEqual(["a", "b"]);
  });

  it("has S0 as start state", () => {
    expect(defaultDFAProgram.startState).toBe("S0");
  });

  it("has S2 as the only accept state", () => {
    expect(defaultDFAProgram.acceptStates).toEqual(["S2"]);
  });

  it("has a transition entry for every state", () => {
    for (const state of defaultDFAProgram.states) {
      expect(defaultDFAProgram.transitions).toHaveProperty(state);
    }
  });

  it("passes validation (no issues)", () => {
    expect(isFAProgramValid(defaultDFAProgram)).toBe(true);
  });
});

describe("defaultDFAProgram — simulation", () => {
  it("accepts the default input word 'aab'", () => {
    expect(runToEnd(defaultDFAProgram, defaultInputWord).haltReason?.type).toBe(
      "accepted",
    );
  });

  it("accepts 'ab'", () => {
    expect(runToEnd(defaultDFAProgram, "ab").haltReason?.type).toBe("accepted");
  });

  it("accepts 'aaab'", () => {
    expect(runToEnd(defaultDFAProgram, "aaab").haltReason?.type).toBe(
      "accepted",
    );
  });

  it("rejects empty string", () => {
    expect(runToEnd(defaultDFAProgram, "").haltReason?.type).toBe("rejected");
  });

  it("rejects 'a' (no accept state reached)", () => {
    expect(runToEnd(defaultDFAProgram, "a").haltReason?.type).toBe("rejected");
  });

  it("rejects 'bb'", () => {
    expect(runToEnd(defaultDFAProgram, "bb").haltReason?.type).toBe("rejected");
  });

  it("rejects 'ba'", () => {
    expect(runToEnd(defaultDFAProgram, "ba").haltReason?.type).toBe("rejected");
  });
});

describe("defaultNFAProgram — structure", () => {
  it("has type NFA", () => {
    expect(defaultNFAProgram.type).toBe("NFA");
  });

  it("has exactly 3 states: S0, S1, S2", () => {
    expect(defaultNFAProgram.states).toEqual(["S0", "S1", "S2"]);
  });

  it("has alphabet [a, b]", () => {
    expect(defaultNFAProgram.alphabet).toEqual(["a", "b"]);
  });

  it("has S0 as start state", () => {
    expect(defaultNFAProgram.startState).toBe("S0");
  });

  it("has S2 as the only accept state", () => {
    expect(defaultNFAProgram.acceptStates).toEqual(["S2"]);
  });

  it("passes validation (no issues)", () => {
    expect(isFAProgramValid(defaultNFAProgram)).toBe(true);
  });

  it("has non-deterministic choice on 'a' from S0", () => {
    const targets = defaultNFAProgram.transitions["S0"]["a"];
    expect(targets.length).toBeGreaterThan(1);
  });
});

describe("defaultNFAProgram — simulation", () => {
  it("accepts the default input word 'aab'", () => {
    expect(runToEnd(defaultNFAProgram, defaultInputWord).haltReason?.type).toBe(
      "accepted",
    );
  });

  it("accepts 'ab'", () => {
    expect(runToEnd(defaultNFAProgram, "ab").haltReason?.type).toBe("accepted");
  });

  it("rejects 'a' alone", () => {
    expect(runToEnd(defaultNFAProgram, "a").haltReason?.type).toBe("rejected");
  });

  it("rejects 'bb'", () => {
    expect(runToEnd(defaultNFAProgram, "bb").haltReason?.type).toBe("rejected");
  });

  it("rejects empty string", () => {
    expect(runToEnd(defaultNFAProgram, "").haltReason?.type).toBe("rejected");
  });
});

describe("defaultInputWord", () => {
  it("is the string 'aab'", () => {
    expect(defaultInputWord).toBe("aab");
  });
});
