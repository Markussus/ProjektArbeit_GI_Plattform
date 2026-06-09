import { describe, expect, it } from "vitest";
import { rlGrammarTransferCodec } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlGrammarTransfer";

const BASE64_URL_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

describe("Regular grammar transfer codec", () => {
  it("round-trips a registry-terminal grammar in canonical form", async () => {
    const source = ["S -> 0S | 1A", "A -> 0A | 1 | \u03B5"].join("\n");

    const exportedValue = await rlGrammarTransferCodec.exportValue(source);
    const importedSource =
      await rlGrammarTransferCodec.importValue(exportedValue);

    expect(exportedValue).toMatch(/^[A-Za-z0-9_-]+$/u);
    expect(readSymbolMode(exportedValue)).toBe(0);
    expect(importedSource).toBe(source);
  });

  it("renames non-terminals canonically with the start symbol first", async () => {
    const source = ["Start -> aMid", "Mid -> bStart | b"].join("\n");

    const exportedValue = await rlGrammarTransferCodec.exportValue(source);
    const importedSource =
      await rlGrammarTransferCodec.importValue(exportedValue);

    expect(importedSource).toBe(["S -> aA", "A -> bS | b"].join("\n"));
  });

  it("round-trips an epsilon-only grammar with no terminals", async () => {
    const exportedValue = await rlGrammarTransferCodec.exportValue("S -> \u03B5");
    const importedSource =
      await rlGrammarTransferCodec.importValue(exportedValue);

    expect(importedSource).toBe("S -> \u03B5");
  });

  it("uses raw UTF-8 mode for terminals outside the registry", async () => {
    // Greek lambda/mu, written as escapes so the source stays ASCII-only.
    const lambda = "\u03BB";
    const mu = "\u03BC";
    const source = `S -> ${lambda}S | ${mu}`;

    const exportedValue = await rlGrammarTransferCodec.exportValue(source);
    const importedSource =
      await rlGrammarTransferCodec.importValue(exportedValue);

    expect(readSymbolMode(exportedValue)).toBe(1);
    expect(importedSource).toBe(`S -> ${lambda}S | ${mu}`);
  });

  it("accepts the structured grammar format on export", async () => {
    const source = ["type: grammar", "productions:", "S -> 0S | 1"].join("\n");

    const exportedValue = await rlGrammarTransferCodec.exportValue(source);
    const importedSource =
      await rlGrammarTransferCodec.importValue(exportedValue);

    expect(importedSource).toBe("S -> 0S | 1");
  });

  it("accepts transfer strings with surrounding whitespace", async () => {
    const exportedValue =
      await rlGrammarTransferCodec.exportValue("S -> aS | b");

    await expect(
      rlGrammarTransferCodec.importValue(` \n${exportedValue}\n `),
    ).resolves.toBe("S -> aS | b");
  });

  it("rejects malformed payloads", async () => {
    await expect(
      rlGrammarTransferCodec.importValue("not.a.valid.payload"),
    ).rejects.toThrow("rl_transfer_payload_invalid");
    await expect(rlGrammarTransferCodec.importValue("")).rejects.toThrow(
      "rl_transfer_payload_invalid",
    );
  });

  it("rejects source that is not a valid grammar", async () => {
    await expect(
      rlGrammarTransferCodec.exportValue("this is not a grammar"),
    ).rejects.toThrow("rl_transfer_grammar_invalid");
  });
});

function readSymbolMode(value: string): number {
  const bits = Array.from(value).flatMap((character) => {
    const valueIndex = BASE64_URL_ALPHABET.indexOf(character);
    return Array.from(
      { length: 6 },
      (_, bitIndex) => Math.floor(valueIndex / 2 ** (5 - bitIndex)) % 2,
    );
  });
  let offset = 0;

  // Skip the three leading varuints (non-terminal, terminal, production counts).
  for (let field = 0; field < 3; field++) {
    while (true) {
      const byte = readBits(bits, offset, 8);
      offset += 8;
      if (byte < 128) {
        break;
      }
    }
  }

  return readBits(bits, offset, 1);
}

function readBits(bits: number[], offset: number, length: number): number {
  return bits
    .slice(offset, offset + length)
    .reduce((value, bit) => value * 2 + bit, 0);
}
