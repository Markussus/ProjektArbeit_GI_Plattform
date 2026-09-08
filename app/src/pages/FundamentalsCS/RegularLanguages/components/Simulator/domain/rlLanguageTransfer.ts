import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";
import { BitReader, BitWriter } from "@/lib/trainingCenter";
import { parseLanguageSpec } from "./rlLanguageSpecParser";

/** Error codes and the size ceiling a stored source may not exceed. */
const SOURCE_INVALID = "rl_language_transfer_invalid";
const PAYLOAD_INVALID = "rl_language_transfer_payload_invalid";
const MAX_SOURCE_BYTES = 1_000_000;

/**
 * Transfer codec for language definitions. A definition is user-authored text, so
 * the source is encoded verbatim rather than normalized; both ends check that it
 * parses, which keeps the round trip exact.
 */
export const rlLanguageTransferCodec: ISimulatorTransferCodec<string> = {
  async exportValue(source) {
    const trimmedSource = source.trim();
    if (!parseLanguageSpec(trimmedSource).ok) {
      throw new Error(SOURCE_INVALID);
    }

    const bytes = new TextEncoder().encode(trimmedSource);
    if (bytes.length > MAX_SOURCE_BYTES) {
      throw new Error(SOURCE_INVALID);
    }

    const writer = new BitWriter(SOURCE_INVALID);
    for (const byte of bytes) {
      writer.writeBits(byte, 8);
    }
    return writer.toBase64Url();
  },
  async importValue(serializedValue) {
    const source = decodeSource(serializedValue.trim());
    if (!parseLanguageSpec(source).ok) {
      throw new Error(PAYLOAD_INVALID);
    }

    return source;
  },
};

/** Read the payload back as UTF-8 text; parsing it is left to the caller. */
function decodeSource(serializedValue: string): string {
  const reader = BitReader.fromBase64Url(serializedValue, PAYLOAD_INVALID);

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
}
