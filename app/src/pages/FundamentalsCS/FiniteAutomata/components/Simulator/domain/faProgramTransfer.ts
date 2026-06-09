import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";
import {
  EPSILON,
  type AutomatonType,
  type FAProgram,
  type FATransitionMap,
} from "./faTypes";
import { isFAProgramValid } from "./faProgramValidation";

const BASE64_URL_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

// Every entry in SYMBOL_REGISTRY costs 1 bit in the registry mask. Keep it
// small and focused on the symbols that real automata use so the mask stays
// cheaper than raw UTF-8 storage.
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
const MAX_COLLECTION_SIZE = 1_000_000;
const MAX_TRANSITION_CELLS = 10_000_000;

const SymbolMode = {
  Registry: 0,
  RawUtf8: 1,
} as const;
type SymbolMode = (typeof SymbolMode)[keyof typeof SymbolMode];

const TransitionMode = {
  Dense: 0,
  Sparse: 1,
} as const;
type TransitionMode = (typeof TransitionMode)[keyof typeof TransitionMode];

interface NormalizedProgram {
  stateCount: number;
  isNFA: boolean;
  symbols: string[];
  acceptMask: boolean[];
  readableSymbolIds: number[];
  /** One entry per transition cell: the sorted set of target state IDs. */
  transitionCells: number[][];
}

interface TransitionEncoding {
  mode: TransitionMode;
  bits: number[];
}

export const faProgramTransferCodec: ISimulatorTransferCodec<FAProgram> = {
  async exportValue(program) {
    const normalizedProgram = normalizeProgram(program);
    const writer = new BitWriter();
    const symbolMode = chooseSymbolMode(normalizedProgram.symbols);
    const transitionEncoding = chooseTransitionEncoding(normalizedProgram);

    writer.writeVarUint(normalizedProgram.stateCount);
    writer.writeVarUint(normalizedProgram.symbols.length);
    writer.writeBit(normalizedProgram.isNFA ? 1 : 0);
    writer.writeBits(symbolMode, 1);
    writer.writeBits(transitionEncoding.mode, 1);

    for (const isAccepting of normalizedProgram.acceptMask) {
      writer.writeBit(isAccepting ? 1 : 0);
    }

    writeSymbolDictionary(writer, normalizedProgram.symbols, symbolMode);

    const readableSymbols = new Set(normalizedProgram.readableSymbolIds);
    const readableSymbolCount =
      normalizedProgram.symbols.length + (normalizedProgram.isNFA ? 1 : 0);
    for (let symbolId = 0; symbolId < readableSymbolCount; symbolId++) {
      writer.writeBit(readableSymbols.has(symbolId) ? 1 : 0);
    }

    writer.writeBitArray(transitionEncoding.bits);
    return writer.toBase64Url();
  },
  async importValue(serializedValue) {
    return restoreImportedProgram(serializedValue.trim());
  },
};

function normalizeProgram(program: FAProgram): NormalizedProgram {
  const isNFA = program.type === "NFA";

  if (
    program.states.length === 0 ||
    !program.states.includes(program.startState) ||
    new Set(program.states).size !== program.states.length ||
    new Set(program.alphabet).size !== program.alphabet.length
  ) {
    throw new Error("fa_transfer_program_invalid");
  }

  // State ID 0 is always the start state; the rest keep declaration order.
  const orderedStates = [
    program.startState,
    ...program.states.filter((state) => state !== program.startState),
  ];
  const stateIds = new Map(orderedStates.map((state, index) => [state, index]));

  const symbolMode = chooseSymbolMode(program.alphabet);
  const symbols =
    symbolMode === SymbolMode.Registry
      ? SYMBOL_REGISTRY.filter((symbol) => program.alphabet.includes(symbol))
      : [...program.alphabet];
  const acceptStates = new Set(program.acceptStates);
  const acceptMask = orderedStates.map((state) => acceptStates.has(state));

  // Readable symbol IDs span the alphabet plus, for an NFA, the epsilon row.
  const readableSymbolCount = symbols.length + (isNFA ? 1 : 0);
  const readableSymbolIds: number[] = [];
  const transitionCells: number[][] = [];

  for (let symbolId = 0; symbolId < readableSymbolCount; symbolId++) {
    const symbol = symbolId < symbols.length ? symbols[symbolId] : EPSILON;
    const rowCells: number[][] = [];
    let rowHasTransition = false;

    for (const state of orderedStates) {
      const targets = collectCellTargets(
        program.transitions[state]?.[symbol],
        stateIds,
      );
      rowHasTransition ||= targets.length > 0;
      rowCells.push(targets);
    }

    if (rowHasTransition) {
      readableSymbolIds.push(symbolId);
      transitionCells.push(...rowCells);
    }
  }

  return {
    stateCount: orderedStates.length,
    isNFA,
    symbols,
    acceptMask,
    readableSymbolIds,
    transitionCells,
  };
}

