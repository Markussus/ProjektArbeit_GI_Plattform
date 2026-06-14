import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";
import { normalizeMealyProgram, validateMealyProgram } from "./mealyProgram";
import type { MealyProgram } from "./mealyTypes";

export const mealyProgramTransferCodec: ISimulatorTransferCodec<MealyProgram> = {
  async exportValue(program) {
    if (validateMealyProgram(program).length) throw new Error("invalid_mealy");
    const bytes = new TextEncoder().encode(JSON.stringify(program));
    const compressed = new Uint8Array(
      await new Response(
        new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate")),
      ).arrayBuffer(),
    );
    let binary = "";
    for (const byte of compressed) binary += String.fromCharCode(byte);
    return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
  },
  async importValue(value) {
    try {
      const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(
        Math.ceil(value.length / 4) * 4,
        "=",
      );
      const binary = atob(padded);
      const compressed = Uint8Array.from(
        binary,
        (character) => character.charCodeAt(0),
      );
      const bytes = new Uint8Array(
        await new Response(
          new Blob([compressed])
            .stream()
            .pipeThrough(new DecompressionStream("deflate")),
        ).arrayBuffer(),
      );
      const program = normalizeMealyProgram(
        JSON.parse(new TextDecoder().decode(bytes)) as MealyProgram,
      );
      if (validateMealyProgram(program).length) throw new Error("invalid_mealy");
      return program;
    } catch {
      throw new Error("invalid_mealy");
    }
  },
};
