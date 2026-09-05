import { describe, it, expect } from "vitest";
import {
  validateFAProgram,
  isFAProgramValid,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faProgramValidation";
import type { FAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import { EPSILON } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import {
  defaultDFAProgram,
  defaultNFAProgram,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/defaultFAProgram";

const validDFA: FAProgram = {
  type: "DFA",
  states: ["s0", "s1"],
  alphabet: ["a"],
  transitions: { s0: { a: ["s1"] }, s1: { a: ["s0"] } },
  startState: "s0",
  acceptStates: ["s1"],
};

describe("validateFAProgram — valid programs", () => {
  it("returns no issues for defaultDFAProgram", () => {
    expect(validateFAProgram(defaultDFAProgram)).toHaveLength(0);
  });

  it("returns no issues for defaultNFAProgram", () => {
    expect(validateFAProgram(defaultNFAProgram)).toHaveLength(0);
  });

  it("returns no issues for a minimal valid DFA", () => {
    expect(validateFAProgram(validDFA)).toHaveLength(0);
  });
});

describe("validateFAProgram — states_empty", () => {
  it("reports states_empty when states array is empty", () => {
    const program: FAProgram = { ...validDFA, states: [], transitions: {} };
    const issues = validateFAProgram(program);
    expect(issues.some((i) => i.code === "states_empty")).toBe(true);
  });
});

describe("validateFAProgram — start_state_missing", () => {
  it("reports start_state_missing when startState is not in states", () => {
    const program: FAProgram = { ...validDFA, startState: "nonexistent" };
    const issues = validateFAProgram(program);
    expect(issues.some((i) => i.code === "start_state_missing")).toBe(true);
  });

  it("includes the bad state name in params", () => {
    const program: FAProgram = { ...validDFA, startState: "ghost" };
    const issues = validateFAProgram(program);
    const issue = issues.find((i) => i.code === "start_state_missing");
    expect(issue?.params?.state).toBe("ghost");
  });
});

describe("validateFAProgram — accept_states_reference_invalid", () => {
  it("reports accept_states_reference_invalid for an unknown accept state", () => {
    const program: FAProgram = {
      ...validDFA,
      acceptStates: ["s0", "unknown"],
    };
    const issues = validateFAProgram(program);
    expect(
      issues.some((i) => i.code === "accept_states_reference_invalid"),
    ).toBe(true);
  });

  it("does not report it when all accept states are valid", () => {
    expect(
      validateFAProgram(validDFA).some(
        (i) => i.code === "accept_states_reference_invalid",
      ),
    ).toBe(false);
  });
});

describe("validateFAProgram — alphabet_empty", () => {
  it("reports alphabet_empty when alphabet is empty", () => {
    const program: FAProgram = { ...validDFA, alphabet: [], transitions: {} };
    const issues = validateFAProgram(program);
    expect(issues.some((i) => i.code === "alphabet_empty")).toBe(true);
  });
});

describe("validateFAProgram — transition_source_invalid", () => {
  it("reports transition_source_invalid when a transition refers to an unknown source state", () => {
    const program: FAProgram = {
      ...validDFA,
      transitions: {
        ...validDFA.transitions,
        ghost: { a: ["s0"] },
      },
    };
    const issues = validateFAProgram(program);
    expect(issues.some((i) => i.code === "transition_source_invalid")).toBe(
      true,
    );
  });
});

describe("validateFAProgram — transition_target_invalid", () => {
  it("reports transition_target_invalid when a transition points to an unknown state", () => {
    const program: FAProgram = {
      ...validDFA,
      transitions: { s0: { a: ["nowhere"] }, s1: { a: ["s0"] } },
    };
    const issues = validateFAProgram(program);
    expect(issues.some((i) => i.code === "transition_target_invalid")).toBe(
      true,
    );
  });
});

describe("validateFAProgram — transition_symbol_invalid", () => {
  it("reports transition_symbol_invalid when a transition uses a symbol not in the alphabet", () => {
    const program: FAProgram = {
      ...validDFA,
      transitions: { s0: { a: ["s1"], z: ["s0"] }, s1: { a: ["s0"] } },
    };
    const issues = validateFAProgram(program);
    expect(issues.some((i) => i.code === "transition_symbol_invalid")).toBe(
      true,
    );
  });
});

describe("validateFAProgram — dfa_nondeterministic", () => {
  it("reports dfa_nondeterministic when a DFA transition has multiple targets", () => {
    const program: FAProgram = {
      ...validDFA,
      transitions: { s0: { a: ["s0", "s1"] }, s1: { a: ["s0"] } },
    };
    const issues = validateFAProgram(program);
    expect(issues.some((i) => i.code === "dfa_nondeterministic")).toBe(true);
  });

  it("does not report it for an NFA with multiple targets", () => {
    const program: FAProgram = {
      ...defaultNFAProgram,
    };
    expect(
      validateFAProgram(program).some((i) => i.code === "dfa_nondeterministic"),
    ).toBe(false);
  });
});

describe("validateFAProgram — dfa_epsilon_transition", () => {
  it("reports dfa_epsilon_transition when a DFA has an epsilon transition", () => {
    const program: FAProgram = {
      ...validDFA,
      transitions: { s0: { a: ["s1"], [EPSILON]: ["s1"] }, s1: { a: ["s0"] } },
    };
    const issues = validateFAProgram(program);
    expect(issues.some((i) => i.code === "dfa_epsilon_transition")).toBe(true);
  });

  it("allows epsilon transitions in an NFA without reporting an issue", () => {
    const program: FAProgram = {
      type: "NFA",
      states: ["s0", "s1"],
      alphabet: ["a"],
      transitions: { s0: { [EPSILON]: ["s1"] }, s1: {} },
      startState: "s0",
      acceptStates: ["s1"],
    };
    expect(
      validateFAProgram(program).some(
        (i) => i.code === "dfa_epsilon_transition",
      ),
    ).toBe(false);
  });
});

describe("isFAProgramValid", () => {
  it("returns true for a valid program", () => {
    expect(isFAProgramValid(validDFA)).toBe(true);
  });

  it("returns false for an invalid program", () => {
    const invalid: FAProgram = { ...validDFA, states: [] };
    expect(isFAProgramValid(invalid)).toBe(false);
  });
});
