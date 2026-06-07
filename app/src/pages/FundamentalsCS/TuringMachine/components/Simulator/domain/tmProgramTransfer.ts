import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";
import { withDerivedAlphabets, type TMProgram } from "./tmProgram";
import { isTMProgramValid } from "./tmProgramValidation";
import {
  DEFAULT_BLANK_SYMBOL,
  type HeadMovement,
  type TMTransition,
} from "./tmTypes";

const BASE64_URL_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

// Every 6 entries in SYMBOL_REGISTRY add 1 BASE64 char to the output
const SYMBOL_REGISTRY = [
  "0",
  "1",
  "A",
  "B",
  "C",
  "D",
  "E",
  "X",
  "Y",
  "Z",
  "a",
  "b",
  "c",
  "d",
  "e",
  "x",
  "y",
  "z",
] as const;
const MAX_COLLECTION_SIZE = 1_000_000;
const MAX_TRANSITION_CELLS = 10_000_000;

const SymbolMode = {
  Registry: 0,
  RawUtf8: 1,
} as const;
type SymbolMode = (typeof SymbolMode)[keyof typeof SymbolMode];

const TransitionMode = {
  DenseRaw: 0,
  SparseRaw: 1,
  DenseDictionary: 2,
  SparseDictionary: 3,
} as const;
type TransitionMode = (typeof TransitionMode)[keyof typeof TransitionMode];

interface NormalizedTransition {
  nextState: number;
  writeSymbol: number;
  movement: HeadMovement;
}

interface NormalizedProgram {
  nonHaltStateCount: number;
  haltStateCount: number;
  symbols: string[];
  initialTape: number[];
  readableSymbolIds: number[];
  transitionCells: Array<NormalizedTransition | undefined>;
}

interface TransitionEncoding {
  mode: TransitionMode;
  bits: number[];
}

export const tmProgramTransferCodec: ISimulatorTransferCodec<TMProgram> = {
  async exportValue(program) {
    const normalizedProgram = normalizeProgram(program);
    const writer = new BitWriter();
    const symbolMode = chooseSymbolMode(normalizedProgram.symbols);
    const transitionEncoding = chooseTransitionEncoding(normalizedProgram);

    writer.writeVarUint(normalizedProgram.nonHaltStateCount);
    writer.writeVarUint(normalizedProgram.haltStateCount);
    writer.writeVarUint(normalizedProgram.symbols.length);
    writer.writeVarUint(normalizedProgram.initialTape.length);
    writer.writeBits(symbolMode, 1);
    writer.writeBits(transitionEncoding.mode, 2);
    writeSymbolDictionary(writer, normalizedProgram.symbols, symbolMode);

    const readableSymbols = new Set(normalizedProgram.readableSymbolIds);
    for (
      let symbolId = 0;
      symbolId < normalizedProgram.symbols.length;
      symbolId++
    ) {
      writer.writeBit(readableSymbols.has(symbolId) ? 1 : 0);
    }

    const symbolBits = bitsNeeded(normalizedProgram.symbols.length);
    for (const symbolId of normalizedProgram.initialTape) {
      writer.writeBits(symbolId, symbolBits);
    }

    writer.writeBitArray(transitionEncoding.bits);
    return writer.toBase64Url();
  },
  async importValue(serializedValue) {
    return restoreImportedProgram(serializedValue.trim());
  },
};

