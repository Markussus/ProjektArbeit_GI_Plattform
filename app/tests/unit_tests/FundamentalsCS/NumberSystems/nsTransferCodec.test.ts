import { describe, expect, test } from "vitest";
import {
  nsTransferCodec,
  type NumberSystemState,
} from "@/pages/FundamentalsCS/NumberSystems/components/simulator/nsTransferCodec.ts";

describe("nsTransferCodec", () => {
  describe("exportValue", () => {
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
  });

  describe("importValue", () => {
    test("imports integers mode correctly", async () => {
      // "v1|i|d|b|1234" -> djF8aXxkfGJ8MTIzNA
      const result = await nsTransferCodec.importValue("djF8aXxkfGJ8MTIzNA");
      expect(result).toEqual({
        activeMode: "integers",
        integers: { sourceBase: "dec", targetBase: "bin", inputValue: "1234" },
      });
    });

    test("imports arithmetic mode correctly", async () => {
      // "v1|a|m|101|11" -> djF8YXxtfDEwMXwxMQ
      const result = await nsTransferCodec.importValue("djF8YXxtfDEwMXwxMQ");
      expect(result).toEqual({
        activeMode: "arithmetic",
        arithmetic: {
          activeSubMode: "multiplication",
          valA: "101",
          valB: "11",
        },
      });
    });

    test("handles URL-safe base64 conversion", async () => {
      // If base64 has - and _ instead of + and /, it should handle it
      // Let's create a string with + and /
      const rawStr = "v1|f|d|0.5+0/5"; // Just a dummy input to force + or / in base64 if possible
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
      const invalidVersion = btoa(
        unescape(encodeURIComponent("v2|i|d|b|1234")),
      );
      await expect(nsTransferCodec.importValue(invalidVersion)).rejects.toThrow(
        "Failed to import number systems state",
      );
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
});
