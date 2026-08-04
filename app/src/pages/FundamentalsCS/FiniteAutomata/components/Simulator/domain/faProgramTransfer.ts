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

const PROGRAM_INVALID = "fa_transfer_program_invalid";
const PAYLOAD_INVALID = "fa_transfer_payload_invalid";

const MAX_TRANSITION_CELLS = 10_000_000;

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

function normalizeProgram(program: FAProgram): NormalizedProgram {
  const isNFA = program.type === "NFA";

  if (
    program.states.length === 0 ||
    !program.states.includes(program.startState) ||
    new Set(program.states).size !== program.states.length ||
    new Set(program.alphabet).size !== program.alphabet.length
  ) {
    throw new Error(PROGRAM_INVALID);
  }

  // State ID 0 is always the start state; the rest keep declaration order.
  const orderedStates = [
    program.startState,
    ...program.states.filter((state) => state !== program.startState),
  ];
  const stateIds = new Map(orderedStates.map((state, index) => [state, index]));

  const symbolMode = symbolDictionary.chooseMode(program.alphabet);
  const symbols = symbolDictionary.order(program.alphabet, symbolMode);
  const acceptStates = new Set(program.acceptStates);
  const acceptMask = orderedStates.map((state) => acceptStates.has(state));

  const readableSymbolCount = countReadableSymbols(symbols.length, isNFA);
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

    // Rows with no transitions at all are skipped entirely — the row mask
    // written above records which ones made it into the payload.
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

function decodeProgram(serializedProgram: string): FAProgram {
  const reader = BitReader.fromBase64Url(serializedProgram, PAYLOAD_INVALID);
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
  const symbols = symbolDictionary.read(reader, symbolMode, symbolCount);

  const readableSymbolCount = countReadableSymbols(symbolCount, isNFA);
  const readableSymbolIds: number[] = [];
  for (let symbolId = 0; symbolId < readableSymbolCount; symbolId++) {
    if (reader.readBit() === 1) {
      readableSymbolIds.push(symbolId);
    }
  }

  const possibleCellCount = readableSymbolIds.length * stateCount;
  assertCollectionSize(
    possibleCellCount,
    PAYLOAD_INVALID,
    MAX_TRANSITION_CELLS,
  );

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
    throw new Error(PAYLOAD_INVALID);
  }

  return program;
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