function normalizeProgram(program: TMProgram): NormalizedProgram {
  const programWithDerivedAlphabets = withDerivedAlphabets(program);
  if (
    !isTMProgramValid(programWithDerivedAlphabets) ||
    program.blankSymbol !== DEFAULT_BLANK_SYMBOL ||
    program.haltStates.includes(program.initialState) ||
    new Set(program.states).size !== program.states.length ||
    new Set(program.haltStates).size !== program.haltStates.length
  ) {
    throw new Error("tm_transfer_program_invalid");
  }

  const haltStates = new Set(program.haltStates);
  const targetedStates = new Set<string>();
  const sourceStates = new Set<string>();

  for (const stateTransitions of Object.values(program.transitions)) {
    for (const [sourceState, transition] of Object.entries(
      stateTransitions ?? {},
    )) {
      if (!transition || haltStates.has(sourceState)) {
        continue;
      }

      sourceStates.add(sourceState);
      targetedStates.add(transition.nextState);
    }
  }

  const nonHaltStates = [
    program.initialState,
    ...program.states.filter(
      (state) =>
        state !== program.initialState &&
        !haltStates.has(state) &&
        (sourceStates.has(state) || targetedStates.has(state)),
    ),
  ];
  const usedHaltStates = program.haltStates.filter((state) =>
    targetedStates.has(state),
  );
  if (usedHaltStates.length === 0) {
    throw new Error("tm_transfer_program_invalid");
  }

  const stateIds = new Map<string, number>();

  for (const [stateId, state] of [
    ...nonHaltStates,
    ...usedHaltStates,
  ].entries()) {
    stateIds.set(state, stateId);
  }

  const readableSymbols = Object.entries(program.transitions)
    .filter(([, stateTransitions]) => stateTransitions !== undefined)
    .map(([readSymbol]) => readSymbol);
  const usedSymbols = collectUsedSymbols(
    program,
    readableSymbols,
    nonHaltStates,
  );
  const symbolMode = chooseSymbolMode(usedSymbols);
  const symbols =
    symbolMode === SymbolMode.Registry
      ? [
          DEFAULT_BLANK_SYMBOL,
          ...SYMBOL_REGISTRY.filter((symbol) => usedSymbols.includes(symbol)),
        ]
      : usedSymbols;
  const symbolIds = new Map(symbols.map((symbol, index) => [symbol, index]));
  const readableSymbolIds = readableSymbols
    .map((symbol) => getRequiredMapValue(symbolIds, symbol))
    .sort((left, right) => left - right);
  const transitionCells: Array<NormalizedTransition | undefined> = [];

  for (const symbolId of readableSymbolIds) {
    const readSymbol = symbols[symbolId];
    const stateTransitions = program.transitions[readSymbol] ?? {};

    for (const state of nonHaltStates) {
      const transition = stateTransitions[state];
      transitionCells.push(
        transition
          ? normalizeTransition(transition, stateIds, symbolIds)
          : undefined,
      );
    }
  }

  return {
    nonHaltStateCount: nonHaltStates.length,
    haltStateCount: usedHaltStates.length,
    symbols,
    initialTape: program.initialTape.map((symbol) =>
      getRequiredMapValue(symbolIds, symbol),
    ),
    readableSymbolIds,
    transitionCells,
  };
}

function collectUsedSymbols(
  program: TMProgram,
  readableSymbols: string[],
  nonHaltStates: string[],
): string[] {
  const symbols = [DEFAULT_BLANK_SYMBOL];
  appendUnique(symbols, program.initialTape);
  appendUnique(symbols, readableSymbols);

  for (const readSymbol of readableSymbols) {
    const stateTransitions = program.transitions[readSymbol] ?? {};

    for (const state of nonHaltStates) {
      const transition = stateTransitions[state];
      if (transition) {
        appendUnique(symbols, [transition.writeSymbol]);
      }
    }
  }

  return symbols;
}

function normalizeTransition(
  transition: TMTransition,
  stateIds: Map<string, number>,
  symbolIds: Map<string, number>,
): NormalizedTransition {
  return {
    nextState: getRequiredMapValue(stateIds, transition.nextState),
    writeSymbol: getRequiredMapValue(symbolIds, transition.writeSymbol),
    movement: transition.movement,
  };
}

