import { describe, expect, it } from "vitest";
import { defaultMealyProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMealyProgram";
import { buildMealyConversion } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/automataConversion";
import { MealyMachineSimulator } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mealyMachine";

describe("MealyMachineSimulator", () => {
  it("produces one source-state output for every processed transition", () => {
    const simulator = new MealyMachineSimulator();
    simulator.initialize(defaultMealyProgram);
    while (!simulator.isFinished()) simulator.step();

    expect(simulator.getCurrentState().outputSymbols).toEqual([
      "NO_MATCH",
      "NO_MATCH",
      "MATCH_101",
      "NO_MATCH",
      "NO_MATCH",
      "MATCH_101",
    ]);
    expect(simulator.getCurrentState().outputSymbols).toHaveLength(
      defaultMealyProgram.inputWord.length,
    );
  });

  it("restores the complete previous runtime on step back", () => {
    const simulator = new MealyMachineSimulator();
    simulator.initialize(defaultMealyProgram);
    simulator.step();
    simulator.stepBack();

    expect(simulator.getCurrentState()).toMatchObject({
      currentState: defaultMealyProgram.initialState,
      inputPosition: 0,
      outputSymbols: [],
      stepCount: 0,
      halted: false,
    });
  });

  it("builds transition and output rows from state and input bits", () => {
    const conversion = buildMealyConversion(defaultMealyProgram);

    expect(conversion.output.inputVariables).toEqual(["E0"]);
    expect(conversion.output.rows).toHaveLength(
      defaultMealyProgram.states.length *
        defaultMealyProgram.inputSymbols.length,
    );
    expect(conversion.output.rows[0]).toMatchObject({
      currentState: "START",
      inputSymbol: "0",
      outputSymbol: "NO_MATCH",
    });
    expect(
      conversion.output.formulas.every((formula) =>
        formula.variables.includes("E0"),
      ),
    ).toBe(true);
  });
});
