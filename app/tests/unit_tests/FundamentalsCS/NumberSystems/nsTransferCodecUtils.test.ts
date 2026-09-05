import { describe, expect, test } from "vitest";
import type { ArithmeticModeType } from "@/pages/FundamentalsCS/NumberSystems/components/simulator/nsTransferCodec.ts";
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