function chooseSymbolMode(symbols: string[]): SymbolMode {
  return symbols
    .slice(1)
    .every((symbol) => (SYMBOL_REGISTRY as readonly string[]).includes(symbol))
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
  for (const symbol of symbols.slice(1)) {
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
  const stateBits = bitsNeeded(
    program.nonHaltStateCount + program.haltStateCount,
  );
  const symbolBits = bitsNeeded(program.symbols.length);
  const transitions = program.transitionCells.filter(
    (transition): transition is NormalizedTransition => Boolean(transition),
  );
  const isDense = transitions.length === program.transitionCells.length;
  const dictionary = collectTransitionDictionary(program.transitionCells);
  const candidates: TransitionEncoding[] = [];

  if (isDense) {
    candidates.push({
      mode: TransitionMode.DenseRaw,
      bits: encodeRawTransitions(
        program.transitionCells,
        stateBits,
        symbolBits,
        false,
      ),
    });
  }

  candidates.push({
    mode: TransitionMode.SparseRaw,
    bits: encodeRawTransitions(
      program.transitionCells,
      stateBits,
      symbolBits,
      true,
    ),
  });

  if (isDense) {
    candidates.push({
      mode: TransitionMode.DenseDictionary,
      bits: encodeDictionaryTransitions(
        program.transitionCells,
        dictionary,
        stateBits,
        symbolBits,
        false,
      ),
    });
  }

  candidates.push({
    mode: TransitionMode.SparseDictionary,
    bits: encodeDictionaryTransitions(
      program.transitionCells,
      dictionary,
      stateBits,
      symbolBits,
      true,
    ),
  });

  return candidates.reduce((smallest, candidate) =>
    candidate.bits.length < smallest.bits.length ? candidate : smallest,
  );
}

function encodeRawTransitions(
  cells: Array<NormalizedTransition | undefined>,
  stateBits: number,
  symbolBits: number,
  sparse: boolean,
): number[] {
  const writer = new BitWriter();

  for (const transition of cells) {
    if (sparse) {
      writer.writeBit(transition ? 1 : 0);
    }
    if (transition) {
      writeTransition(writer, transition, stateBits, symbolBits);
    }
  }

  return writer.bits;
}

function encodeDictionaryTransitions(
  cells: Array<NormalizedTransition | undefined>,
  dictionary: NormalizedTransition[],
  stateBits: number,
  symbolBits: number,
  sparse: boolean,
): number[] {
  const writer = new BitWriter();
  writer.writeVarUint(dictionary.length);

  for (const transition of dictionary) {
    writeTransition(writer, transition, stateBits, symbolBits);
  }

  const dictionaryIndexes = new Map(
    dictionary.map((transition, index) => [transitionKey(transition), index]),
  );
  const dictionaryBits = bitsNeeded(dictionary.length);

  for (const transition of cells) {
    if (sparse) {
      writer.writeBit(transition ? 1 : 0);
    }
    if (transition) {
      writer.writeBits(
        getRequiredMapValue(dictionaryIndexes, transitionKey(transition)),
        dictionaryBits,
      );
    }
  }

  return writer.bits;
}

function collectTransitionDictionary(
  cells: Array<NormalizedTransition | undefined>,
): NormalizedTransition[] {
  const dictionary: NormalizedTransition[] = [];
  const keys = new Set<string>();

  for (const transition of cells) {
    if (!transition) {
      continue;
    }

    const key = transitionKey(transition);
    if (!keys.has(key)) {
      keys.add(key);
      dictionary.push(transition);
    }
  }

  return dictionary;
}

function writeTransition(
  writer: BitWriter,
  transition: NormalizedTransition,
  stateBits: number,
  symbolBits: number,
): void {
  writer.writeBits(transition.nextState, stateBits);
  writer.writeBits(transition.writeSymbol, symbolBits);
  writer.writeBits(movementToId(transition.movement), 2);
}

function restoreImportedProgram(serializedProgram: string): TMProgram {
  try {
    const reader = BitReader.fromBase64Url(serializedProgram);
    const nonHaltStateCount = reader.readVarUint();
    const haltStateCount = reader.readVarUint();
    const symbolCount = reader.readVarUint();
    const initialTapeLength = reader.readVarUint();

    assertCollectionSize(nonHaltStateCount);
    assertCollectionSize(haltStateCount);
    assertCollectionSize(symbolCount);
    assertCollectionSize(initialTapeLength);

    if (nonHaltStateCount < 1 || symbolCount < 1) {
      throw new Error("tm_transfer_payload_invalid");
    }

    const totalStateCount = nonHaltStateCount + haltStateCount;
    assertCollectionSize(totalStateCount);

    const symbolMode = reader.readBits(1);
    const transitionMode = reader.readBits(2);
    const symbols = readSymbolDictionary(reader, symbolMode, symbolCount);
    const readableSymbolIds: number[] = [];

    for (let symbolId = 0; symbolId < symbolCount; symbolId++) {
      if (reader.readBit() === 1) {
        readableSymbolIds.push(symbolId);
      }
    }

    const possibleCellCount = readableSymbolIds.length * nonHaltStateCount;
    if (
      !Number.isSafeInteger(possibleCellCount) ||
      possibleCellCount > MAX_TRANSITION_CELLS
    ) {
      throw new Error("tm_transfer_payload_invalid");
    }

    const symbolBits = bitsNeeded(symbolCount);
    const initialTape = Array.from({ length: initialTapeLength }, () => {
      const symbolId = reader.readBits(symbolBits);
      assertIdInRange(symbolId, symbolCount);
      return symbols[symbolId];
    });
    const stateBits = bitsNeeded(totalStateCount);
    const transitionCells = readTransitionCells(
      reader,
      transitionMode,
      possibleCellCount,
      stateBits,
      symbolBits,
      totalStateCount,
      symbolCount,
    );

    reader.assertOnlyPaddingRemains();

    const states = createCanonicalStateNames(nonHaltStateCount, haltStateCount);
    const transitions: TMProgram["transitions"] = {};
    let cellIndex = 0;

    for (const symbolId of readableSymbolIds) {
      const stateTransitions: NonNullable<TMProgram["transitions"][string]> =
        {};

      for (let stateId = 0; stateId < nonHaltStateCount; stateId++) {
        const transition = transitionCells[cellIndex++];
        if (transition) {
          stateTransitions[states[stateId]] = {
            nextState: states[transition.nextState],
            writeSymbol: symbols[transition.writeSymbol],
            movement: transition.movement,
          };
        }
      }

      transitions[symbols[symbolId]] = stateTransitions;
    }

    const program = withDerivedAlphabets({
      states,
      inputAlphabet: [],
      tapeAlphabet: symbols,
      blankSymbol: DEFAULT_BLANK_SYMBOL,
      initialState: "q0",
      haltStates: states.slice(nonHaltStateCount),
      transitions,
      initialTape,
    });

    if (!isTMProgramValid(program)) {
      throw new Error("tm_transfer_payload_invalid");
    }

    return program;
  } catch {
    throw new Error("tm_transfer_payload_invalid");
  }
}

function readSymbolDictionary(
  reader: BitReader,
  symbolMode: number,
  symbolCount: number,
): string[] {
  if (symbolMode === SymbolMode.Registry) {
    const symbols = [DEFAULT_BLANK_SYMBOL];

    for (const symbol of SYMBOL_REGISTRY) {
      if (reader.readBit() === 1) {
        symbols.push(symbol);
      }
    }

    if (symbols.length !== symbolCount) {
      throw new Error("tm_transfer_payload_invalid");
    }

    return symbols;
  }

  if (symbolMode !== SymbolMode.RawUtf8) {
    throw new Error("tm_transfer_payload_invalid");
  }

  const decoder = new TextDecoder("utf-8", { fatal: true });
  const symbols = [DEFAULT_BLANK_SYMBOL];

  for (let symbolId = 1; symbolId < symbolCount; symbolId++) {
    const byteLength = reader.readVarUint();
    assertCollectionSize(byteLength);

    if (byteLength === 0) {
      throw new Error("tm_transfer_payload_invalid");
    }

    const bytes = Uint8Array.from({ length: byteLength }, () =>
      reader.readBits(8),
    );
    const symbol = decoder.decode(bytes);

    if (Array.from(symbol).length !== 1 || symbols.includes(symbol)) {
      throw new Error("tm_transfer_payload_invalid");
    }

    symbols.push(symbol);
  }

  return symbols;
}

function readTransitionCells(
  reader: BitReader,
  transitionMode: number,
  cellCount: number,
  stateBits: number,
  symbolBits: number,
  stateCount: number,
  symbolCount: number,
): Array<NormalizedTransition | undefined> {
  const isSparse =
    transitionMode === TransitionMode.SparseRaw ||
    transitionMode === TransitionMode.SparseDictionary;
  const usesDictionary =
    transitionMode === TransitionMode.DenseDictionary ||
    transitionMode === TransitionMode.SparseDictionary;

  if (
    transitionMode < TransitionMode.DenseRaw ||
    transitionMode > TransitionMode.SparseDictionary
  ) {
    throw new Error("tm_transfer_payload_invalid");
  }

  const dictionary = usesDictionary
    ? readTransitionDictionary(
        reader,
        stateBits,
        symbolBits,
        stateCount,
        symbolCount,
      )
    : [];
  const dictionaryBits = bitsNeeded(dictionary.length);

  return Array.from({ length: cellCount }, () => {
    if (isSparse && reader.readBit() === 0) {
      return undefined;
    }

    if (usesDictionary) {
      if (dictionary.length === 0) {
        throw new Error("tm_transfer_payload_invalid");
      }

      const dictionaryIndex = reader.readBits(dictionaryBits);
      assertIdInRange(dictionaryIndex, dictionary.length);
      return dictionary[dictionaryIndex];
    }

    return readTransition(
      reader,
      stateBits,
      symbolBits,
      stateCount,
      symbolCount,
    );
  });
}

function readTransitionDictionary(
  reader: BitReader,
  stateBits: number,
  symbolBits: number,
  stateCount: number,
  symbolCount: number,
): NormalizedTransition[] {
  const dictionaryLength = reader.readVarUint();
  assertCollectionSize(dictionaryLength);

  const dictionary = Array.from({ length: dictionaryLength }, () =>
    readTransition(reader, stateBits, symbolBits, stateCount, symbolCount),
  );

  if (new Set(dictionary.map(transitionKey)).size !== dictionaryLength) {
    throw new Error("tm_transfer_payload_invalid");
  }

  return dictionary;
}

function readTransition(
  reader: BitReader,
  stateBits: number,
  symbolBits: number,
  stateCount: number,
  symbolCount: number,
): NormalizedTransition {
  const nextState = reader.readBits(stateBits);
  const writeSymbol = reader.readBits(symbolBits);
  const movementId = reader.readBits(2);

  assertIdInRange(nextState, stateCount);
  assertIdInRange(writeSymbol, symbolCount);

  return {
    nextState,
    writeSymbol,
    movement: idToMovement(movementId),
  };
}

function createCanonicalStateNames(
  nonHaltStateCount: number,
  haltStateCount: number,
): string[] {
  const states = Array.from(
    { length: nonHaltStateCount },
    (_, stateId) => `q${stateId}`,
  );

  if (haltStateCount === 1) {
    states.push("qS");
  } else {
    states.push(
      ...Array.from(
        { length: haltStateCount },
        (_, haltStateId) => `qH${haltStateId}`,
      ),
    );
  }

  return states;
}

function movementToId(movement: HeadMovement): number {
  switch (movement) {
    case "L":
      return 0;
    case "R":
      return 1;
    case "N":
      return 2;
  }
}

function idToMovement(movementId: number): HeadMovement {
  switch (movementId) {
    case 0:
      return "L";
    case 1:
      return "R";
    case 2:
      return "N";
    default:
      throw new Error("tm_transfer_payload_invalid");
  }
}

function bitsNeeded(count: number): number {
  return count <= 1 ? 0 : Math.floor(Math.log2(count - 1)) + 1;
}

function transitionKey(transition: NormalizedTransition): string {
  return `${transition.nextState}:${transition.writeSymbol}:${transition.movement}`;
}

function appendUnique(target: string[], values: string[]): void {
  for (const value of values) {
    if (!target.includes(value)) {
      target.push(value);
    }
  }
}

function getRequiredMapValue<TKey, TValue>(
  map: Map<TKey, TValue>,
  key: TKey,
): TValue {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error("tm_transfer_program_invalid");
  }
  return value;
}

