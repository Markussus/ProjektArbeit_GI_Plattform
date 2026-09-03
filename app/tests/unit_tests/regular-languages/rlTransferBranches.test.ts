import { describe, expect, it } from "vitest";
import { BitWriter } from "@/lib/trainingCenter";
import { rlLanguageTransferCodec } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlLanguageTransfer";
import { parseGrammar } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlGrammarValidation";

const LANGUAGE = 'L = {"ab", "aab"}';

/** Encode arbitrary bytes the way the codec does, bypassing its export guard. */
function encodeBytes(bytes: Uint8Array): string {
  const writer = new BitWriter("test");
  for (const byte of bytes) writer.writeBits(byte, 8);
  return writer.toBase64Url();
}

function encodeSource(text: string): string {
  return encodeBytes(new TextEncoder().encode(text));
}

describe("rlLanguageTransferCodec — export", () => {
  it("round-trips a language definition verbatim", async () => {
    const exported = await rlLanguageTransferCodec.exportValue(LANGUAGE);

    expect(exported).toMatch(/^[A-Za-z0-9_-]+$/u);
    expect(await rlLanguageTransferCodec.importValue(exported)).toBe(LANGUAGE);
  });

  it("trims the source before encoding it", async () => {
    const exported = await rlLanguageTransferCodec.exportValue(
      `  ${LANGUAGE}\n`,
    );

    expect(await rlLanguageTransferCodec.importValue(exported)).toBe(LANGUAGE);
  });

  it("round-trips a set-builder definition", async () => {
    const setBuilder = "L = {a^n c b^m | n, m > 0}";
    const exported = await rlLanguageTransferCodec.exportValue(setBuilder);

    expect(await rlLanguageTransferCodec.importValue(exported)).toBe(
      setBuilder,
    );
  });

  it("round-trips non-ASCII notation", async () => {
    const withEpsilon = 'L = {"ε", "ab"}';
    const exported = await rlLanguageTransferCodec.exportValue(withEpsilon);

    expect(await rlLanguageTransferCodec.importValue(exported)).toBe(
      withEpsilon,
    );
  });

  it("refuses to export a definition that does not parse", async () => {
    await expect(
      rlLanguageTransferCodec.exportValue("L = {a^ | n > 0}"),
    ).rejects.toThrow("rl_language_transfer_invalid");
  });
});

describe("rlLanguageTransferCodec — import", () => {
  it("accepts a payload with surrounding whitespace", async () => {
    const exported = await rlLanguageTransferCodec.exportValue(LANGUAGE);

    expect(await rlLanguageTransferCodec.importValue(`  ${exported}  `)).toBe(
      LANGUAGE,
    );
  });

  it("rejects characters outside the base64url alphabet", async () => {
    await expect(rlLanguageTransferCodec.importValue("!!!!")).rejects.toThrow(
      "rl_language_transfer_payload_invalid",
    );
  });

  it("rejects a payload whose text does not parse as a language", () => {
    // A trailing caret: valid base64url carrying an unparseable definition.
    return expect(
      rlLanguageTransferCodec.importValue(encodeSource("L = {a^ | n > 0}")),
    ).rejects.toThrow("rl_language_transfer_payload_invalid");
  });

  it("rejects a payload that is not valid UTF-8", () => {
    return expect(
      rlLanguageTransferCodec.importValue(
        encodeBytes(Uint8Array.from([0xff, 0xfe])),
      ),
    ).rejects.toThrow("rl_language_transfer_payload_invalid");
  });
});

describe("parseGrammar", () => {
  it("accepts a right-linear grammar", () => {
    const parsed = parseGrammar("S -> aS | b");

    expect(parsed.ok).toBe(true);
    expect(parsed.grammar?.startSymbol).toBe("S");
    expect(parsed.validationCodes).toEqual([]);
  });

  it("reports a parse issue for unusable source", () => {
    const parsed = parseGrammar("not a grammar");

    expect(parsed.ok).toBe(false);
    expect(parsed.grammar).toBeNull();
    expect(parsed.issue).not.toBeNull();
  });

  it("rejects a reference to a non-terminal with no rule of its own", () => {
    const parsed = parseGrammar("S -> aA");

    expect(parsed.ok).toBe(false);
    expect(parsed.grammar).toBeNull();
    expect(parsed.issue?.code).toBe("undefinedNonTerminal");
  });

  it("treats empty source as unusable but not an error", () => {
    // Nothing typed yet: the UI must not complain before the learner starts.
    const parsed = parseGrammar("   ");

    expect(parsed.ok).toBe(false);
    expect(parsed.issue).toBeNull();
    expect(parsed.error).toBeNull();
    expect(parsed.validationCodes).toEqual([]);
  });

  it("accepts a grammar whose only alternative is ε", () => {
    const parsed = parseGrammar("S -> ε");

    expect(parsed.ok).toBe(true);
    expect(parsed.grammar?.epsilonProducingNonTerminals).toEqual(["S"]);
  });
});
