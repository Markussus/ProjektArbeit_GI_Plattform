import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";
import { BitReader, BitWriter } from "@/lib/trainingCenter";

/** Error codes and the size ceiling a stored draft may not exceed. */
const DRAFT_INVALID = "rl_draft_transfer_invalid";
const PAYLOAD_INVALID = "rl_draft_transfer_payload_invalid";
const MAX_SOURCE_BYTES = 1_000_000;

/**
 * Marks a payload as a draft. Without it this codec would decode anything
 * byte-shaped: a grammar or language payload from an older build would reach the
 * answer box as mojibake instead of failing.
 */
const DRAFT_FORMAT_MARKER = 0x524c;
const DRAFT_FORMAT_MARKER_BITS = 16;

/**
 * Transfer codec for an exercise answer in progress. Unlike the grammar and
 * language codecs it never parses what it is given — a draft is half-written most
 * of the time it is autosaved — and encodes the text verbatim, so a restored
 * draft reads back exactly as typed.
 */
export const rlDraftTransferCodec: ISimulatorTransferCodec<string> = {
  async exportValue(draft) {
    const bytes = new TextEncoder().encode(draft);
    if (bytes.length > MAX_SOURCE_BYTES) {
      throw new Error(DRAFT_INVALID);
    }

    const writer = new BitWriter(DRAFT_INVALID);
    writer.writeBits(DRAFT_FORMAT_MARKER, DRAFT_FORMAT_MARKER_BITS);
    for (const byte of bytes) {
      writer.writeBits(byte, 8);
    }
    return writer.toBase64Url();
  },

  async importValue(serializedValue) {
    const trimmedValue = serializedValue.trim();
    // An empty draft still carries its marker, so an empty payload can only be
    // a slot the Training Center reader already discards. Treat it as empty
    // rather than as a corrupt draft.
    if (!trimmedValue) {
      return "";
    }

    const reader = BitReader.fromBase64Url(trimmedValue, PAYLOAD_INVALID);

    if (
      reader.remainingBitCount < DRAFT_FORMAT_MARKER_BITS ||
      reader.readBits(DRAFT_FORMAT_MARKER_BITS) !== DRAFT_FORMAT_MARKER
    ) {
      throw new Error(PAYLOAD_INVALID);
    }

    // Whole bytes only; the trailing Base64 character contributes pad bits,
    // which `assertOnlyPaddingRemains` then requires to be zero.
    const byteCount = Math.floor(reader.remainingBitCount / 8);
    if (byteCount > MAX_SOURCE_BYTES) {
      throw new Error(PAYLOAD_INVALID);
    }

    const bytes = Uint8Array.from({ length: byteCount }, () =>
      reader.readBits(8),
    );
    reader.assertOnlyPaddingRemains();

    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      throw new Error(PAYLOAD_INVALID);
    }
  },
};
