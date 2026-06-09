import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";
import type {
  ProductionRule,
  RegularGrammar,
} from "@/pages/FundamentalsCS/FiniteAutomata/components/Simulator/domain/faTypes";
import { formatGrammar } from "./rlRegexToGrammar";
import { parseGrammar } from "./rlGrammarValidation";

const BASE64_URL_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

// Each entry costs 1 bit in the registry mask. Covers the terminals real
// grammars use (binary digits, low letters) so the mask beats raw UTF-8.
const SYMBOL_REGISTRY = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
] as const;

// Canonical non-terminal names: ID 0 is always the start symbol "S", the rest
// take the remaining uppercase letters, falling back to "N<index>" if exhausted.
const NON_TERMINAL_NAMES = "SABCDEFGHIJKLMNOPQRTUVWXYZ";
const MAX_COLLECTION_SIZE = 1_000_000;

const SymbolMode = {
  Registry: 0,
  RawUtf8: 1,
} as const;
type SymbolMode = (typeof SymbolMode)[keyof typeof SymbolMode];

interface NormalizedProduction {
  lhsId: number;
  terminalId: number;
  nextNonTerminalId: number | null;
}

interface NormalizedGrammar {
  nonTerminalCount: number;
  terminals: string[];
  epsilonMask: boolean[];
  productions: NormalizedProduction[];
}

/**
 * Compact, shareable transfer codec for right-linear regular grammars. Works on
 * the grammar source text: export parses + encodes it, import decodes and
 * re-renders canonical source. Mirrors the Finite Automata transfer codec.
 */
export const rlGrammarTransferCodec: ISimulatorTransferCodec<string> = {
  async exportValue(source) {
    const normalizedGrammar = normalizeGrammar(source);
    const writer = new BitWriter();
    const symbolMode = chooseSymbolMode(normalizedGrammar.terminals);

    writer.writeVarUint(normalizedGrammar.nonTerminalCount);
    writer.writeVarUint(normalizedGrammar.terminals.length);
    writer.writeVarUint(normalizedGrammar.productions.length);
    writer.writeBits(symbolMode, 1);

    for (const isEpsilonProducing of normalizedGrammar.epsilonMask) {
      writer.writeBit(isEpsilonProducing ? 1 : 0);
    }

    writeSymbolDictionary(writer, normalizedGrammar.terminals, symbolMode);

    const ntBits = bitsNeeded(normalizedGrammar.nonTerminalCount);
    const terminalBits = bitsNeeded(normalizedGrammar.terminals.length);
    for (const production of normalizedGrammar.productions) {
      writer.writeBits(production.lhsId, ntBits);
      writer.writeBits(production.terminalId, terminalBits);
      if (production.nextNonTerminalId === null) {
        writer.writeBit(0);
      } else {
        writer.writeBit(1);
        writer.writeBits(production.nextNonTerminalId, ntBits);
      }
    }

    return writer.toBase64Url();
  },
  async importValue(serializedValue) {
    return formatGrammar(decodeGrammar(serializedValue.trim()));
  },
};

function normalizeGrammar(source: string): NormalizedGrammar {
  const parsed = parseGrammar(source);
  if (!parsed.ok || !parsed.grammar) {
    throw new Error("rl_transfer_grammar_invalid");
  }

  const grammar = parsed.grammar;
  if (
    grammar.nonTerminals.length === 0 ||
    !grammar.nonTerminals.includes(grammar.startSymbol)
  ) {
    throw new Error("rl_transfer_grammar_invalid");
  }

  // Non-terminal ID 0 is always the start symbol; the rest keep their order.
  const orderedNonTerminals = [
    grammar.startSymbol,
    ...grammar.nonTerminals.filter((name) => name !== grammar.startSymbol),
  ];
  const nonTerminalIds = new Map(
    orderedNonTerminals.map((name, index) => [name, index]),
  );

  const symbolMode = chooseSymbolMode(grammar.terminals);
  const terminals =
    symbolMode === SymbolMode.Registry
      ? SYMBOL_REGISTRY.filter((symbol) => grammar.terminals.includes(symbol))
      : [...grammar.terminals];
  const terminalIds = new Map(
    terminals.map((symbol, index) => [symbol, index]),
  );

  const epsilonSet = new Set(grammar.epsilonProducingNonTerminals ?? []);
  const epsilonMask = orderedNonTerminals.map((name) => epsilonSet.has(name));

  const productions = grammar.productions.map((rule) =>
    normalizeProduction(rule, nonTerminalIds, terminalIds),
  );

  return {
    nonTerminalCount: orderedNonTerminals.length,
    terminals,
    epsilonMask,
    productions,
  };
}

