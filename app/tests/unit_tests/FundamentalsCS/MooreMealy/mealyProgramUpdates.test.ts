import { describe, expect, it } from "vitest";
import {
  addMealyInputSymbol,
  addMealyState,
  removeMealyInputSymbol,
  removeMealyState,
  renameMealyInputSymbol,
  renameMealyState,
  setMealyOutput,
  setMealyTransition,
} from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mealyProgramUpdates";
import { defaultMealyProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMealyProgram";
import { emptyMealyProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/emptyMealyProgram";

describe("mealyProgramUpdates", () => {
  it("adds and removes states", () => {
    const { nextProgram, stateName } = addMealyState(defaultMealyProgram);
    expect(stateName).toBe("STATE_2");
    expect(nextProgram.states).toContain("STATE_2");
    expect(nextProgram.transitions["0"].STATE_2).toBe(
      defaultMealyProgram.initialState,
    );
    expect(nextProgram.outputs["0"].STATE_2).toBeDefined();

    const withCustom = addMealyState(nextProgram, "S_CUSTOM");
    expect(withCustom.stateName).toBe("S_CUSTOM");

    const removed = removeMealyState(withCustom.nextProgram, "S_CUSTOM");
    expect(removed.states).not.toContain("S_CUSTOM");

    // Boundary checks
    expect(
      removeMealyState(emptyMealyProgram, emptyMealyProgram.states[0]),
    ).toEqual(emptyMealyProgram);
    expect(removeMealyState(defaultMealyProgram, "NON_EXISTENT")).toEqual(
      defaultMealyProgram,
    );
  });

  it("renames states and remaps all transitions and outputs", () => {
    const renamed = renameMealyState(defaultMealyProgram, "S0", "S_START");
    expect(renamed).not.toBeNull();
    expect(renamed!.states).toContain("S_START");
    expect(renamed!.states).not.toContain("S0");
    expect(renamed!.initialState).toBe("S_START");
    expect(renamed!.transitions["0"].S_START).toBeDefined();
    expect(renamed!.outputs["0"].S_START).toBeDefined();

    // Invalid renames
    expect(renameMealyState(defaultMealyProgram, "S0", "")).toBeNull();
    expect(renameMealyState(defaultMealyProgram, "S0", "S1")).toBeNull();
    expect(
      renameMealyState(defaultMealyProgram, "S0", "a".repeat(150)),
    ).toBeNull();
  });

  it("adds, removes, and renames input symbols", () => {
    const added = addMealyInputSymbol(defaultMealyProgram);
    expect(added.inputSymbols).toContain("10");
    expect(added.transitions["10"]).toBeDefined();
    expect(added.outputs["10"]).toBeDefined();

    const removed = removeMealyInputSymbol(defaultMealyProgram, "0");
    expect(removed.inputSymbols).not.toContain("0");
    expect(removed.transitions["0"]).toBeUndefined();

    const renamed = renameMealyInputSymbol(defaultMealyProgram, "0", "zero");
    expect(renamed).not.toBeNull();
    expect(renamed!.inputSymbols).toContain("zero");
    expect(renamed!.inputSymbols).not.toContain("0");

    // Invalid rename
    expect(renameMealyInputSymbol(defaultMealyProgram, "0", "1")).toBeNull();
    expect(renameMealyInputSymbol(defaultMealyProgram, "0", "")).toBeNull();
  });

  it("sets Mealy transitions and outputs", () => {
    const withTrans = setMealyTransition(defaultMealyProgram, "0", "S0", "S1");
    expect(withTrans.transitions["0"].S0).toBe("S1");

    const withOut = setMealyOutput(defaultMealyProgram, "0", "S0", {
      symbol: "OUT_SPECIAL",
      code: 99,
    });
    expect(withOut.outputs["0"].S0.symbol).toBe("OUT_SPECIAL");
    expect(withOut.outputs["0"].S0.code).toBe(99);
  });
});
