import { withDerivedAlphabets } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmProgram";
import type { TMProgram } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmProgram";
import type { TMRuntime } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmRuntime";
import { DEFAULT_BLANK_SYMBOL } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmTypes";

export const defaultTMProgram: TMProgram = withDerivedAlphabets({
  states: ["q0", "qS"],
  inputAlphabet: [],
  tapeAlphabet: ["0", "1", DEFAULT_BLANK_SYMBOL],
  blankSymbol: DEFAULT_BLANK_SYMBOL,
  initialState: "q0",
  haltStates: ["qS"],
  initialTape: ["0", "1", "1", "0"],
  transitions: {
    [DEFAULT_BLANK_SYMBOL]: {
      q0: {
        nextState: "qS",
        writeSymbol: DEFAULT_BLANK_SYMBOL,
        movement: "L",
      },
    },
    "0": {
      q0: {
        nextState: "q0",
        writeSymbol: "1",
        movement: "R",
      },
    },
    "1": {
      q0: {
        nextState: "q0",
        writeSymbol: "0",
        movement: "R",
      },
    },
  },
});

export function createTestProgram(
  overrides: Partial<TMProgram> = {},
): TMProgram {
  return {
    states: ["q0", "q1", "halt"],
    inputAlphabet: ["0", "1"],
    tapeAlphabet: ["0", "1", "_"],
    blankSymbol: "_",
    initialState: "q0",
    haltStates: ["halt"],
    transitions: {
      "0": {
        q0: { nextState: "q1", writeSymbol: "1", movement: "R" },
      },
      "1": {
        q1: { nextState: "halt", writeSymbol: "0", movement: "L" },
      },
      _: {
        q0: { nextState: "halt", writeSymbol: "_", movement: "N" },
      },
    },
    initialTape: ["0", "1"],
    ...overrides,
  };
}

export function createTestRuntime(
  overrides: Partial<TMRuntime> = {},
): TMRuntime {
  return {
    currentState: "q0",
    headPosition: 0,
    tape: { 0: "0", 1: "1" },
    stepCount: 0,
    halted: false,
    haltReason: null,
    ...overrides,
  };
}
