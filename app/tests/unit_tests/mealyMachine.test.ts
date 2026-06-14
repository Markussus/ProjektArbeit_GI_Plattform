import { describe, expect, it } from "vitest";
import { defaultMealyProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMealyProgram";
import { buildMealyConversion } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mealyConversion";
import { MealyMachineSimulator } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mealyMachine";

describe("MealyMachineSimulator", () => {
  it("produces one output for every processed transition", () => {
    const simulator = new MealyMachineSimulator();
    simulator.initialize(defaultMealyProgram);
    while (!simulator.isFinished()) simulator.step();
    expect(simulator.getCurrentState().outputSymbols.join("")).toBe("abcabb");
  });

  it("builds output rows from state and input bits", () => {
    const conversion = buildMealyConversion(defaultMealyProgram);
    expect(conversion.output.inputVariables).toEqual(["E0"]);
    expect(conversion.output.rows).toHaveLength(
      defaultMealyProgram.states.length *
        defaultMealyProgram.inputSymbols.length,
    );
    expect(
      conversion.output.formulas.every((formula) =>
        formula.variables.includes("E0"),
      ),
    ).toBe(true);
  });
});
