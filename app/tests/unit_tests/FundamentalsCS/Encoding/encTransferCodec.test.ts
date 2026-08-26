import { describe, expect, test } from "vitest";
import {
  encTransferCodec,
  EncoderState,
} from "../../../../src/pages/FundamentalsCS/Encoding/simulator/encTransferCodec";

describe("encTransferCodec", () => {
  describe("exportValue", () => {
    test("exports base64 encode mode correctly", async () => {
      const state: EncoderState = {
        activeMode: "base64",
        base64: { converterMode: "encode", inputValue: "Hello" },
      };
      const result = await encTransferCodec.exportValue(state);
      const decodedStr = decodeURIComponent(escape(atob(result)));
      expect(decodedStr).toBe("v1|b|e|Hello");
    });

    test("exports base64 decode mode correctly", async () => {
      const state: EncoderState = {
        activeMode: "base64",
        base64: { converterMode: "decode", inputValue: "SGVsbG8=" },
      };
      const result = await encTransferCodec.exportValue(state);
      const decodedStr = decodeURIComponent(escape(atob(result)));
      expect(decodedStr).toBe("v1|b|d|SGVsbG8=");
    });

    test("exports utf8 encode mode correctly", async () => {
      const state: EncoderState = {
        activeMode: "utf8",
        utf8: { converterMode: "encode", inputValue: "A" },
      };
      const result = await encTransferCodec.exportValue(state);
      const decodedStr = decodeURIComponent(escape(atob(result)));
      expect(decodedStr).toBe("v1|u|e|A");
    });
  });

  describe("importValue", () => {
    test("imports base64 mode correctly", async () => {
      const result = await encTransferCodec.importValue("djF8YnxlfEhlbGxv");
      expect(result).toEqual({
        activeMode: "base64",
        base64: { converterMode: "encode", inputValue: "Hello" },
      });
    });

    test("imports utf8 mode correctly", async () => {
      const result = await encTransferCodec.importValue("djF8dXxlfEE");
      expect(result).toEqual({
        activeMode: "utf8",
        utf8: { converterMode: "encode", inputValue: "A" },
      });
    });

    test("rejects obsolete JSON and prefixed payloads", async () => {
      const jsonPayload = btoa(JSON.stringify({ activeMode: "base64" }));
      await expect(encTransferCodec.importValue(jsonPayload)).rejects.toThrow(
        "Failed to import encoding state",
      );
      await expect(
        encTransferCodec.importValue("GARBAGEdjF8YnxlfEhlbGxv"),
      ).rejects.toThrow("Failed to import encoding state");
    });

    test("throws error for invalid string", async () => {
      await expect(encTransferCodec.importValue("invalid")).rejects.toThrow(
        "Failed to import encoding state",
      );
    });
  });
});
