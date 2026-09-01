import { describe, expect, it } from "vitest";
import {
  addMealyInputSymbol,
  addMealyState,
  changeMealyOutputCode,
  findMealyOutputCodeBySymbol,
  removeMealyInputSymbol,
  removeMealyState,
  renameMealyInputSymbol,
  renameMealyOutputSymbol,
  renameMealyState,
  setMealyOutput,
  setMealyTransition,
} from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mealyProgramUpdates";
import { defaultMealyProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMealyProgram";
import { emptyMealyProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/emptyMealyProgram";

describe("mealyProgramUpdates", () => {
  it("adds and removes states", () => {
    const { nextProgram, stateName } = addMealyState(defaultMealyProgram);
    expect(stateName).toBe("STATE_3");
    expect(nextProgram.states).toContain("STATE_3");
    expect(nextProgram.transitions["0"].STATE_3).toBe(
      defaultMealyProgram.initialState,
    );
    expect(nextProgram.outputs["0"].STATE_3).toBeDefined();

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
    const renamed = renameMealyState(defaultMealyProgram, "START", "S_START");
    expect(renamed).not.toBeNull();
    expect(renamed!.states).toContain("S_START");
    expect(renamed!.states).not.toContain("START");
    expect(renamed!.initialState).toBe("S_START");
    expect(renamed!.transitions["0"].S_START).toBeDefined();
    expect(renamed!.outputs["0"].S_START).toBeDefined();

    // Invalid renames
    expect(renameMealyState(defaultMealyProgram, "START", "")).toBeNull();
    expect(renameMealyState(defaultMealyProgram, "START", "SEEN_1")).toBeNull();
    expect(
      renameMealyState(defaultMealyProgram, "START", "a".repeat(150)),
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
    const withTrans = setMealyTransition(
      defaultMealyProgram,
      "0",
      "START",
      "SEEN_1",
    );
    expect(withTrans.transitions["0"].START).toBe("SEEN_1");

    const withOut = setMealyOutput(defaultMealyProgram, "0", "START", {
      symbol: "OUT_SPECIAL",
      code: 99,
    });
    expect(withOut.outputs["0"].START.symbol).toBe("OUT_SPECIAL");
    expect(withOut.outputs["0"].START.code).toBe(99);
  });

  it("finds and renames output symbols consistently", () => {
    expect(findMealyOutputCodeBySymbol(defaultMealyProgram, "MATCH_101")).toBe(
      1,
    );
    expect(
      findMealyOutputCodeBySymbol(defaultMealyProgram, "UNKNOWN"),
    ).toBeUndefined();

    const renamed = renameMealyOutputSymbol(
      defaultMealyProgram,
      "NO_MATCH",
      "MATCH_101",
    );
    expect(renamed).not.toBeNull();
    expect(renamed!.outputs["0"].START).toEqual({
      symbol: "MATCH_101",
      code: 1,
    });
    expect(defaultMealyProgram.outputs["0"].START.symbol).toBe("NO_MATCH");

    expect(
      renameMealyOutputSymbol(defaultMealyProgram, "NO_MATCH", ""),
    ).toBeNull();
    expect(
      renameMealyOutputSymbol(defaultMealyProgram, "NO_MATCH", "x".repeat(129)),
    ).toBeNull();
    expect(
      renameMealyOutputSymbol(defaultMealyProgram, "NO_MATCH", "NO_MATCH"),
    ).toBe(defaultMealyProgram);
  });

  it("changes output codes and swaps colliding symbols", () => {
    const changed = changeMealyOutputCode(defaultMealyProgram, "0", "START", 1);

    expect(changed.outputs["0"].START.code).toBe(1);
    expect(changed.outputs["1"].SEEN_10.code).toBe(0);
    expect(defaultMealyProgram.outputs["0"].START.code).toBe(0);
    expect(changeMealyOutputCode(defaultMealyProgram, "0", "START", 0)).toBe(
      defaultMealyProgram,
    );
  });

  it("handles sparse programs without inventing invalid table assumptions", () => {
    const sparseProgram = {
      ...emptyMealyProgram,
      states: ["STATE_0", "STATE_1"],
      inputSymbols: ["x"],
      inputWord: ["x"],
      transitions: {},
      outputs: {},
    };

    expect(addMealyState(sparseProgram, "STATE_1").nextProgram).toBe(
      sparseProgram,
    );

    const withState = addMealyState(sparseProgram, "STATE_2").nextProgram;
    expect(withState.transitions.x.STATE_2).toBe("STATE_0");
    expect(withState.outputs.x.STATE_2).toEqual({
      symbol: "OUT_2",
      code: 2,
    });

    const withoutInitialState = removeMealyState(withState, "STATE_0");
    expect(withoutInitialState.initialState).toBe("STATE_1");

    const sameStateName = renameMealyState(
      withoutInitialState,
      "STATE_1",
      "STATE_1",
    );
    expect(sameStateName?.states).toContain("STATE_1");

    const withInput = addMealyInputSymbol(emptyMealyProgram);
    expect(withInput.outputs["0"].STATE_0).toEqual({
      symbol: "OUT_0_0",
      code: 0,
    });

    const sameInputName = renameMealyInputSymbol(withState, "x", "x");
    expect(sameInputName?.inputSymbols).toEqual(["x"]);

    expect(
      setMealyTransition(emptyMealyProgram, "x", "STATE_0", "STATE_0"),
    ).toHaveProperty("transitions.x.STATE_0", "STATE_0");
    expect(
      setMealyOutput(emptyMealyProgram, "x", "STATE_0", undefined),
    ).toHaveProperty("outputs.x.STATE_0", { symbol: "", code: 0 });
  });

  it("changes missing and non-colliding outputs predictably", () => {
    const missingOutput = changeMealyOutputCode(
      emptyMealyProgram,
      "x",
      "STATE_0",
      7,
    );
    expect(missingOutput.outputs.x.STATE_0).toEqual({ symbol: "", code: 7 });

    const changedWithoutCollision = changeMealyOutputCode(
      defaultMealyProgram,
      "0",
      "START",
      99,
    );
    expect(changedWithoutCollision.outputs["0"].START.code).toBe(99);
    expect(changedWithoutCollision.outputs["1"].SEEN_10.code).toBe(1);

    const renamedMissingSymbol = renameMealyOutputSymbol(
      defaultMealyProgram,
      "UNKNOWN",
      "NEW_OUTPUT",
    );
    expect(renamedMissingSymbol).toEqual(defaultMealyProgram);
    expect(renamedMissingSymbol).not.toBe(defaultMealyProgram);
  });

  it("does not treat an incomplete empty output symbol as a collision", () => {
    const programWithIncompleteOutput = {
      ...defaultMealyProgram,
      outputs: {
        ...defaultMealyProgram.outputs,
        "1": {
          ...defaultMealyProgram.outputs["1"],
          SEEN_10: { symbol: "", code: 7 },
        },
      },
    };

    const changed = changeMealyOutputCode(
      programWithIncompleteOutput,
      "0",
      "START",
      7,
    );

    expect(changed.outputs["0"].START.code).toBe(7);
    expect(changed.outputs["1"].SEEN_10.code).toBe(7);
  });
});
