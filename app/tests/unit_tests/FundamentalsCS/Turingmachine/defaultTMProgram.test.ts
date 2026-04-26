import { describe, expect, it } from "vitest";

import { defaultTMProgram } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/config/defaultTMProgram";
import { validateTMProgram } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmProgramValidation";
import { DEFAULT_BLANK_SYMBOL } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmTypes";

describe("defaultTMProgram", () => {
  // Tests that the shipped default program is internally valid and ready for the simulator without editor repairs.
  it("is a valid Turing machine program", () => {
    expect(validateTMProgram(defaultTMProgram)).toEqual([]);
  });

  // Tests that the default program derives its input alphabet from the configured initial tape and keeps the expected blank symbol.
  it("contains the expected derived alphabet and blank symbol", () => {
    expect(defaultTMProgram.inputAlphabet).toEqual(["1", "0"]);
    expect(defaultTMProgram.blankSymbol).toBe(DEFAULT_BLANK_SYMBOL);
  });
});