function normalizeProduction(
  rule: ProductionRule,
  nonTerminalIds: Map<string, number>,
  terminalIds: Map<string, number>,
): NormalizedProduction {
  return {
    lhsId: getRequiredMapValue(nonTerminalIds, rule.lhs),
    terminalId: getRequiredMapValue(terminalIds, rule.terminal),
    nextNonTerminalId:
      rule.nextNonTerminal === null
        ? null
        : getRequiredMapValue(nonTerminalIds, rule.nextNonTerminal),
  };
}

function chooseSymbolMode(symbols: string[]): SymbolMode {
  return symbols.every((symbol) =>
    (SYMBOL_REGISTRY as readonly string[]).includes(symbol),
  )
    ? SymbolMode.Registry
    : SymbolMode.RawUtf8;
}

function writeSymbolDictionary(
  writer: BitWriter,
  symbols: string[],
  symbolMode: SymbolMode,
): void {
  if (symbolMode === SymbolMode.Registry) {
    const usedSymbols = new Set(symbols);
    for (const symbol of SYMBOL_REGISTRY) {
      writer.writeBit(usedSymbols.has(symbol) ? 1 : 0);
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
}

function decodeGrammar(serializedGrammar: string): RegularGrammar {
  try {
    return decodeGrammarUnsafe(serializedGrammar);
  } catch {
    throw new Error("rl_transfer_payload_invalid");
  }
}

function decodeGrammarUnsafe(serializedGrammar: string): RegularGrammar {
  const reader = BitReader.fromBase64Url(serializedGrammar);
  const nonTerminalCount = reader.readVarUint();
  const terminalCount = reader.readVarUint();
  const productionCount = reader.readVarUint();

  assertCollectionSize(nonTerminalCount);
  assertCollectionSize(terminalCount);
  assertCollectionSize(productionCount);

  if (nonTerminalCount < 1) {
    throw new Error("rl_transfer_payload_invalid");
  }

  const symbolMode = reader.readBits(1);
  const epsilonMask = Array.from(
    { length: nonTerminalCount },
    () => reader.readBit() === 1,
  );
  const terminals = readSymbolDictionary(reader, symbolMode, terminalCount);

  const ntBits = bitsNeeded(nonTerminalCount);
  const terminalBits = bitsNeeded(terminalCount);
  const names = createCanonicalNonTerminalNames(nonTerminalCount);

  const productions = Array.from(
    { length: productionCount },
    (): ProductionRule => {
      const lhsId = reader.readBits(ntBits);
      const terminalId = reader.readBits(terminalBits);
      const hasNext = reader.readBit() === 1;
      const nextId = hasNext ? reader.readBits(ntBits) : null;

      assertIdInRange(lhsId, nonTerminalCount);
      assertIdInRange(terminalId, terminalCount);
      if (nextId !== null) {
        assertIdInRange(nextId, nonTerminalCount);
      }

      return {
        lhs: names[lhsId],
        terminal: terminals[terminalId],
        nextNonTerminal: nextId === null ? null : names[nextId],
      };
    },
  );

  reader.assertOnlyPaddingRemains();

  return {
    nonTerminals: names,
    terminals,
    startSymbol: names[0],
    productions,
    epsilonProducingNonTerminals: names.filter((_, ntId) => epsilonMask[ntId]),
  };
}

function readSymbolDictionary(
  reader: BitReader,
  symbolMode: number,
  terminalCount: number,
): string[] {
  if (symbolMode === SymbolMode.Registry) {
    const symbols: string[] = [];

    for (const symbol of SYMBOL_REGISTRY) {
      if (reader.readBit() === 1) {
        symbols.push(symbol);
      }
    }

    if (symbols.length !== terminalCount) {
      throw new Error("rl_transfer_payload_invalid");
    }

    return symbols;
  }

  if (symbolMode !== SymbolMode.RawUtf8) {
    throw new Error("rl_transfer_payload_invalid");
  }

  const decoder = new TextDecoder("utf-8", { fatal: true });
  const symbols: string[] = [];

  for (let symbolId = 0; symbolId < terminalCount; symbolId++) {
    const byteLength = reader.readVarUint();
    assertCollectionSize(byteLength);

    if (byteLength === 0) {
      throw new Error("rl_transfer_payload_invalid");
    }

    const bytes = Uint8Array.from({ length: byteLength }, () =>
      reader.readBits(8),
    );
    const symbol = decoder.decode(bytes);

    if (Array.from(symbol).length !== 1 || symbols.includes(symbol)) {
      throw new Error("rl_transfer_payload_invalid");
    }

    symbols.push(symbol);
  }

  return symbols;
}

function createCanonicalNonTerminalNames(count: number): string[] {
  return Array.from({ length: count }, (_, ntId) =>
    ntId < NON_TERMINAL_NAMES.length ? NON_TERMINAL_NAMES[ntId] : `N${ntId}`,
  );
}

function bitsNeeded(count: number): number {
  return count <= 1 ? 0 : Math.floor(Math.log2(count - 1)) + 1;
}

function getRequiredMapValue<TKey, TValue>(
  map: Map<TKey, TValue>,
  key: TKey,
): TValue {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error("rl_transfer_grammar_invalid");
  }
  return value;
}

function assertCollectionSize(value: number): void {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > MAX_COLLECTION_SIZE
  ) {
    throw new Error("rl_transfer_payload_invalid");
  }
}