function assertCollectionSize(value: number): void {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > MAX_COLLECTION_SIZE
  ) {
    throw new Error("tm_transfer_payload_invalid");
  }
}

function assertIdInRange(value: number, count: number): void {
  if (!Number.isSafeInteger(value) || value < 0 || value >= count) {
    throw new Error("tm_transfer_payload_invalid");
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
      throw new Error("tm_transfer_program_invalid");
    }

    for (let bitIndex = bitCount - 1; bitIndex >= 0; bitIndex--) {
      this.writeBit(Math.floor(value / 2 ** bitIndex) % 2);
    }
  }

  writeVarUint(value: number): void {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error("tm_transfer_program_invalid");
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
      throw new Error("tm_transfer_payload_invalid");
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
      throw new Error("tm_transfer_payload_invalid");
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
        throw new Error("tm_transfer_payload_invalid");
      }

      if (byte < 128) {
        return value;
      }

      multiplier *= 128;
    }

    throw new Error("tm_transfer_payload_invalid");
  }

  assertOnlyPaddingRemains(): void {
    const remainingBits = this.bits.slice(this.offset);
    if (remainingBits.length > 5 || remainingBits.some((bit) => bit !== 0)) {
      throw new Error("tm_transfer_payload_invalid");
    }
  }
}
