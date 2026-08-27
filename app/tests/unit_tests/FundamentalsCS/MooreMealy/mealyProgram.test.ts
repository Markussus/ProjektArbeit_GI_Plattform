import { describe, expect, it } from "vitest";
import { defaultMealyProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMealyProgram";
import {
  normalizeMealyProgram,
  renameMealyInput,
  renameMealyState,
  validateMealyProgram,
} from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mealyProgram";

describe("Mealy program operations", () => {
  it("validates all state × input transitions and outputs", () => {
    const invalid = structuredClone(defaultMealyProgram);
    delete invalid.outputs["0"].S0;
    invalid.transitions["1"].S1 = "UNKNOWN";

    expect(validateMealyProgram(invalid)).toEqual(
      expect.arrayContaining(["transitions_invalid", "outputs_invalid"]),
    );
  });

  it("normalizes names and completes missing editor cells", () => {
    const draft = structuredClone(defaultMealyProgram);
    draft.states[0] = " S0 ";
    draft.inputSymbols[0] = " 0 ";
    delete draft.transitions["0"].S1;
    delete draft.outputs["0"].S1;

    const normalized = normalizeMealyProgram(draft);

    expect(normalized.states[0]).toBe("S0");
    expect(normalized.inputSymbols[0]).toBe("0");
    expect(normalized.transitions["0"].S1).toBe("");
    expect(normalized.outputs["0"].S1).toEqual({ symbol: "", code: 0 });
  });

  it("renames states in transitions, outputs, targets, and the initial state", () => {
    const renamed = renameMealyState(defaultMealyProgram, "S0", " READY ");

    expect(renamed).not.toBeNull();
    expect(renamed?.states).toContain("READY");
    expect(renamed?.initialState).toBe("READY");
    expect(renamed?.outputs["0"].READY).toEqual(
      defaultMealyProgram.outputs["0"].S0,
    );
    expect(
      renamed?.inputSymbols.every((input) =>
        renamed.states.every((state) =>
          renamed.states.includes(renamed.transitions[input][state]),
        ),
      ),
    ).toBe(true);
  });

  it("renames inputs in tables and the tokenized input word", () => {
    const renamed = renameMealyInput(defaultMealyProgram, "0", " LOW ");

    expect(renamed).not.toBeNull();
    expect(renamed?.inputSymbols).toContain("LOW");
    expect(renamed?.transitions.LOW).toEqual(
      defaultMealyProgram.transitions["0"],
    );
    expect(renamed?.outputs.LOW).toEqual(defaultMealyProgram.outputs["0"]);
    expect(renamed?.inputWord).not.toContain("0");
  });
});
