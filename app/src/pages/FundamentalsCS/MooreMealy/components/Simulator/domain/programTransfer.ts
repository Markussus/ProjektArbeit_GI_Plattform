import { BitReader, BitWriter } from "@/lib/trainingCenter";
import { bitsNeeded, MAX_COLLECTION_SIZE } from "./programCommon";

export { bitsNeeded };

export const FORMAT_VERSION = 0;
export const MAX_STRING_BYTES = 4096;

export function writeString(
  writer: BitWriter,
  value: string,
  errorKey: string,
): void {
  const bytes = new TextEncoder().encode(value);
  if (bytes.length > MAX_STRING_BYTES) {
    throw new Error(errorKey);
  }
  writer.writeVarUint(bytes.length);
  for (const byte of bytes) {
    writer.writeBits(byte, 8);
  }
}

export function readString(reader: BitReader, errorKey: string): string {
  const length = reader.readVarUint();
  if (length > MAX_STRING_BYTES) {
    throw new Error(errorKey);
  }
  const bytes = Uint8Array.from({ length }, () => reader.readBits(8));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function writeTransitions(
  writer: BitWriter,
  transitions: Record<string, Record<string, string>>,
  inputSymbols: string[],
  states: string[],
  stateIds: Map<string, number>,
  stateBits: number,
  errorKey: string,
): void {
  for (const inputSymbol of inputSymbols) {
    for (const state of states) {
      const target = transitions[inputSymbol]?.[state];
      if (!target || !stateIds.has(target)) {
        writer.writeBit(0);
      } else {
        writer.writeBit(1);
        writer.writeBits(
          getRequiredValue(stateIds, target, errorKey),
          stateBits,
        );
      }
    }
  }
}

export function readTransitions(
  reader: BitReader,
  states: string[],
  inputSymbols: string[],
  stateBits: number,
  stateCount: number,
  errorKey: string,
): Record<string, Record<string, string>> {
  const transitions: Record<string, Record<string, string>> = {};
  for (const inputSymbol of inputSymbols) {
    transitions[inputSymbol] = {};
    for (const state of states) {
      if (reader.readBit() === 1) {
        const targetId = reader.readBits(stateBits);
        assertId(targetId, stateCount, errorKey);
        transitions[inputSymbol][state] = states[targetId];
      }
    }
  }
  return transitions;
}

export function writeInputWord(
  writer: BitWriter,
  inputWord: string[],
  inputIds: Map<string, number>,
  inputBits: number,
  errorKey: string,
): void {
  for (const symbol of inputWord) {
    writer.writeBits(getRequiredValue(inputIds, symbol, errorKey), inputBits);
  }
}

export function readInputWord(
  reader: BitReader,
  inputSymbols: string[],
  inputBits: number,
  inputWordLength: number,
  inputCount: number,
  errorKey: string,
): string[] {
  if (inputCount === 0 && inputWordLength > 0) {
    throw new Error(errorKey);
  }
  return Array.from({ length: inputWordLength }, () => {
    const symbolId = reader.readBits(inputBits);
    assertId(symbolId, inputCount, errorKey);
    return inputSymbols[symbolId];
  });
}

export function assertCollectionSize(value: number, errorKey: string): void {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > MAX_COLLECTION_SIZE
  ) {
    throw new Error(errorKey);
  }
}

export function assertId(value: number, count: number, errorKey: string): void {
  if (!Number.isSafeInteger(value) || value < 0 || value >= count) {
    throw new Error(errorKey);
  }
}

export function getRequiredValue<TKey, TValue>(
  map: Map<TKey, TValue>,
  key: TKey,
  errorKey: string,
): TValue {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(errorKey);
  }
  return value;
}