function assertIdInRange(value: number, count: number): void {
  if (!Number.isSafeInteger(value) || value < 0 || value >= count) {
    throw new Error("rl_transfer_payload_invalid");
  }
}

class BitWriter {
  readonly bits: number[] = [];

  writeBit(bit: number): void {
    this.bits.push(bit === 0 ? 0 : 1);
  }

  writeBits(value: number, bitCount: number): void {
    if (
      !Number.isSafeInteger(value) ||
      value < 0 ||
      (bitCount === 0 ? value !== 0 : value >= 2 ** bitCount)
    ) {
      throw new Error("rl_transfer_grammar_invalid");
    }

    for (let bitIndex = bitCount - 1; bitIndex >= 0; bitIndex--) {
      this.writeBit(Math.floor(value / 2 ** bitIndex) % 2);
    }
  }

  writeVarUint(value: number): void {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error("rl_transfer_grammar_invalid");
    }

    let remaining = value;
    do {
      const data = remaining % 128;
      remaining = Math.floor(remaining / 128);
      this.writeBits(data + (remaining > 0 ? 128 : 0), 8);
    } while (remaining > 0);
  }

  toBase64Url(): string {
    let result = "";

    for (let offset = 0; offset < this.bits.length; offset += 6) {
      let value = 0;
      for (let bitIndex = 0; bitIndex < 6; bitIndex++) {
        value = value * 2 + (this.bits[offset + bitIndex] ?? 0);
      }
      result += BASE64_URL_ALPHABET[value];
    }

    return result;
  }
}

class BitReader {
  private offset = 0;
  private readonly bits: number[];

  private constructor(bits: number[]) {
    this.bits = bits;
  }

  static fromBase64Url(value: string): BitReader {
    if (!value || !/^[A-Za-z0-9_-]+$/u.test(value)) {
      throw new Error("rl_transfer_payload_invalid");
    }

    const bits: number[] = [];
    for (const character of value) {
      const valueIndex = BASE64_URL_ALPHABET.indexOf(character);
      for (let bitIndex = 5; bitIndex >= 0; bitIndex--) {
        bits.push(Math.floor(valueIndex / 2 ** bitIndex) % 2);
      }
    }

    return new BitReader(bits);
  }

  readBit(): number {
    if (this.offset >= this.bits.length) {
      throw new Error("rl_transfer_payload_invalid");
    }

    return this.bits[this.offset++];
  }

  readBits(bitCount: number): number {
    let value = 0;

    for (let bitIndex = 0; bitIndex < bitCount; bitIndex++) {
      value = value * 2 + this.readBit();
    }

    return value;
  }

  readVarUint(): number {
    let value = 0;
    let multiplier = 1;

    for (let byteIndex = 0; byteIndex < 8; byteIndex++) {
      const byte = this.readBits(8);
      value += (byte % 128) * multiplier;

      if (!Number.isSafeInteger(value)) {
        throw new Error("rl_transfer_payload_invalid");
      }

      if (byte < 128) {
        return value;
      }

      multiplier *= 128;
    }

    throw new Error("rl_transfer_payload_invalid");
  }

  assertOnlyPaddingRemains(): void {
    const remainingBits = this.bits.slice(this.offset);
    if (remainingBits.length > 5 || remainingBits.some((bit) => bit !== 0)) {
      throw new Error("rl_transfer_payload_invalid");
    }
  }
}
