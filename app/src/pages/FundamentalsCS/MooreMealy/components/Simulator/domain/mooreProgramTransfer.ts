import { BitReader, BitWriter } from "@/lib/trainingCenter";
import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";
import {
  bitsNeeded,
  hasUniqueNonEmptyValues,
  MAX_COLLECTION_SIZE,
} from "./programCommon";
import type { MooreProgram } from "./mooreTypes";

const FORMAT_VERSION = 0;
const MAX_STRING_BYTES = 4096;

export const mooreProgramTransferCodec: ISimulatorTransferCodec<MooreProgram> =
  {
    async exportValue(program) {
      assertTransferableProgram(program);
      const writer = new BitWriter("moore_transfer_program_invalid");
      const stateBits = bitsNeeded(program.states.length);
      const inputBits = bitsNeeded(program.inputSymbols.length);
      const stateIds = new Map(
        program.states.map((state, index) => [state, index]),
      );
      const inputIds = new Map(
        program.inputSymbols.map((symbol, index) => [symbol, index]),
      );

      writer.writeBits(FORMAT_VERSION, 2);
      writer.writeBit(program.representation === "binary" ? 1 : 0);
      writer.writeVarUint(program.states.length);
      writer.writeVarUint(program.inputSymbols.length);
      writer.writeVarUint(program.inputWord.length);
      writer.writeBits(
        getRequiredValue(stateIds, program.initialState),
        stateBits,
      );

      for (const state of program.states) {
        writeString(writer, state);
      }
      for (const symbol of program.inputSymbols) {
        writeString(writer, symbol);
      }

      writeOutputs(writer, program);
      writeTransitions(writer, program, stateIds, stateBits);
      writeInputWord(writer, program.inputWord, inputIds, inputBits);

      return writer.toBase64Url();
    },

    async importValue(serializedValue) {
      try {
        const reader = BitReader.fromBase64Url(
          serializedValue.trim(),
          "moore_transfer_payload_invalid",
        );
        const version = reader.readBits(2);
        if (version !== FORMAT_VERSION) {
          throw new Error("moore_transfer_version_invalid");
        }

        const representation = reader.readBit() === 1 ? "binary" : "decimal";
        const stateCount = reader.readVarUint();
        const inputCount = reader.readVarUint();
        const inputWordLength = reader.readVarUint();
        assertCollectionSize(stateCount);
        assertCollectionSize(inputCount);
        assertCollectionSize(inputWordLength);
        if (stateCount < 1) {
          throw new Error("moore_transfer_payload_invalid");
        }

        const stateBits = bitsNeeded(stateCount);
        const inputBits = bitsNeeded(inputCount);
        const initialStateId = reader.readBits(stateBits);
        assertId(initialStateId, stateCount);

        const states = Array.from({ length: stateCount }, () =>
          readString(reader),
        );
        const inputSymbols = Array.from({ length: inputCount }, () =>
          readString(reader),
        );
        if (
          !hasUniqueNonEmptyValues(states) ||
          !hasUniqueNonEmptyValues(inputSymbols)
        ) {
          throw new Error("moore_transfer_payload_invalid");
        }

        const outputs = readOutputs(reader, states);
        const transitions = readTransitions(
          reader,
          states,
          inputSymbols,
          stateBits,
          stateCount,
        );
        const inputWord = readInputWord(
          reader,
          inputSymbols,
          inputBits,
          inputWordLength,
          inputCount,
        );

        reader.assertOnlyPaddingRemains();
        return {
          states,
          inputSymbols,
          transitions,
          outputs,
          initialState: states[initialStateId],
          inputWord,
          representation,
        };
      } catch {
        throw new Error("moore_transfer_payload_invalid");
      }
    },
  };

function writeOutputs(writer: BitWriter, program: MooreProgram): void {
  for (const state of program.states) {
    const output = program.outputs[state] ?? { symbol: "", code: 0 };
    writeString(writer, output.symbol);
    writer.writeVarUint(output.code);
  }
}

