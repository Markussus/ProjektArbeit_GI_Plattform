import { describe, expect, it } from "vitest";
import { defaultMooreProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMooreProgram";
import { buildMooreConversion } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mooreConversion";

describe("Moore circuit conversion", () => {
  it("builds grouped transition rows from state and input codes", () => {
    const conversion = buildMooreConversion(defaultMooreProgram);

    expect(conversion.transition.stateVariables).toEqual(["S0", "S1"]);
    expect(conversion.transition.inputVariables).toEqual(["E0"]);
    expect(conversion.transition.targetVariables).toEqual(["T0", "T1"]);
    expect(conversion.transition.rows).toHaveLength(8);
    expect(conversion.transition.rows[0]).toEqual({
      currentState: "HALT",
      inputSymbol: "0",
      nextState: "READY",
      currentBits: [0, 0],
      inputBits: [0],
      resultBits: [0, 1],
    });
  });

  it("reproduces the lecture output functions for the traffic-light codes", () => {
    const conversion = buildMooreConversion(defaultMooreProgram);
    const formulas = Object.fromEntries(
      conversion.output.formulas.map((formula) => [
        formula.name,
        formula.minimal,
      ]),
    );

    expect(conversion.output.outputVariables).toEqual(["y0", "y1", "y2"]);
    expect(formulas).toEqual({
      y0: "¬S0",
      y1: "S1",
      y2: "S0 ∧ ¬S1",
    });
  });

  it("uses enough output bits for the largest assigned output code", () => {
    const conversion = buildMooreConversion({
      ...defaultMooreProgram,
      outputs: {
        ...defaultMooreProgram.outputs,
        WAIT: { symbol: "large", code: 15 },
      },
    });

    expect(conversion.output.outputVariables).toEqual(["y0", "y1", "y2", "y3"]);
    expect(conversion.output.rows.at(-1)?.resultBits).toEqual([1, 1, 1, 1]);
  });
});
