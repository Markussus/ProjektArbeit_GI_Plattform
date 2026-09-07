import { describe, expect, it } from "vitest";
import { defaultMealyProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMealyProgram";
import {
  normalizeMealyProgram,
  renameMealyInput,
  renameMealyState,
  validateMealyProgram,
} from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mealyProgram";
import { MAX_COLLECTION_SIZE } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/programCommon";

describe("Mealy program operations", () => {
  it("validates all state × input transitions and outputs", () => {
    const invalid = structuredClone(defaultMealyProgram);
    delete invalid.outputs["0"].START;
    invalid.transitions["1"].SEEN_1 = "UNKNOWN";

    expect(validateMealyProgram(invalid)).toEqual(
      expect.arrayContaining(["transitions_invalid", "outputs_invalid"]),
    );
  });

  it("enforces collection limits on states and input symbols", () => {
    const tooManyStates = structuredClone(defaultMealyProgram);
    tooManyStates.states = Array.from(
      { length: MAX_COLLECTION_SIZE + 1 },
      (_, i) => `S_${i}`,
    );
    expect(validateMealyProgram(tooManyStates)).toContain("states_invalid");

    const tooManyInputs = structuredClone(defaultMealyProgram);
    tooManyInputs.inputSymbols = Array.from(
      { length: MAX_COLLECTION_SIZE + 1 },
      (_, i) => `I_${i}`,
    );
    expect(validateMealyProgram(tooManyInputs)).toContain(
      "input_symbols_invalid",
    );
  });

  it("normalizes names and completes missing editor cells", () => {
    const draft = structuredClone(defaultMealyProgram);
    draft.states[0] = " START ";
    draft.inputSymbols[0] = " 0 ";
    delete draft.transitions["0"].SEEN_1;
    delete draft.outputs["0"].SEEN_1;

    const normalized = normalizeMealyProgram(draft);

    expect(normalized.states[0]).toBe("START");
    expect(normalized.inputSymbols[0]).toBe("0");
    expect(normalized.transitions["0"].SEEN_1).toBe("");
    expect(normalized.outputs["0"].SEEN_1).toEqual({ symbol: "", code: 0 });
  });

  it("renames states in transitions, outputs, targets, and the initial state", () => {
    const renamed = renameMealyState(defaultMealyProgram, "START", " READY ");

    expect(renamed).not.toBeNull();
    expect(renamed?.states).toContain("READY");
    expect(renamed?.initialState).toBe("READY");
    expect(renamed?.outputs["0"].READY).toEqual(
      defaultMealyProgram.outputs["0"].START,
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
