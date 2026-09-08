import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";
import {
  BitReader,
  BitWriter,
  assertCollectionSize,
  createSymbolDictionaryCodec,
} from "@/lib/trainingCenter";
import {
  EPSILON,
  type AutomatonType,
  type FAProgram,
  type FATransitionMap,
} from "./faTypes";
import { isFAProgramValid } from "./faProgramValidation";

/** Error codes and the cell ceiling an oversized payload may not exceed. */
const PROGRAM_INVALID = "fa_transfer_program_invalid";
const PAYLOAD_INVALID = "fa_transfer_payload_invalid";

const MAX_TRANSITION_CELLS = 10_000_000;

/** Digits and a-f cost a few bits; other symbols fall back to code points. */
const symbolDictionary = createSymbolDictionaryCodec({
  registry: [
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
  ],
  payloadError: PAYLOAD_INVALID,
  // ε is written as its own transition row, never as an alphabet symbol.
  isReserved: (symbol) => symbol === EPSILON,
});

/** Table layout: dense writes every cell, sparse adds an occupancy bit. */
const TransitionMode = {
  Dense: 0,
  Sparse: 1,
} as const;
type TransitionMode = (typeof TransitionMode)[keyof typeof TransitionMode];

/** The program reduced to ids and masks — the form the bit writer works on. */
interface NormalizedProgram {
  stateCount: number;
  isNFA: boolean;
  symbols: string[];
  acceptMask: boolean[];
  readableSymbolIds: number[];
  transitionCells: number[][];
}

interface TransitionEncoding {
  mode: TransitionMode;
  bits: number[];
}

