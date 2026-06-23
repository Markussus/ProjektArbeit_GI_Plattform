import { describe, expect, it } from "vitest";
import {
  evaluateBooleanExpression,
  type VariableAssignment,
} from "@/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/booleanExpression";
import { countExpressionLiterals } from "@/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/factorMinimalDnf";
import { defaultMooreProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMooreProgram";
import {
  buildFormulas,
  buildMooreConversion,
  toBits,
} from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mooreConversion";

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

  it("keeps a gate expression when exact minimization exceeds the variable limit", () => {
    const states = Array.from({ length: 17 }, (_, index) => `S${index}`);
    const inputSymbols = Array.from({ length: 16 }, (_, index) => `E${index}`);
    const conversion = buildMooreConversion({
      states,
      inputSymbols,
      transitions: Object.fromEntries(
        inputSymbols.map((symbol, inputIndex) => [
          symbol,
          Object.fromEntries(
            states.map((state, stateIndex) => [
              state,
              states[(stateIndex + inputIndex + 1) % states.length],
            ]),
          ),
        ]),
      ),
      outputs: Object.fromEntries(
        states.map((state, index) => [
          state,
          { symbol: `OUT_${index}`, code: index },
        ]),
      ),
      initialState: states[0],
      inputWord: [],
      representation: "decimal",
    });

    expect(conversion.transition.stateVariables).toHaveLength(5);
    expect(conversion.transition.inputVariables).toHaveLength(4);
    expect(conversion.transition.formulas[3]).toMatchObject({
      name: "T3",
      minimizationAvailable: false,
    });
    expect(conversion.transition.formulas[3].expression).not.toBeNull();
  });

  it("uses the exact global optimizer for Moore/Mealy formulas up to four variables", () => {
    const variables = ["S0", "S1", "E0", "E1"];
    const rows = Array.from({ length: 16 }, (_, rowIndex) => {
      const bits = toBits(rowIndex, 4);
      const result =
        (bits[0] === 1 || bits[1] === 1) &&
        (bits[2] === 1 || bits[3] === 1);

      return {
        currentState: `q${rowIndex}`,
        currentBits: bits.slice(0, 2),
        inputBits: bits.slice(2),
        resultBits: [result ? 1 : 0],
      };
    });

    const [formula] = buildFormulas(["T0"], variables, rows);

    expect(formula.expression).not.toBeNull();
    expect(countExpressionLiterals(formula.expression!)).toBe(4);

    for (const row of rows) {
      const bits = [...row.currentBits, ...row.inputBits];
      const assignment = variables.reduce<VariableAssignment>(
        (values, variable, index) => ({
          ...values,
          [variable]: bits[index] === 1,
        }),
        {},
      );

      expect(evaluateBooleanExpression(formula.expression!, assignment)).toBe(
        row.resultBits[0] === 1,
      );
    }
  });
});
