import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";
import { BitReader, BitWriter } from "@/lib/trainingCenter";
import { parseLanguageSpec } from "./rlLanguageSpecParser";

const SOURCE_INVALID = "rl_language_transfer_invalid";
const PAYLOAD_INVALID = "rl_language_transfer_payload_invalid";
const MAX_SOURCE_BYTES = 1_000_000;

/**
 * Transfer codec for regular language definitions (enumeration or set-builder).
 *
 * Unlike grammars or automata, a language definition is the user-authored text
 * itself, so the codec encodes the source verbatim (UTF-8 -> Base64url) rather
 * than a normalized structure. Both ends validate that the text parses, which
 * keeps the round-trip exact while rejecting malformed payloads. Mirrors the
 * grammar transfer codec's interface and feedback flow.
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
