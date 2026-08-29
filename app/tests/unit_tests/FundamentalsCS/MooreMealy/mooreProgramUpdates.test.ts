import { describe, expect, it } from "vitest";
import {
  addMooreInputSymbol,
  addMooreState,
  createMooreOutputSymbol,
  getNextMooreOutputCode,
  removeMooreInputSymbol,
  removeMooreState,
  renameMooreInputSymbol,
  renameMooreState,
  setMooreOutputCode,
  setMooreOutputSymbol,
  setMooreTransition,
} from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mooreProgramUpdates";
import { defaultMooreProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMooreProgram";
import { emptyMooreProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/emptyMooreProgram";

describe("mooreProgramUpdates", () => {
  it("adds states with unique names and default outputs", () => {
    const { nextProgram, stateName } = addMooreState(defaultMooreProgram);
    expect(stateName).toBe("STATE_4");
    expect(nextProgram.states).toContain("STATE_4");
    expect(nextProgram.outputs.STATE_4).toBeDefined();
    expect(nextProgram.transitions["0"].STATE_4).toBe(
      defaultMooreProgram.initialState,
    );

    // Custom name
    const res2 = addMooreState(nextProgram, "CUSTOM_S");
    expect(res2.stateName).toBe("CUSTOM_S");
    expect(res2.nextProgram.states).toContain("CUSTOM_S");

    // Existing name does not duplicate
    const res3 = addMooreState(res2.nextProgram, "CUSTOM_S");
    expect(res3.nextProgram.states.length).toBe(res2.nextProgram.states.length);
  });

  it("removes states safely with fallback remapping", () => {
    const reduced = removeMooreState(defaultMooreProgram, "WAIT");
    expect(reduced.states).not.toContain("WAIT");
    expect(reduced.outputs.WAIT).toBeUndefined();

    // Removing non-existent or single state does nothing harmful
    expect(removeMooreState(defaultMooreProgram, "NON_EXISTENT")).toEqual(
      defaultMooreProgram,
    );
    expect(
      removeMooreState(emptyMooreProgram, emptyMooreProgram.states[0]),
    ).toEqual(emptyMooreProgram);
  });

  it("renames states and remaps transitions and outputs", () => {
    const renamed = renameMooreState(
      defaultMooreProgram,
      "HALT",
      "HALT_RENAMED",
    );
    expect(renamed).not.toBeNull();
    expect(renamed!.states).toContain("HALT_RENAMED");
    expect(renamed!.states).not.toContain("HALT");
    expect(renamed!.outputs.HALT_RENAMED).toBeDefined();
    expect(renamed!.outputs.HALT).toBeUndefined();
    expect(renamed!.initialState).toBe("HALT_RENAMED");

    // Invalid renames return null
    expect(renameMooreState(defaultMooreProgram, "HALT", "")).toBeNull();
    expect(renameMooreState(defaultMooreProgram, "HALT", "READY")).toBeNull();
    expect(
      renameMooreState(defaultMooreProgram, "HALT", "a".repeat(150)),
    ).toBeNull();
  });

  it("adds and removes input symbols", () => {
    const withInput = addMooreInputSymbol(defaultMooreProgram);
    expect(withInput.inputSymbols).toContain("10");
    expect(withInput.transitions["10"]).toBeDefined();

    const withoutInput = removeMooreInputSymbol(defaultMooreProgram, "0");
    expect(withoutInput.inputSymbols).not.toContain("0");
    expect(withoutInput.transitions["0"]).toBeUndefined();
  });

  it("renames input symbols and preserves transitions and word occurrences", () => {
    const renamed = renameMooreInputSymbol(defaultMooreProgram, "0", "x");
    expect(renamed).not.toBeNull();
    expect(renamed!.inputSymbols).toContain("x");
    expect(renamed!.inputSymbols).not.toContain("0");
    expect(renamed!.transitions.x).toBeDefined();
    expect(renamed!.transitions["0"]).toBeUndefined();

    // Invalid rename returns null
    expect(renameMooreInputSymbol(defaultMooreProgram, "0", "1")).toBeNull();
    expect(renameMooreInputSymbol(defaultMooreProgram, "0", "")).toBeNull();
  });

  it("sets transition and output values", () => {
    const mutated = setMooreTransition(
      defaultMooreProgram,
      "0",
      "HALT",
      "READY",
    );
    expect(mutated.transitions["0"].HALT).toBe("READY");

    const withOutSym = setMooreOutputSymbol(
      defaultMooreProgram,
      "HALT",
      "NEW_OUT",
    );
    expect(withOutSym.outputs.HALT.symbol).toBe("NEW_OUT");

    const withOutCode = setMooreOutputCode(defaultMooreProgram, "HALT", 42);
    expect(withOutCode.outputs.HALT.code).toBe(42);

    const withCreatedOut = createMooreOutputSymbol(
      defaultMooreProgram,
      "HALT",
      "CUSTOM_OUT",
    );
    expect(withCreatedOut.outputs.HALT.symbol).toBe("CUSTOM_OUT");
  });

  it("calculates next Moore output code correctly", () => {
    const code = getNextMooreOutputCode(defaultMooreProgram);
    expect(code).toBeGreaterThanOrEqual(0);
  });
});
