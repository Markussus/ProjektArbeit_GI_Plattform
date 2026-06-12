import { describe, expect, it } from "vitest";
import { defaultMooreProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMooreProgram";
import { MooreMachineSimulator } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mooreMachine";

describe("Moore machine simulator", () => {
  it("emits the start-state output before consuming the first symbol", () => {
    const simulator = new MooreMachineSimulator();
    simulator.initialize(defaultMooreProgram);

    expect(simulator.getCurrentState()).toMatchObject({
      currentState: "HALT",
      inputPosition: 0,
      outputSymbols: ["4"],
      stepCount: 0,
    });

    simulator.step();

    expect(simulator.getCurrentState()).toMatchObject({
      currentState: "READY",
      inputPosition: 1,
      outputSymbols: ["4", "6"],
      stepCount: 1,
    });
  });

  it("treats multi-character input symbols as atomic values", () => {
    const simulator = new MooreMachineSimulator();
    simulator.initialize({
      states: ["CLOSED", "OPEN"],
      inputSymbols: ["110", "111"],
      transitions: {
        "110": { CLOSED: "OPEN", OPEN: "OPEN" },
        "111": { CLOSED: "CLOSED", OPEN: "CLOSED" },
      },
      outputs: {
        CLOSED: { symbol: "locked", code: 0 },
        OPEN: { symbol: "unlocked", code: 1 },
      },
      initialState: "CLOSED",
      inputWord: ["110", "111"],
      representation: "binary",
    });

    simulator.step();
    expect(simulator.getCurrentState().currentState).toBe("OPEN");
    simulator.step();

    expect(simulator.getCurrentState()).toMatchObject({
      currentState: "CLOSED",
      inputPosition: 2,
      outputSymbols: ["locked", "unlocked", "locked"],
      halted: true,
    });
  });

  it("restores the previous state on step back", () => {
    const simulator = new MooreMachineSimulator();
    simulator.initialize(defaultMooreProgram);
    simulator.step();
    simulator.stepBack();

    expect(simulator.getCurrentState()).toMatchObject({
      currentState: "HALT",
      inputPosition: 0,
      outputSymbols: ["4"],
      stepCount: 0,
      halted: false,
    });
  });
});
