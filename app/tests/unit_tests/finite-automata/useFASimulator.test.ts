/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFASimulator } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/application/useFASimulator";
import type { FAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import { EPSILON } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import { defaultDFAProgram } from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/config/defaultFAProgram";

/** `defaultDFAProgram` accepts words over {a,b} that end in "ab". */
function simulator(program: FAProgram = defaultDFAProgram, word = "aab") {
  return renderHook(({ p, w }) => useFASimulator(p, w), {
    initialProps: { p: program, w: word },
  });
}

describe("useFASimulator — initial state", () => {
  it("starts in the start state with nothing consumed", () => {
    const { result } = simulator();

    expect(result.current.runtime.activeStates).toEqual(["S0"]);
    expect(result.current.runtime.inputPosition).toBe(0);
    expect(result.current.runtime.stepCount).toBe(0);
    expect(result.current.runtime.halted).toBe(false);
  });

  it("splits the input word into one symbol per character", () => {
    const { result } = simulator(defaultDFAProgram, "ab");

    expect(result.current.runtime.inputWord).toEqual(["a", "b"]);
  });

  it("halts immediately on the empty word", () => {
    const { result } = simulator(defaultDFAProgram, "");

    expect(result.current.runtime.halted).toBe(true);
    expect(result.current.runtime.haltReason?.type).toBe("rejected");
  });

  it("reports no error for a valid program", () => {
    const { result } = simulator();

    expect(result.current.error).toBeNull();
  });
});

describe("useFASimulator — stepping", () => {
  it("advances one symbol per step", () => {
    const { result } = simulator();

    act(() => result.current.step());

    expect(result.current.runtime.stepCount).toBe(1);
    expect(result.current.runtime.inputPosition).toBe(1);
    expect(result.current.runtime.activeStates).toEqual(["S1"]);
  });

  it("runs to an accepting halt", () => {
    const { result } = simulator();

    act(() => result.current.step());
    act(() => result.current.step());
    act(() => result.current.step());

    expect(result.current.runtime.halted).toBe(true);
    expect(result.current.runtime.haltReason?.type).toBe("accepted");
  });

  it("ignores further steps once halted", () => {
    const { result } = simulator(defaultDFAProgram, "ab");

    act(() => result.current.step());
    act(() => result.current.step());
    const halted = result.current.runtime;
    act(() => result.current.step());

    expect(result.current.runtime.stepCount).toBe(halted.stepCount);
  });

  it("walks back to the previous runtime", () => {
    const { result } = simulator();

    act(() => result.current.step());
    act(() => result.current.step());
    act(() => result.current.stepBack());

    expect(result.current.runtime.stepCount).toBe(1);
    expect(result.current.runtime.activeStates).toEqual(["S1"]);
  });

  it("stays put when stepping back from the start", () => {
    const { result } = simulator();

    act(() => result.current.stepBack());

    expect(result.current.runtime.stepCount).toBe(0);
  });

  it("follows every branch of an NFA at once", () => {
    const nfa: FAProgram = {
      type: "NFA",
      states: ["S0", "S1", "S2"],
      alphabet: ["a"],
      transitions: { S0: { a: ["S1", "S2"] }, S1: {}, S2: {} },
      startState: "S0",
      acceptStates: ["S2"],
    };
    const { result } = simulator(nfa, "a");

    act(() => result.current.step());

    expect(result.current.runtime.activeStates.sort()).toEqual(["S1", "S2"]);
    expect(result.current.runtime.haltReason?.type).toBe("accepted");
  });

  it("takes the epsilon closure of the start state", () => {
    const withEpsilon: FAProgram = {
      type: "NFA",
      states: ["S0", "S1"],
      alphabet: ["a"],
      transitions: { S0: { [EPSILON]: ["S1"] }, S1: {} },
      startState: "S0",
      acceptStates: ["S1"],
    };
    const { result } = simulator(withEpsilon, "");

    expect(result.current.runtime.activeStates).toContain("S1");
    expect(result.current.runtime.haltReason?.type).toBe("accepted");
  });
});

describe("useFASimulator — jumping and resetting", () => {
  it("replays the run up to the requested step", () => {
    const { result } = simulator();

    act(() => result.current.jumpToStep(2));

    expect(result.current.runtime.stepCount).toBe(2);
    expect(result.current.runtime.inputPosition).toBe(2);
  });

  it("jumping to 0 returns to the initial runtime", () => {
    const { result } = simulator();

    act(() => result.current.step());
    act(() => result.current.jumpToStep(0));

    expect(result.current.runtime.stepCount).toBe(0);
    expect(result.current.runtime.activeStates).toEqual(["S0"]);
  });

  it("stops jumping once the run has halted", () => {
    const { result } = simulator(defaultDFAProgram, "ab");

    act(() => result.current.jumpToStep(99));

    expect(result.current.runtime.stepCount).toBe(2);
    expect(result.current.runtime.halted).toBe(true);
  });

  it("keeps the step history usable after a jump", () => {
    const { result } = simulator();

    act(() => result.current.jumpToStep(2));
    act(() => result.current.stepBack());

    expect(result.current.runtime.stepCount).toBe(1);
  });

  it("reset returns the run to its starting point", () => {
    const { result } = simulator();

    act(() => result.current.step());
    act(() => result.current.reset());

    expect(result.current.runtime.stepCount).toBe(0);
    expect(result.current.runtime.activeStates).toEqual(["S0"]);
  });

  it("reset accepts a different program and word", () => {
    const { result } = simulator();

    act(() =>
      result.current.reset({
        program: defaultDFAProgram,
        inputWord: ["b", "a", "b"],
      }),
    );

    expect(result.current.runtime.inputWord).toEqual(["b", "a", "b"]);
    expect(result.current.runtime.stepCount).toBe(0);
  });

  it("re-initialises when the input word prop changes", () => {
    const { result, rerender } = simulator();

    act(() => result.current.step());
    rerender({ p: defaultDFAProgram, w: "bb" });

    expect(result.current.runtime.inputWord).toEqual(["b", "b"]);
    expect(result.current.runtime.stepCount).toBe(0);
  });
});

describe("useFASimulator — playback controls", () => {
  it("exposes a speed that can be changed", () => {
    const { result } = simulator();
    const initialSpeed = result.current.speed;

    act(() => result.current.setSpeed(initialSpeed * 2));

    expect(result.current.speed).toBe(initialSpeed * 2);
  });

  it("pausing an idle simulation is harmless", () => {
    const { result } = simulator();

    act(() => result.current.pause());

    expect(result.current.runtime.stepCount).toBe(0);
  });

  it("tracks the number of steps taken", () => {
    const { result } = simulator();

    act(() => result.current.step());

    expect(result.current.totalSteps).toBe(1);
  });
});

describe("useFASimulator — invalid programs", () => {
  it("refuses to initialise on a structurally invalid program", () => {
    const broken: FAProgram = {
      ...defaultDFAProgram,
      startState: "nowhere",
    };

    // The editor gates "Start Simulation" on `editor.isValid`, so this guard is
    // the last line of defence rather than a path the UI can reach.
    expect(() => simulator(broken, "a")).toThrow(/start_state_missing/);
  });

  it("names every issue it found", () => {
    const broken: FAProgram = {
      ...defaultDFAProgram,
      alphabet: [],
      startState: "nowhere",
    };

    expect(() => simulator(broken, "a")).toThrow(
      /start_state_missing.*alphabet_empty/,
    );
  });
});
