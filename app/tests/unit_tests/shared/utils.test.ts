import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cloneJson,
  cn,
  decodeBase64Bytes,
  decodeBase64Utf8,
  encodeBase64Bytes,
  encodeBase64Utf8,
  fromBase64Url,
  gzipCompressToBase64Url,
  gzipDecompressFromBase64Url,
  toBase64Url,
} from "@/lib/utils";

describe("cn", () => {
  it("combines conditional classes and resolves Tailwind conflicts", () => {
    const showHiddenClass = false;

    expect(cn("px-2", showHiddenClass && "hidden", ["font-bold", "px-4"])).toBe(
      "font-bold px-4",
    );
  });
});

describe("cloneJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates an independent structured clone when available", () => {
    const source = {
      nested: { value: 1 },
      date: new Date("2026-06-10T00:00:00.000Z"),
    };

    const clone = cloneJson(source);
    clone.nested.value = 2;

    expect(source.nested.value).toBe(1);
    expect(clone).toEqual({
      nested: { value: 2 },
      date: source.date,
    });
    expect(clone.date).toBeInstanceOf(Date);
  });

  it("falls back to JSON cloning without structuredClone", () => {
    vi.stubGlobal("structuredClone", undefined);
    const source = { nested: { value: 1 }, omitted: undefined };

    const clone = cloneJson(source);
    clone.nested.value = 2;

    expect(source.nested.value).toBe(1);
    expect(clone).toEqual({ nested: { value: 2 } });
  });
});

describe("Base64 helpers", () => {
  it("round-trips arbitrary bytes", () => {
    const bytes = Uint8Array.of(0, 1, 127, 128, 255);
    const encoded = encodeBase64Bytes(bytes);

    expect(encoded).toBe("AAF/gP8=");
    expect(decodeBase64Bytes(encoded)).toEqual(bytes);
  });

  it.each(["", "ASCII text", "Größe prüfen – 10 €", "你好"])(
    "round-trips UTF-8 text %j",
    (value) => {
      expect(decodeBase64Utf8(encodeBase64Utf8(value))).toBe(value);
    },
  );

  it("converts padded Base64 to Base64URL and back", () => {
    expect(toBase64Url("+/8=")).toBe("-_8");
    expect(fromBase64Url("-_8")).toBe("+/8=");
    expect(fromBase64Url("YQ")).toBe("YQ==");
  });
});

describe("gzip helpers", () => {
  it.each(["", "short text", "äöü € ".repeat(100)])(
    "round-trips gzip-compressed UTF-8 text",
    async (value) => {
      const compressed = await gzipCompressToBase64Url(value);

      expect(compressed).toMatch(/^[A-Za-z0-9_-]+$/u);
      await expect(gzipDecompressFromBase64Url(compressed)).resolves.toBe(
        value,
      );
    },
  );

  it("rejects malformed gzip data", async () => {
    await expect(gzipDecompressFromBase64Url("AAAA")).rejects.toThrow();
  });
});