/** Compact transfer codec; only valid programs export, names are dropped. */
export const faProgramTransferCodec: ISimulatorTransferCodec<FAProgram> = {
  async exportValue(program) {
    const normalizedProgram = normalizeProgram(program);
    const writer = new BitWriter(PROGRAM_INVALID);
    const symbolMode = symbolDictionary.chooseMode(normalizedProgram.symbols);
    const transitionEncoding = chooseTransitionEncoding(normalizedProgram);

    writer.writeVarUint(normalizedProgram.stateCount);
    writer.writeVarUint(normalizedProgram.symbols.length);
    writer.writeBit(normalizedProgram.isNFA ? 1 : 0);
    writer.writeBits(symbolMode, 1);
    writer.writeBits(transitionEncoding.mode, 1);

    for (const isAccepting of normalizedProgram.acceptMask) {
      writer.writeBit(isAccepting ? 1 : 0);
    }

    symbolDictionary.write(writer, normalizedProgram.symbols, symbolMode);

    const readableSymbols = new Set(normalizedProgram.readableSymbolIds);
    const readableSymbolCount = countReadableSymbols(
      normalizedProgram.symbols.length,
      normalizedProgram.isNFA,
    );
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

/** The alphabet plus, for an NFA, the trailing ε row. */
function countReadableSymbols(symbolCount: number, isNFA: boolean): number {
  return symbolCount + (isNFA ? 1 : 0);
}

/**
 * The compact format assumes a well-formed program: at least one state, a start
 * state that exists, and no duplicate states or symbols.
 */
function canNormalize(program: FAProgram): boolean {
  return (
    program.states.length > 0 &&
    program.states.includes(program.startState) &&
    new Set(program.states).size === program.states.length &&
    new Set(program.alphabet).size === program.alphabet.length
  );
}

/**
 * Flatten the transition table into the row-major cell list the bitstream
 * writes. Rows with no transitions at all are skipped entirely — the row mask
 * records which ones made it into the payload.
 */
function buildTransitionRows(
  program: FAProgram,
  orderedStates: string[],
  stateIds: Map<string, number>,
  symbols: string[],
  isNFA: boolean,
): { readableSymbolIds: number[]; transitionCells: number[][] } {
  const readableSymbolIds: number[] = [];
  const transitionCells: number[][] = [];
  const readableSymbolCount = countReadableSymbols(symbols.length, isNFA);

  for (let symbolId = 0; symbolId < readableSymbolCount; symbolId++) {
    const symbol = symbolId < symbols.length ? symbols[symbolId] : EPSILON;
    const rowCells = orderedStates.map((state) =>
      collectCellTargets(program.transitions[state]?.[symbol], stateIds),
    );

    if (rowCells.some((targets) => targets.length > 0)) {
      readableSymbolIds.push(symbolId);
      transitionCells.push(...rowCells);
    }
  }

  return { readableSymbolIds, transitionCells };
}

/** Turn a valid program into ids and masks, with the start state as id 0. */
function normalizeProgram(program: FAProgram): NormalizedProgram {
  if (!canNormalize(program)) {
    throw new Error(PROGRAM_INVALID);
  }

  const isNFA = program.type === "NFA";

  // State ID 0 is always the start state; the rest keep declaration order.
  const orderedStates = [
    program.startState,
    ...program.states.filter((state) => state !== program.startState),
  ];
  const stateIds = new Map(orderedStates.map((state, index) => [state, index]));

  const symbolMode = symbolDictionary.chooseMode(program.alphabet);
  const symbols = symbolDictionary.order(program.alphabet, symbolMode);
  const acceptStates = new Set(program.acceptStates);

  const { readableSymbolIds, transitionCells } = buildTransitionRows(
    program,
    orderedStates,
    stateIds,
    symbols,
    isNFA,
  );

  return {
    stateCount: orderedStates.length,
    isNFA,
    symbols,
    acceptMask: orderedStates.map((state) => acceptStates.has(state)),
    readableSymbolIds,
    transitionCells,
  };
}

/** Target ids of one cell, deduplicated and sorted so encoding is stable. */
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

/** Try both layouts and keep whichever produced fewer bits. */
function chooseTransitionEncoding(
  program: NormalizedProgram,
): TransitionEncoding {
  const denseBits = encodeTransitions(program, false);
  const sparseBits = encodeTransitions(program, true);

  return sparseBits.length < denseBits.length
    ? { mode: TransitionMode.Sparse, bits: sparseBits }
    : { mode: TransitionMode.Dense, bits: denseBits };
}

/** Write every cell in row-major order, in the requested layout. */
function encodeTransitions(
  program: NormalizedProgram,
  sparse: boolean,
): number[] {
  const writer = new BitWriter(PROGRAM_INVALID);

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

/** One bit per state saying whether it is a target of this cell. */
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
    throw new Error(PAYLOAD_INVALID);
  }
}

/** Everything the payload states before its transition table begins. */
interface TransferHeader {
  stateCount: number;
  symbolCount: number;
  isNFA: boolean;
  isSparse: boolean;
  acceptMask: boolean[];
  symbols: string[];
}

/** Read the header, rejecting counts or modes the writer could not produce. */
function readTransferHeader(reader: BitReader): TransferHeader {
  const stateCount = reader.readVarUint();
  const symbolCount = reader.readVarUint();

  assertCollectionSize(stateCount, PAYLOAD_INVALID);
  assertCollectionSize(symbolCount, PAYLOAD_INVALID);
  if (stateCount < 1) {
    throw new Error(PAYLOAD_INVALID);
  }

  const isNFA = reader.readBit() === 1;
  const symbolMode = reader.readBits(1);
  const transitionMode = reader.readBits(1);

  if (
    transitionMode !== TransitionMode.Dense &&
    transitionMode !== TransitionMode.Sparse
  ) {
    throw new Error(PAYLOAD_INVALID);
  }

  const acceptMask = Array.from(
    { length: stateCount },
    () => reader.readBit() === 1,
  );

  return {
    stateCount,
    symbolCount,
    isNFA,
    isSparse: transitionMode === TransitionMode.Sparse,
    acceptMask,
    symbols: symbolDictionary.read(reader, symbolMode, symbolCount),
  };
}

/** The bitmask saying which symbol rows made it into the payload. */
function readReadableSymbolIds(
  reader: BitReader,
  header: TransferHeader,
): number[] {
  const readableSymbolCount = countReadableSymbols(
    header.symbolCount,
    header.isNFA,
  );

  const readableSymbolIds: number[] = [];
  for (let symbolId = 0; symbolId < readableSymbolCount; symbolId++) {
    if (reader.readBit() === 1) {
      readableSymbolIds.push(symbolId);
    }
  }

  assertCollectionSize(
    readableSymbolIds.length * header.stateCount,
    PAYLOAD_INVALID,
    MAX_TRANSITION_CELLS,
  );

  return readableSymbolIds;
}

/** Rebuild the transition table row by row, in the order it was written. */
function readTransitions(
  reader: BitReader,
  header: TransferHeader,
  readableSymbolIds: number[],
  states: string[],
): FATransitionMap {
  const transitions: FATransitionMap = {};
  for (const state of states) {
    transitions[state] = {};
  }

  for (const symbolId of readableSymbolIds) {
    const symbol =
      symbolId < header.symbolCount ? header.symbols[symbolId] : EPSILON;

    for (let stateId = 0; stateId < header.stateCount; stateId++) {
      const targets = readCell(reader, header.isSparse, header.stateCount);
      if (targets.length > 0) {
        transitions[states[stateId]][symbol] = targets.map(
          (targetId) => states[targetId],
        );
      }
    }
  }

  return transitions;
}

/** Rebuild a program from its payload, with canonical `S<n>` state names. */
function decodeProgram(serializedProgram: string): FAProgram {
  const reader = BitReader.fromBase64Url(serializedProgram, PAYLOAD_INVALID);
  const header = readTransferHeader(reader);
  const readableSymbolIds = readReadableSymbolIds(reader, header);

  const states = createCanonicalStateNames(header.stateCount);
  const transitions = readTransitions(
    reader,
    header,
    readableSymbolIds,
    states,
  );

  reader.assertOnlyPaddingRemains();

  const program: FAProgram = {
    type: (header.isNFA ? "NFA" : "DFA") satisfies AutomatonType,
    states,
    alphabet: header.symbols,
    transitions,
    startState: states[0],
    acceptStates: states.filter((_, stateId) => header.acceptMask[stateId]),
  };

  if (!isFAProgramValid(program)) {
    throw new Error(PAYLOAD_INVALID);
  }

  return program;
}

/** Read one transition cell back, honouring the sparse occupancy bit. */
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

/** `S0`… names for a decoded program, with `S0` the start state. */
function createCanonicalStateNames(stateCount: number): string[] {
  return Array.from({ length: stateCount }, (_, stateId) => `S${stateId}`);
}
