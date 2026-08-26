import { describe, expect, it } from "vitest";
import { defaultMealyProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMealyProgram";
import { mealyProgramTransferCodec } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mealyProgramTransfer";

describe("Mealy program transfer codec", () => {
  it("round-trips transitions, transition outputs, and representation", async () => {
    const program = {
      ...structuredClone(defaultMealyProgram),
      representation: "binary" as const,
    };

    const exported = await mealyProgramTransferCodec.exportValue(program);
    const imported = await mealyProgramTransferCodec.importValue(exported);

    expect(exported).toMatch(/^[A-Za-z0-9_-]+$/u);
    expect(imported).toEqual(program);
  });

  it("rejects malformed payloads", async () => {
    await expect(
      mealyProgramTransferCodec.importValue("not.valid"),
    ).rejects.toThrow("invalid_mealy");
  });
});
