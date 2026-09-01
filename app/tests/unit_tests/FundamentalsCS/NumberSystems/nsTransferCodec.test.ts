import { describe, expect, test } from "vitest";
import {
  nsTransferCodec,
  type NumberSystemState,
} from "@/pages/FundamentalsCS/NumberSystems/components/simulator/nsTransferCodec.ts";
import {
  buildTransferString,
  decodeBase64UrlSafe,
  encodeBase64UrlSafe,
  parseArithmeticState,
  parseFractionalState,
  parseIEEE754State,
  parseIntegerState,
  parseNegativeState,
  parseNumberSystemState,
} from "@/pages/FundamentalsCS/NumberSystems/components/simulator/nsTransferCodecUtils.ts";

function encode(raw: string): string {
  return btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

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

  describe("importValue", () => {
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

  describe("nsTransferCodecUtils", () => {
    describe("encodeBase64UrlSafe / decodeBase64UrlSafe", () => {
      test("roundtrips a simple payload", () => {
        const raw = "v1|i|d|b|1234";
        const encoded = encodeBase64UrlSafe(raw);
        expect(encoded).not.toContain("+");
        expect(encoded).not.toContain("/");
        expect(encoded).not.toContain("=");
        expect(decodeBase64UrlSafe(encoded)).toBe(raw);
      });

      test("roundtrips characters that produce +, / and padding in standard base64", () => {
        const raw = "v1|f|d|<<<>>>???";
        const encoded = encodeBase64UrlSafe(raw);
        expect(decodeBase64UrlSafe(encoded)).toBe(raw);
      });
    });

    describe("parseIntegerState", () => {
      test("returns undefined for short payloads", () => {
        expect(parseIntegerState(["v1", "i"])).toBeUndefined();
        expect(parseIntegerState(["v1", "i", "d"])).toBeUndefined();
        expect(parseIntegerState(["v1", "i", "d", "b"])).toBeUndefined();
      });

      test("parses integer state and falls back to defaults", () => {
        expect(parseIntegerState(["v1", "i", "d", "b", "1234"])).toEqual({
          sourceBase: "dec",
          targetBase: "bin",
          inputValue: "1234",
        });
        expect(parseIntegerState(["v1", "i", "x", "y", "1234"])).toEqual({
          sourceBase: "dec",
          targetBase: "bin",
          inputValue: "1234",
        });
        expect(parseIntegerState(["v1", "i", "h", "o", "ff|extra"])).toEqual({
          sourceBase: "hex",
          targetBase: "oct",
          inputValue: "ff|extra",
        });
      });
    });

    describe("parseNegativeState", () => {
      test("returns undefined for short payloads", () => {
        expect(parseNegativeState(["v1", "n"])).toBeUndefined();
      });

      test("parses all negative modes and falls back to twos", () => {
        expect(parseNegativeState(["v1", "n", "t", "-5"])).toEqual({
          activeMode: "twos",
          inputValue: "-5",
        });
        expect(parseNegativeState(["v1", "n", "o", "-5"])).toEqual({
          activeMode: "ones",
          inputValue: "-5",
        });
        expect(parseNegativeState(["v1", "n", "s", "-5"])).toEqual({
          activeMode: "sign",
          inputValue: "-5",
        });
        expect(parseNegativeState(["v1", "n", "x", "-5"])).toEqual({
          activeMode: "twos",
          inputValue: "-5",
        });
      });
    });

    describe("parseFractionalState", () => {
      test("returns undefined for short payloads", () => {
        expect(parseFractionalState(["v1", "f"])).toBeUndefined();
      });

      test("parses both converter directions", () => {
        expect(parseFractionalState(["v1", "f", "d", "10.5"])).toEqual({
          converterMode: "decToBin",
          inputValue: "10.5",
        });
        expect(parseFractionalState(["v1", "f", "b", "101.1"])).toEqual({
          converterMode: "binToDec",
          inputValue: "101.1",
        });
      });
    });

    describe("parseIEEE754State", () => {
      test("returns undefined for short payloads", () => {
        expect(parseIEEE754State(["v1", "e"])).toBeUndefined();
      });

      test("parses both converter directions", () => {
        expect(parseIEEE754State(["v1", "e", "d", "-12.5"])).toEqual({
          converterMode: "decToIeee",
          inputValue: "-12.5",
        });
        expect(parseIEEE754State(["v1", "e", "i", "0100"])).toEqual({
          converterMode: "ieeeToDec",
          inputValue: "0100",
        });
      });
    });

    describe("parseArithmeticState", () => {
      test("returns undefined for short payloads", () => {
        expect(parseArithmeticState(["v1", "a"])).toBeUndefined();
        expect(parseArithmeticState(["v1", "a", "m"])).toBeUndefined();
        expect(parseArithmeticState(["v1", "a", "m", "101"])).toBeUndefined();
      });

      test("parses all arithmetic submodes and falls back to addition", () => {
        const modes: [string, string][] = [
          ["a", "addition"],
          ["s", "subtraction"],
          ["m", "multiplication"],
          ["d", "division"],
          ["h", "shifting"],
          ["c", "compare"],
        ];
        for (const [char, expectedMode] of modes) {
          expect(parseArithmeticState(["v1", "a", char, "101", "11"])).toEqual({
            activeSubMode: expectedMode,
            valA: "101",
            valB: "11",
          });
        }
        expect(parseArithmeticState(["v1", "a", "x", "101", "11"])).toEqual({
          activeSubMode: "addition",
          valA: "101",
          valB: "11",
        });
      });
    });

    describe("parseNumberSystemState", () => {
      test("rejects unsupported version", () => {
        expect(() => parseNumberSystemState(encode("v2|i|d|b|1234"))).toThrow(
          "Unsupported format version",
        );
      });

      test("rejects invalid mode character", () => {
        expect(() => parseNumberSystemState(encode("v1|x|d|b|1234"))).toThrow(
          "Invalid mode",
        );
      });

      test("produces only active substate per mode", () => {
        const result = parseNumberSystemState(encode("v1|i|d|b|1234"));
        expect(result.activeMode).toBe("integers");
        expect(result.integers).toBeDefined();
        expect(result.negative).toBeUndefined();
        expect(result.fractional).toBeUndefined();
        expect(result.ieee754).toBeUndefined();
        expect(result.arithmetic).toBeUndefined();
      });
    });

    describe("buildTransferString", () => {
      test("serializes a state with missing substate", () => {
        expect(buildTransferString({ activeMode: "integers" })).toBe("v1|i");
        expect(buildTransferString({ activeMode: "negative" })).toBe("v1|n");
        expect(buildTransferString({ activeMode: "fractional" })).toBe("v1|f");
        expect(buildTransferString({ activeMode: "ieee754" })).toBe("v1|e");
        expect(buildTransferString({ activeMode: "arithmetic" })).toBe("v1|a");
      });

      test("serializes all converter directions and submodes", () => {
        expect(
          buildTransferString({
            activeMode: "fractional",
            fractional: { converterMode: "binToDec", inputValue: "101.1" },
          }),
        ).toBe("v1|f|b|101.1");

        expect(
          buildTransferString({
            activeMode: "ieee754",
            ieee754: { converterMode: "ieeeToDec", inputValue: "0100" },
          }),
        ).toBe("v1|e|i|0100");

        expect(
          buildTransferString({
            activeMode: "negative",
            negative: { activeMode: "ones", inputValue: "-5" },
          }),
        ).toBe("v1|n|o|-5");

        expect(
          buildTransferString({
            activeMode: "negative",
            negative: { activeMode: "sign", inputValue: "-5" },
          }),
        ).toBe("v1|n|s|-5");

        const submodes: [string, ArithmeticModeType][] = [
          ["a", "addition"],
          ["s", "subtraction"],
          ["d", "division"],
          ["h", "shifting"],
          ["c", "compare"],
        ];
        for (const [char, mode] of submodes) {
          expect(
            buildTransferString({
              activeMode: "arithmetic",
              arithmetic: { activeSubMode: mode, valA: "10", valB: "2" },
            }),
          ).toBe(`v1|a|${char}|10|2`);
        }
      });
    });
  });
});
