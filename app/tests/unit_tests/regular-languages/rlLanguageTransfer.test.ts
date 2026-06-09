import { describe, expect, it } from "vitest";
import { rlLanguageTransferCodec } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlLanguageTransfer";

describe("Regular language transfer codec", () => {
  it("round-trips an enumeration language verbatim", async () => {
    const source = 'L = {"010", "0010", "00010"}';

    const exportedValue = await rlLanguageTransferCodec.exportValue(source);
    const importedSource =
      await rlLanguageTransferCodec.importValue(exportedValue);

    expect(exportedValue).toMatch(/^[A-Za-z0-9_-]+$/u);
    expect(importedSource).toBe(source);
  });

  it("round-trips a set-builder language verbatim", async () => {
    const source = "L = {a^n c b^m | n, m > 0}";

    const exportedValue = await rlLanguageTransferCodec.exportValue(source);
    const importedSource =
      await rlLanguageTransferCodec.importValue(exportedValue);

    expect(importedSource).toBe(source);
  });

  it("trims surrounding whitespace before encoding", async () => {
    const exportedValue = await rlLanguageTransferCodec.exportValue(
      "  L = {a^n | n > 0}  ",
    );

    await expect(
      rlLanguageTransferCodec.importValue(exportedValue),
    ).resolves.toBe("L = {a^n | n > 0}");
  });

  it("accepts transfer strings with surrounding whitespace", async () => {
    const exportedValue =
      await rlLanguageTransferCodec.exportValue('L = {"01", "10"}');

    await expect(
      rlLanguageTransferCodec.importValue(` \n${exportedValue}\n `),
    ).resolves.toBe('L = {"01", "10"}');
  });

  it("rejects malformed payloads", async () => {
    await expect(
      rlLanguageTransferCodec.importValue("not a payload!!"),
    ).rejects.toThrow("rl_language_transfer_payload_invalid");
    await expect(rlLanguageTransferCodec.importValue("")).rejects.toThrow(
      "rl_language_transfer_payload_invalid",
    );
  });

  it("rejects an empty language definition on export", async () => {
    await expect(rlLanguageTransferCodec.exportValue("   ")).rejects.toThrow(
      "rl_language_transfer_invalid",
    );
  });
});
