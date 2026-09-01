import type { BitReader, BitWriter } from "./bitStream";

/**
 * Building blocks shared by the simulator transfer codecs. Every codec stores a
 * set of single-character symbols (an automaton alphabet, a grammar's
 * terminals, …) and has to guard the counts it reads back out of a payload, so
 * both live here instead of being copied per module.
 */

/** Upper bound on any length read from a payload, before allocating for it. */
const MAX_COLLECTION_SIZE = 1_000_000;

/** Reject a length that is negative, fractional, or implausibly large. */
export function assertCollectionSize(
  value: number,
  payloadError: string,
  maxSize: number = MAX_COLLECTION_SIZE,
): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > maxSize) {
    throw new Error(payloadError);
  }
}

/** Reject an id that does not address an element of a `count`-sized collection. */
export function assertIdInRange(
  value: number,
  count: number,
  payloadError: string,
): void {
  if (!Number.isSafeInteger(value) || value < 0 || value >= count) {
    throw new Error(payloadError);
  }
}

/** How a payload stores its symbol alphabet. */
const SymbolMode = {
  /** One bit per registry entry — cheapest when every symbol is well known. */
  Registry: 0,
  /** Length-prefixed UTF-8 per symbol — the fallback for everything else. */
  RawUtf8: 1,
} as const;
type SymbolMode = (typeof SymbolMode)[keyof typeof SymbolMode];

export interface SymbolDictionaryOptions {
  /**
   * The well-known symbols, each costing one bit in the registry mask. Keep it
   * small and focused on what real programs use so the mask stays cheaper than
   * raw UTF-8.
   */
  registry: readonly string[];
  /** Error thrown when a payload cannot be decoded. */
  payloadError: string;
  /** Symbols a decoded dictionary must never contain, e.g. ε. */
  isReserved?: (symbol: string) => boolean;
}

export interface SymbolDictionaryCodec {
  /** Registry mode iff every symbol is in the registry. */
  chooseMode(symbols: string[]): SymbolMode;
  /** The symbols in the order the chosen mode assigns ids in. */
  order(symbols: string[], mode: SymbolMode): string[];
  write(writer: BitWriter, symbols: string[], mode: SymbolMode): void;
  read(reader: BitReader, mode: number, expectedCount: number): string[];
}

/**
 * Bind a symbol dictionary to one registry and error message. `write` and
 * `read` are exact inverses as long as both sides pass the same mode, which is
 * itself stored in the payload.
 */
export function createSymbolDictionaryCodec({
  registry,
  payloadError,
  isReserved,
}: SymbolDictionaryOptions): SymbolDictionaryCodec {
  const inRegistry = (symbol: string) => registry.includes(symbol);

  return {
    chooseMode(symbols) {
      return symbols.every(inRegistry)
        ? SymbolMode.Registry
        : SymbolMode.RawUtf8;
    },

    order(symbols, mode) {
      // Registry mode restores symbols in registry order, so ids have to be
      // assigned in that same order when writing.
      return mode === SymbolMode.Registry
        ? registry.filter((symbol) => symbols.includes(symbol))
        : [...symbols];
    },

    write(writer, symbols, mode) {
      if (mode === SymbolMode.Registry) {
        const used = new Set(symbols);
        for (const symbol of registry) {
          writer.writeBit(used.has(symbol) ? 1 : 0);
        }
        return;
      }

      const encoder = new TextEncoder();
      for (const symbol of symbols) {
        const bytes = encoder.encode(symbol);
        writer.writeVarUint(bytes.length);
        for (const byte of bytes) {
          writer.writeBits(byte, 8);
        }
      }
    },

    read(reader, mode, expectedCount) {
      if (mode === SymbolMode.Registry) {
        const symbols: string[] = [];
        for (const symbol of registry) {
          if (reader.readBit() === 1) {
            symbols.push(symbol);
          }
        }
        if (symbols.length !== expectedCount) {
          throw new Error(payloadError);
        }
        return symbols;
      }

      if (mode !== SymbolMode.RawUtf8) {
        throw new Error(payloadError);
      }

      const decoder = new TextDecoder("utf-8", { fatal: true });
      const symbols: string[] = [];

      for (let symbolId = 0; symbolId < expectedCount; symbolId++) {
        const byteLength = reader.readVarUint();
        assertCollectionSize(byteLength, payloadError);
        if (byteLength === 0) {
          throw new Error(payloadError);
        }

        const bytes = Uint8Array.from({ length: byteLength }, () =>
          reader.readBits(8),
        );
        const symbol = decoder.decode(bytes);

        // Symbols are single characters, distinct, and never reserved.
        if (
          Array.from(symbol).length !== 1 ||
          symbols.includes(symbol) ||
          isReserved?.(symbol)
        ) {
          throw new Error(payloadError);
        }

        symbols.push(symbol);
      }

      return symbols;
    },
  };
}
