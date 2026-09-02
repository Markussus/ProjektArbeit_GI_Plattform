import { describe, expect, test } from "vitest";
import {
  nsTransferCodec,
  type NumberSystemState,
} from "@/pages/FundamentalsCS/NumberSystems/components/simulator/nsTransferCodec.ts";

describe("nsTransferCodec.exportValue", () => {
  test("exports integers mode correctly", async () => {
    const state: NumberSystemState = {
      activeMode: "integers",
      integers: { sourceBase: "dec", targetBase: "bin", inputValue: "1234" },
    };
    const result = await nsTransferCodec.exportValue(state);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);

    const decodedStr = decodeURIComponent(escape(atob(result)));
    expect(decodedStr).toBe("v1|i|d|b|1234");
  });

  test("exports negative mode correctly", async () => {
    const state: NumberSystemState = {
      activeMode: "negative",
      negative: { activeMode: "twos", inputValue: "-42" },
    };
    const result = await nsTransferCodec.exportValue(state);
    const decodedStr = decodeURIComponent(escape(atob(result)));
    expect(decodedStr).toBe("v1|n|t|-42");
  });

  test("exports fractional mode correctly", async () => {
    const state: NumberSystemState = {
      activeMode: "fractional",
      fractional: { converterMode: "decToBin", inputValue: "10.56" },
    };
    const result = await nsTransferCodec.exportValue(state);
    const decodedStr = decodeURIComponent(escape(atob(result)));
    expect(decodedStr).toBe("v1|f|d|10.56");
  });

  test("exports ieee754 mode correctly", async () => {
    const state: NumberSystemState = {
      activeMode: "ieee754",
      ieee754: { converterMode: "decToIeee", inputValue: "-12.5" },
    };
    const result = await nsTransferCodec.exportValue(state);
    const decodedStr = decodeURIComponent(escape(atob(result)));
    expect(decodedStr).toBe("v1|e|d|-12.5");
  });

  test("exports arithmetic mode correctly", async () => {
    const state: NumberSystemState = {
      activeMode: "arithmetic",
      arithmetic: {
        activeSubMode: "multiplication",
        valA: "101",
        valB: "11",
      },
    };
    const result = await nsTransferCodec.exportValue(state);
    const decodedStr = decodeURIComponent(escape(atob(result)));
    expect(decodedStr).toBe("v1|a|m|101|11");
  });

  test("throws when encoding fails", async () => {
    const state: NumberSystemState = {
      activeMode: "integers",
      integers: {
        sourceBase: "dec",
        targetBase: "bin",
        inputValue: "\uD800",
      },
    };
    await expect(nsTransferCodec.exportValue(state)).rejects.toThrow(
      "Failed to export number systems state",
    );
  });
});
