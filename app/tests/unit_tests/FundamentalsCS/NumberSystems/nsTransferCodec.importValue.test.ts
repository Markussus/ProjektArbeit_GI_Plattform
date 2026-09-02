import { describe, expect, test } from "vitest";
import { nsTransferCodec } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/nsTransferCodec.ts";

function encode(raw: string): string {
  return btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

describe("nsTransferCodec.importValue", () => {
  test("imports integers mode correctly", async () => {
    const result = await nsTransferCodec.importValue(encode("v1|i|d|b|1234"));
    expect(result).toEqual({
      activeMode: "integers",
      integers: { sourceBase: "dec", targetBase: "bin", inputValue: "1234" },
    });
  });

  test("imports negative mode correctly", async () => {
    const result = await nsTransferCodec.importValue(encode("v1|n|t|-42"));
    expect(result).toEqual({
      activeMode: "negative",
      negative: { activeMode: "twos", inputValue: "-42" },
    });
  });

  test("imports fractional mode correctly", async () => {
    const result = await nsTransferCodec.importValue(encode("v1|f|d|10.56"));
    expect(result).toEqual({
      activeMode: "fractional",
      fractional: { converterMode: "decToBin", inputValue: "10.56" },
    });
  });

  test("imports ieee754 mode correctly", async () => {
    const result = await nsTransferCodec.importValue(encode("v1|e|i|0100"));
    expect(result).toEqual({
      activeMode: "ieee754",
      ieee754: { converterMode: "ieeeToDec", inputValue: "0100" },
    });
  });

  test("imports arithmetic mode correctly", async () => {
    const result = await nsTransferCodec.importValue(encode("v1|a|m|101|11"));
    expect(result).toEqual({
      activeMode: "arithmetic",
      arithmetic: {
        activeSubMode: "multiplication",
        valA: "101",
        valB: "11",
      },
    });
  });

  test("falls back to defaults for unknown mode characters", async () => {
    const result = await nsTransferCodec.importValue(encode("v1|i|x|y|1234"));
    expect(result).toEqual({
      activeMode: "integers",
      integers: { sourceBase: "dec", targetBase: "bin", inputValue: "1234" },
    });
  });

  test("handles short payloads gracefully", async () => {
    const result = await nsTransferCodec.importValue(encode("v1|n"));
    expect(result).toEqual({
      activeMode: "negative",
    });
  });

  test("handles URL-safe base64 conversion", async () => {
    const rawStr = "v1|f|d|0.5+0/5";
    const normalB64 = btoa(unescape(encodeURIComponent(rawStr)));
    const urlSafeB64 = normalB64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const result = await nsTransferCodec.importValue(urlSafeB64);
    expect(result.activeMode).toBe("fractional");
    expect(result.fractional?.inputValue).toBe("0.5+0/5");
  });

  test("throws an error for invalid version", async () => {
    const invalidVersion = btoa(unescape(encodeURIComponent("v2|i|d|b|1234")));
    await expect(nsTransferCodec.importValue(invalidVersion)).rejects.toThrow(
      "Failed to import number systems state",
    );
  });

  test("throws an error for invalid mode", async () => {
    await expect(
      nsTransferCodec.importValue(encode("v1|x|d|b|1234")),
    ).rejects.toThrow("Failed to import number systems state");
  });

  test("rejects obsolete JSON and prefixed payloads", async () => {
    const jsonPayload = btoa(JSON.stringify({ activeMode: "integers" }));
    await expect(nsTransferCodec.importValue(jsonPayload)).rejects.toThrow(
      "Failed to import number systems state",
    );
    await expect(
      nsTransferCodec.importValue("ADAdjF8aXxkfGJ8MTIzNA=="),
    ).rejects.toThrow("Failed to import number systems state");
  });

  test("throws an error for completely invalid strings", async () => {
    await expect(
      nsTransferCodec.importValue("invalid_string_not_base64!!!"),
    ).rejects.toThrow("Failed to import number systems state");
  });
});
