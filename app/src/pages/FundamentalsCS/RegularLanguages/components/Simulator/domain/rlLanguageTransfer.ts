import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";
import { parseLanguageSpec } from "./rlLanguageSpecParser";

const BASE64_URL_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
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
    const parsed = parseLanguageSpec(trimmedSource);
    if (!parsed.ok) {
      throw new Error("rl_language_transfer_invalid");
    }

    const bytes = new TextEncoder().encode(trimmedSource);
    if (bytes.length > MAX_SOURCE_BYTES) {
      throw new Error("rl_language_transfer_invalid");
    }

    return bytesToBase64Url(bytes);
  },
  async importValue(serializedValue) {
    const source = decodeSource(serializedValue.trim());
    if (!parseLanguageSpec(source).ok) {
      throw new Error("rl_language_transfer_payload_invalid");
    }

    return source;
  },
};

function decodeSource(serializedValue: string): string {
  if (!serializedValue || !/^[A-Za-z0-9_-]+$/u.test(serializedValue)) {
    throw new Error("rl_language_transfer_payload_invalid");
  }

  const bytes = base64UrlToBytes(serializedValue);
  if (bytes.length > MAX_SOURCE_BYTES) {
    throw new Error("rl_language_transfer_payload_invalid");
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("rl_language_transfer_payload_invalid");
  }
}

function bytesToBase64Url(bytes: Uint8Array): string {
  const bits: number[] = [];
  for (const byte of bytes) {
    for (let bitIndex = 7; bitIndex >= 0; bitIndex--) {
      bits.push((byte >> bitIndex) & 1);
    }
  }

  let result = "";
  for (let offset = 0; offset < bits.length; offset += 6) {
    let value = 0;
    for (let bitIndex = 0; bitIndex < 6; bitIndex++) {
      value = value * 2 + (bits[offset + bitIndex] ?? 0);
    }
    result += BASE64_URL_ALPHABET[value];
  }

  return result;
}

function base64UrlToBytes(value: string): Uint8Array {
  const bits: number[] = [];
  for (const character of value) {
    const valueIndex = BASE64_URL_ALPHABET.indexOf(character);
    for (let bitIndex = 5; bitIndex >= 0; bitIndex--) {
      bits.push((valueIndex >> bitIndex) & 1);
    }
  }

  // Whole bytes only; the final Base64 char contributes up to 5 zero pad bits.
  const byteCount = Math.floor(bits.length / 8);
  if (bits.slice(byteCount * 8).some((bit) => bit !== 0)) {
    throw new Error("rl_language_transfer_payload_invalid");
  }

  const bytes = new Uint8Array(byteCount);
  for (let byteIndex = 0; byteIndex < byteCount; byteIndex++) {
    let value = 0;
    for (let bitIndex = 0; bitIndex < 8; bitIndex++) {
      value = value * 2 + bits[byteIndex * 8 + bitIndex];
    }
    bytes[byteIndex] = value;
  }

  return bytes;
}
