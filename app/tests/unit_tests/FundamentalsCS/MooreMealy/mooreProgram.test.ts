import { describe, expect, it } from "vitest";
import { defaultMooreProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMooreProgram";
import {
  formatInternalNumber,
  getNextMooreOutputCode,
  normalizeMooreProgram,
  parseInternalNumber,
  renameMooreInputSymbol,
  renameMooreState,
  validateMooreProgram,
} from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mooreProgram";

describe("Moore program operations", () => {
  it("uses one consistent internal code per output symbol", () => {
    const invalid = structuredClone(defaultMooreProgram);
    invalid.outputs.READY = {
      symbol: invalid.outputs.HALT.symbol,
      code: invalid.outputs.HALT.code + 1,
    };

    expect(validateMooreProgram(invalid)).toContain("outputs_invalid");
  });

  it("normalizes names and transitions for trimmed entries", () => {
    const draft = structuredClone(defaultMooreProgram);
    draft.states[0] = " HALT ";
    const normalized = normalizeMooreProgram(draft);
    expect(normalized.states[0]).toBe("HALT");
    expect(normalized.outputs.HALT).toBeDefined();
  });

  it("derives the next output code from the smallest unused code", () => {
    expect(getNextMooreOutputCode(defaultMooreProgram)).toBe(0);
    const withZero = structuredClone(defaultMooreProgram);
    withZero.outputs.HALT.code = 0;
    expect(getNextMooreOutputCode(withZero)).toBe(3);
  });

  it("formats and parses the same internal value in decimal and binary", () => {
    expect(formatInternalNumber(7, "decimal")).toBe("7");
    expect(formatInternalNumber(7, "binary")).toBe("111");
    expect(parseInternalNumber("111", "binary")).toBe(7);
    expect(parseInternalNumber("102", "binary")).toBeNull();
  });

  it("renames a state without losing its state output or transition targets", () => {
    const renamed = renameMooreState(defaultMooreProgram, "HALT", " STOP ");

    expect(renamed).not.toBeNull();
    expect(renamed?.initialState).toBe("STOP");
    expect(renamed?.outputs.STOP).toEqual(defaultMooreProgram.outputs.HALT);
    expect(
      renamed?.inputSymbols.every((input) =>
        renamed.states.every((state) =>
          renamed.states.includes(renamed.transitions[input][state]),
        ),
      ),
    ).toBe(true);
  });

  it("renames an input symbol in transitions and the input word", () => {
    const renamed = renameMooreInputSymbol(defaultMooreProgram, "0", " LOW ");

    expect(renamed).not.toBeNull();
    expect(renamed?.inputSymbols).toContain("LOW");
    expect(renamed?.inputSymbols).not.toContain("0");
    expect(renamed?.inputWord).toEqual(["LOW", "1", "LOW", "1"]);
    expect(renamed?.transitions.LOW).toBeDefined();
    expect(renamed?.transitions["0"]).toBeUndefined();
  });
});
