import { describe, expect, it } from "vitest";
import { rlDraftTransferCodec } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlDraftTransfer";
import { rlGrammarTransferCodec } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlGrammarTransfer";
import { rlLanguageTransferCodec } from "@/pages/FundamentalsCS/RegularLanguages/components/Simulator/domain/rlLanguageTransfer";

async function roundTrip(draft: string): Promise<string> {
  return rlDraftTransferCodec.importValue(
    await rlDraftTransferCodec.exportValue(draft),
  );
}

describe("rlDraftTransferCodec", () => {
  it("round-trips an enumeration answer unchanged", async () => {
    await expect(roundTrip("100, 101, 110")).resolves.toBe("100, 101, 110");
  });

  it("round-trips a grammar answer without renaming its non-terminals", async () => {
    // The grammar codec re-renders canonical names; a draft must come back
    // exactly as the learner typed it.
    const draft = "START -> 0A | 1B\nA -> 0 | 1\nB -> ε";

    await expect(roundTrip(draft)).resolves.toBe(draft);
  });

  it("saves an answer that is still half-written", async () => {
    // The whole point of a separate draft codec: the grammar and language
    // codecs reject text that doesn't parse, which is most of the time while
    // someone is typing.
    await expect(roundTrip("START -> 0A |")).resolves.toBe("START -> 0A |");
  });

  it("preserves leading and trailing whitespace", async () => {
    await expect(roundTrip("  ab,\n  ba\n")).resolves.toBe("  ab,\n  ba\n");
  });

  it("round-trips the empty-word symbol and other non-ASCII text", async () => {
    await expect(roundTrip("ε, äöü, 𝔞")).resolves.toBe("ε, äöü, 𝔞");
  });

  it("round-trips an empty draft", async () => {
    await expect(roundTrip("")).resolves.toBe("");
  });

  it("rejects a payload that is not valid Base64url", async () => {
    await expect(rlDraftTransferCodec.importValue("!!!")).rejects.toThrow(
      "rl_draft_transfer_payload_invalid",
    );
  });

  // The exercise slots (0-8) are the task ids an older build used for the free
  // simulator's three modes. Without a format marker those leftovers decode as
  // mojibake — control characters, or a stray language definition — and land in
  // the learner's answer box looking like their own work.
  describe("payloads left behind by an older build", () => {
    it("rejects a grammar saved in what is now an exercise slot", async () => {
      const legacy = await rlGrammarTransferCodec.exportValue(
        "START -> 0A | 1B\nA -> 0 | 1\nB -> 1",
      );

      await expect(rlDraftTransferCodec.importValue(legacy)).rejects.toThrow(
        "rl_draft_transfer_payload_invalid",
      );
    });

    it("rejects a language saved in what is now an exercise slot", async () => {
      const legacy = await rlLanguageTransferCodec.exportValue(
        'L = {"010", "0110", "01110"}',
      );

      await expect(rlDraftTransferCodec.importValue(legacy)).rejects.toThrow(
        "rl_draft_transfer_payload_invalid",
      );
    });
  });
});