function writeTransitions(
  writer: BitWriter,
  program: MooreProgram,
  stateIds: Map<string, number>,
  stateBits: number,
): void {
  for (const inputSymbol of program.inputSymbols) {
    for (const state of program.states) {
      const target = program.transitions[inputSymbol]?.[state];
      if (!target || !stateIds.has(target)) {
        writer.writeBit(0);
      } else {
        writer.writeBit(1);
        writer.writeBits(getRequiredValue(stateIds, target), stateBits);
      }
    }
  }
}

function writeInputWord(
  writer: BitWriter,
  inputWord: string[],
  inputIds: Map<string, number>,
  inputBits: number,
): void {
  for (const symbol of inputWord) {
    writer.writeBits(getRequiredValue(inputIds, symbol), inputBits);
  }
}

function readOutputs(
  reader: BitReader,
  states: string[],
): MooreProgram["outputs"] {
  const outputs: MooreProgram["outputs"] = {};
  for (const state of states) {
    outputs[state] = {
      symbol: readString(reader),
      code: reader.readVarUint(),
    };
  }
  return outputs;
}

function readTransitions(
  reader: BitReader,
  states: string[],
  inputSymbols: string[],
  stateBits: number,
  stateCount: number,
): MooreProgram["transitions"] {
  const transitions: MooreProgram["transitions"] = {};
  for (const inputSymbol of inputSymbols) {
    transitions[inputSymbol] = {};
    for (const state of states) {
      if (reader.readBit() === 1) {
        const targetId = reader.readBits(stateBits);
        assertId(targetId, stateCount);
        transitions[inputSymbol][state] = states[targetId];
      }
    }
  }
  return transitions;
}

function readInputWord(
  reader: BitReader,
  inputSymbols: string[],
  inputBits: number,
  inputWordLength: number,
  inputCount: number,
): string[] {
  if (inputCount === 0 && inputWordLength > 0) {
    throw new Error("moore_transfer_payload_invalid");
  }
  return Array.from({ length: inputWordLength }, () => {
    const symbolId = reader.readBits(inputBits);
    assertId(symbolId, inputCount);
    return inputSymbols[symbolId];
  });
}

function assertTransferableProgram(program: MooreProgram): void {
  assertCollectionSize(program.states.length);
  assertCollectionSize(program.inputSymbols.length);
  assertCollectionSize(program.inputWord.length);
  if (
    program.states.length < 1 ||
    !hasUniqueNonEmptyValues(program.states) ||
    !hasUniqueNonEmptyValues(program.inputSymbols) ||
    !program.states.includes(program.initialState) ||
    program.inputWord.some(
      (symbol) => !program.inputSymbols.includes(symbol),
    ) ||
    program.states.some((state) => {
      const output = program.outputs[state];
      return (
        !output ||
        !Number.isSafeInteger(output.code) ||
        output.code < 0 ||
        new TextEncoder().encode(output.symbol).length > MAX_STRING_BYTES
      );
    })
  ) {
    throw new Error("moore_transfer_program_invalid");
  }
}

function writeString(writer: BitWriter, value: string): void {
  const bytes = new TextEncoder().encode(value);
  if (bytes.length > MAX_STRING_BYTES) {
    throw new Error("moore_transfer_program_invalid");
  }
  writer.writeVarUint(bytes.length);
  for (const byte of bytes) {
    writer.writeBits(byte, 8);
  }
}

function readString(reader: BitReader): string {
  const length = reader.readVarUint();
  if (length > MAX_STRING_BYTES) {
    throw new Error("moore_transfer_payload_invalid");
  }
  const bytes = Uint8Array.from({ length }, () => reader.readBits(8));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function assertCollectionSize(value: number): void {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > MAX_COLLECTION_SIZE
  ) {
    throw new Error("moore_transfer_payload_invalid");
  }
}

function assertId(value: number, count: number): void {
  if (!Number.isSafeInteger(value) || value < 0 || value >= count) {
    throw new Error("moore_transfer_payload_invalid");
  }
}

function getRequiredValue<TKey, TValue>(
  map: Map<TKey, TValue>,
  key: TKey,
): TValue {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error("moore_transfer_program_invalid");
  }
  return value;
}
