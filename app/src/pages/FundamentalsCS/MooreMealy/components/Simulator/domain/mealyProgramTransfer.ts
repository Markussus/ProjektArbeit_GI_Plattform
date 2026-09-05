import { BitReader, BitWriter } from "@/lib/trainingCenter";
import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";
import { bitsNeeded, hasUniqueNonEmptyValues } from "./programCommon";
import type { MealyProgram } from "./mealyTypes";
import {
  assertCollectionSize,
  assertId,
  FORMAT_VERSION,
  getRequiredValue,
  MAX_STRING_BYTES,
  readInputWord,
  readString,
  readTransitions,
  writeInputWord,
  writeString,
  writeTransitions,
} from "./programTransfer";

export const mealyProgramTransferCodec: ISimulatorTransferCodec<MealyProgram> =
  {
    async exportValue(program) {
      assertTransferableMealyProgram(program);
      const writer = new BitWriter("mealy_transfer_program_invalid");
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
        getRequiredValue(
          stateIds,
          program.initialState,
          "mealy_transfer_program_invalid",
        ),
        stateBits,
      );

      for (const state of program.states) {
        writeString(writer, state, "mealy_transfer_program_invalid");
      }
      for (const symbol of program.inputSymbols) {
        writeString(writer, symbol, "mealy_transfer_program_invalid");
      }

      writeMealyOutputs(writer, program);
      writeTransitions(
        writer,
        program.transitions,
        program.inputSymbols,
        program.states,
        stateIds,
        stateBits,
        "mealy_transfer_program_invalid",
      );
      writeInputWord(
        writer,
        program.inputWord,
        inputIds,
        inputBits,
        "mealy_transfer_program_invalid",
      );

      return writer.toBase64Url();
    },

    async importValue(serializedValue) {
      try {
        const reader = BitReader.fromBase64Url(
          serializedValue.trim(),
          "mealy_transfer_payload_invalid",
        );
        const version = reader.readBits(2);
        if (version !== FORMAT_VERSION) {
          throw new Error("mealy_transfer_version_invalid");
        }

        const representation = reader.readBit() === 1 ? "binary" : "decimal";
        const stateCount = reader.readVarUint();
        const inputCount = reader.readVarUint();
        const inputWordLength = reader.readVarUint();
        assertCollectionSize(stateCount, "mealy_transfer_payload_invalid");
        assertCollectionSize(inputCount, "mealy_transfer_payload_invalid");
        assertCollectionSize(inputWordLength, "mealy_transfer_payload_invalid");
        if (stateCount < 1) {
          throw new Error("mealy_transfer_payload_invalid");
        }

        const stateBits = bitsNeeded(stateCount);
        const inputBits = bitsNeeded(inputCount);
        const initialStateId = reader.readBits(stateBits);
        assertId(initialStateId, stateCount, "mealy_transfer_payload_invalid");

        const states = Array.from({ length: stateCount }, () =>
          readString(reader, "mealy_transfer_payload_invalid"),
        );
        const inputSymbols = Array.from({ length: inputCount }, () =>
          readString(reader, "mealy_transfer_payload_invalid"),
        );
        if (
          !hasUniqueNonEmptyValues(states) ||
          !hasUniqueNonEmptyValues(inputSymbols)
        ) {
          throw new Error("mealy_transfer_payload_invalid");
        }

        const outputs = readMealyOutputs(reader, states, inputSymbols);
        const transitions = readTransitions(
          reader,
          states,
          inputSymbols,
          stateBits,
          stateCount,
          "mealy_transfer_payload_invalid",
        );
        const inputWord = readInputWord(
          reader,
          inputSymbols,
          inputBits,
          inputWordLength,
          inputCount,
          "mealy_transfer_payload_invalid",
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
        throw new Error("mealy_transfer_payload_invalid");
      }
    },
  };

function writeMealyOutputs(writer: BitWriter, program: MealyProgram): void {
  for (const inputSymbol of program.inputSymbols) {
    for (const state of program.states) {
      const output = program.outputs[inputSymbol]?.[state] ?? {
        symbol: "",
        code: 0,
      };
      writeString(writer, output.symbol, "mealy_transfer_program_invalid");
      writer.writeVarUint(output.code);
    }
  }
}

function readMealyOutputs(
  reader: BitReader,
  states: string[],
  inputSymbols: string[],
): MealyProgram["outputs"] {
  const outputs: MealyProgram["outputs"] = {};
  for (const inputSymbol of inputSymbols) {
    outputs[inputSymbol] = {};
    for (const state of states) {
      outputs[inputSymbol][state] = {
        symbol: readString(reader, "mealy_transfer_payload_invalid"),
        code: reader.readVarUint(),
      };
    }
  }
  return outputs;
}

function assertTransferableMealyProgram(program: MealyProgram): void {
  assertCollectionSize(program.states.length, "mealy_transfer_program_invalid");
  assertCollectionSize(
    program.inputSymbols.length,
    "mealy_transfer_program_invalid",
  );
  assertCollectionSize(
    program.inputWord.length,
    "mealy_transfer_program_invalid",
  );
  if (
    program.states.length < 1 ||
    !hasUniqueNonEmptyValues(program.states) ||
    !hasUniqueNonEmptyValues(program.inputSymbols) ||
    !program.states.includes(program.initialState) ||
    program.inputWord.some(
      (symbol) => !program.inputSymbols.includes(symbol),
    ) ||
    program.inputSymbols.some((input) =>
      program.states.some((state) => {
        const output = program.outputs[input]?.[state];
        return (
          output !== undefined &&
          (!Number.isSafeInteger(output.code) ||
            output.code < 0 ||
            new TextEncoder().encode(output.symbol).length > MAX_STRING_BYTES)
        );
      }),
    )
  ) {
    throw new Error("mealy_transfer_program_invalid");
  }
}
