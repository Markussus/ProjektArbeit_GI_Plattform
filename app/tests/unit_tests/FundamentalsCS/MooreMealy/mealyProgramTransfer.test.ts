import { describe, expect, it } from "vitest";
import { defaultMealyProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/defaultMealyProgram";
import { emptyMealyProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/config/emptyMealyProgram";
import { mealyProgramTransferCodec } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mealyProgramTransfer";
import type { MealyProgram } from "@/pages/FundamentalsCS/MooreMealy/components/Simulator/domain/mealyTypes";

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

  it("keeps incomplete transition cells for editor autosave", async () => {
    const draft: MealyProgram = {
      ...structuredClone(defaultMealyProgram),
    };
    delete draft.transitions["0"].START;

    const exported = await mealyProgramTransferCodec.exportValue(draft);
    const imported = await mealyProgramTransferCodec.importValue(exported);

    expect(imported.transitions["0"].START).toBeUndefined();
  });

  it("round-trips the empty one-state editor program", async () => {
    const exported =
      await mealyProgramTransferCodec.exportValue(emptyMealyProgram);
    const imported = await mealyProgramTransferCodec.importValue(exported);

    expect(imported).toEqual(emptyMealyProgram);
  });

  it("round-trips repeated input for one state and one input symbol", async () => {
    const oneValueProgram: MealyProgram = {
      states: ["ONLY"],
      inputSymbols: ["tick"],
      transitions: { tick: { ONLY: "ONLY" } },
      outputs: { tick: { ONLY: { symbol: "ACTIVE", code: 1 } } },
      initialState: "ONLY",
      inputWord: ["tick", "tick"],
      representation: "binary",
    };

    const exported =
      await mealyProgramTransferCodec.exportValue(oneValueProgram);
    const imported = await mealyProgramTransferCodec.importValue(exported);

    expect(imported).toEqual(oneValueProgram);
  });

  it("rejects malformed payloads", async () => {
    await expect(
      mealyProgramTransferCodec.importValue("not.valid"),
    ).rejects.toThrow("mealy_transfer_payload_invalid");
  });
});