function collectCellTargets(
  targets: string[] | undefined,
  stateIds: Map<string, number>,
): number[] {
  if (!targets) {
    return [];
  }

  const ids = new Set<number>();
  for (const target of targets) {
    const id = stateIds.get(target);
    if (id !== undefined) {
      ids.add(id);
    }
  }

  return [...ids].sort((left, right) => left - right);
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

function chooseTransitionEncoding(
  program: NormalizedProgram,
): TransitionEncoding {
  const denseBits = encodeTransitions(program, false);
  const sparseBits = encodeTransitions(program, true);

  return sparseBits.length < denseBits.length
    ? { mode: TransitionMode.Sparse, bits: sparseBits }
    : { mode: TransitionMode.Dense, bits: denseBits };
}

function encodeTransitions(
  program: NormalizedProgram,
  sparse: boolean,
): number[] {
  const writer = new BitWriter();

  for (const targets of program.transitionCells) {
    if (sparse) {
      writer.writeBit(targets.length > 0 ? 1 : 0);
      if (targets.length === 0) {
        continue;
      }
    }
    writeTargetMask(writer, targets, program.stateCount);
  }

  return writer.bits;
}

function writeTargetMask(
  writer: BitWriter,
  targets: number[],
  stateCount: number,
): void {
  const targetSet = new Set(targets);
  for (let stateId = 0; stateId < stateCount; stateId++) {
    writer.writeBit(targetSet.has(stateId) ? 1 : 0);
  }
}

function restoreImportedProgram(serializedProgram: string): FAProgram {
  try {
    return decodeProgram(serializedProgram);
  } catch {
    throw new Error("fa_transfer_payload_invalid");
  }
}

function decodeProgram(serializedProgram: string): FAProgram {
  const reader = BitReader.fromBase64Url(serializedProgram);
  const stateCount = reader.readVarUint();
  const symbolCount = reader.readVarUint();

  assertCollectionSize(stateCount);
  assertCollectionSize(symbolCount);

  if (stateCount < 1) {
    throw new Error("fa_transfer_payload_invalid");
  }

  const isNFA = reader.readBit() === 1;
  const symbolMode = reader.readBits(1);
  const transitionMode = reader.readBits(1);

  if (
    transitionMode !== TransitionMode.Dense &&
    transitionMode !== TransitionMode.Sparse
  ) {
    throw new Error("fa_transfer_payload_invalid");
  }

  const acceptMask = Array.from(
    { length: stateCount },
    () => reader.readBit() === 1,
  );
  const symbols = readSymbolDictionary(reader, symbolMode, symbolCount);

  const readableSymbolCount = symbolCount + (isNFA ? 1 : 0);
  const readableSymbolIds: number[] = [];
  for (let symbolId = 0; symbolId < readableSymbolCount; symbolId++) {
    if (reader.readBit() === 1) {
      readableSymbolIds.push(symbolId);
    }
  }

  const possibleCellCount = readableSymbolIds.length * stateCount;
  if (
    !Number.isSafeInteger(possibleCellCount) ||
    possibleCellCount > MAX_TRANSITION_CELLS
  ) {
    throw new Error("fa_transfer_payload_invalid");
  }

  const states = createCanonicalStateNames(stateCount);
  const transitions: FATransitionMap = {};
  for (const state of states) {
    transitions[state] = {};
  }

  const isSparse = transitionMode === TransitionMode.Sparse;
  for (const symbolId of readableSymbolIds) {
    const symbol = symbolId < symbolCount ? symbols[symbolId] : EPSILON;

    for (let stateId = 0; stateId < stateCount; stateId++) {
      const targets = readCell(reader, isSparse, stateCount);
      if (targets.length > 0) {
        transitions[states[stateId]][symbol] = targets.map(
          (targetId) => states[targetId],
        );
      }
    }
  }

  reader.assertOnlyPaddingRemains();

  const program: FAProgram = {
    type: (isNFA ? "NFA" : "DFA") satisfies AutomatonType,
    states,
    alphabet: symbols,
    transitions,
    startState: states[0],
    acceptStates: states.filter((_, stateId) => acceptMask[stateId]),
  };

  if (!isFAProgramValid(program)) {
    throw new Error("fa_transfer_payload_invalid");
  }

  return program;
}

function readSymbolDictionary(
  reader: BitReader,
  symbolMode: number,
  symbolCount: number,
): string[] {
  if (symbolMode === SymbolMode.Registry) {
    const symbols: string[] = [];

    for (const symbol of SYMBOL_REGISTRY) {
      if (reader.readBit() === 1) {
        symbols.push(symbol);
      }
    }

    if (symbols.length !== symbolCount) {
      throw new Error("fa_transfer_payload_invalid");
    }

    return symbols;
  }

  if (symbolMode !== SymbolMode.RawUtf8) {
    throw new Error("fa_transfer_payload_invalid");
  }

  const decoder = new TextDecoder("utf-8", { fatal: true });
  const symbols: string[] = [];

  for (let symbolId = 0; symbolId < symbolCount; symbolId++) {
    const byteLength = reader.readVarUint();
    assertCollectionSize(byteLength);

    if (byteLength === 0) {
      throw new Error("fa_transfer_payload_invalid");
    }

    const bytes = Uint8Array.from({ length: byteLength }, () =>
      reader.readBits(8),
    );
    const symbol = decoder.decode(bytes);

    if (
      Array.from(symbol).length !== 1 ||
      symbol === EPSILON ||
      symbols.includes(symbol)
    ) {
      throw new Error("fa_transfer_payload_invalid");
    }

    symbols.push(symbol);
  }

  return symbols;
}

function readCell(
  reader: BitReader,
  isSparse: boolean,
  stateCount: number,
): number[] {
  if (isSparse && reader.readBit() === 0) {
    return [];
  }

  const targets: number[] = [];
  for (let stateId = 0; stateId < stateCount; stateId++) {
    if (reader.readBit() === 1) {
      targets.push(stateId);
    }
  }

  return targets;
}

function createCanonicalStateNames(stateCount: number): string[] {
  return Array.from({ length: stateCount }, (_, stateId) => `S${stateId}`);
}

function assertCollectionSize(value: number): void {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > MAX_COLLECTION_SIZE
  ) {
    throw new Error("fa_transfer_payload_invalid");
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
      throw new Error("fa_transfer_program_invalid");
    }

    for (let bitIndex = bitCount - 1; bitIndex >= 0; bitIndex--) {
      this.writeBit(Math.floor(value / 2 ** bitIndex) % 2);
    }
  }

  writeVarUint(value: number): void {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error("fa_transfer_program_invalid");
    }

    let remaining = value;
    do {
      const data = remaining % 128;
      remaining = Math.floor(remaining / 128);
      this.writeBits(data + (remaining > 0 ? 128 : 0), 8);
    } while (remaining > 0);
  }

  writeBitArray(bits: number[]): void {
    for (const bit of bits) {
      this.writeBit(bit);
    }
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
      throw new Error("fa_transfer_payload_invalid");
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
      throw new Error("fa_transfer_payload_invalid");
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
        throw new Error("fa_transfer_payload_invalid");
      }

      if (byte < 128) {
        return value;
      }

      multiplier *= 128;
    }

    throw new Error("fa_transfer_payload_invalid");
  }

  assertOnlyPaddingRemains(): void {
    const remainingBits = this.bits.slice(this.offset);
    if (remainingBits.length > 5 || remainingBits.some((bit) => bit !== 0)) {
      throw new Error("fa_transfer_payload_invalid");
    }
  }
}
