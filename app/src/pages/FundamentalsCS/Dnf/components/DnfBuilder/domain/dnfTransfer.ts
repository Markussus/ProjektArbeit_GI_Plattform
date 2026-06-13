import { BitReader, BitWriter } from "@/lib/trainingCenter/bitStream";
import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";
import type { TruthTableAnswer } from "./dnfExerciseCheck";

const TRANSFER_PREFIX = "D";
const FORMAT_VERSION = 2;
const FORMAT_VERSION_BITS = 3;
const TRANSFER_MODE_BITS = 2;
const MAX_TEXT_BYTES = 100_000;
const MAX_TRUTH_TABLE_ANSWERS = 256;
const MIN_VARIABLE_COUNT = 1;
const MAX_VARIABLE_COUNT = 8;

const TransferMode = {
  ExpressionToTruthTable: 0,
  TruthTableToDnf: 1,
  ExerciseAttempt: 2,
} as const;
type TransferMode = (typeof TransferMode)[keyof typeof TransferMode];

export interface DnfExpressionTransferValue {
  mode: "expression_to_truth_table";
  expression: string;
}

export interface DnfTruthTableTransferValue {
  mode: "truth_table_to_dnf";
  variableCount: number;
  resultValues: boolean[];
}

export interface DnfExerciseTransferValue {
  mode: "exercise_attempt";
  truthTableAnswers: TruthTableAnswer[];
  dnfAnswer: string;
  simplificationAnswer: string;
}

export type DnfTransferValue =
  | DnfExpressionTransferValue
  | DnfTruthTableTransferValue
  | DnfExerciseTransferValue;

export type DnfTruthTableTransferDraft = Omit<
  DnfTruthTableTransferValue,
  "mode"
>;

export type DnfExerciseTransferDraft = Omit<DnfExerciseTransferValue, "mode">;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: true });

export const dnfTransferCodec: ISimulatorTransferCodec<DnfTransferValue> = {
  exportValue(value) {
    const writer = new BitWriter("dnf_transfer_value_invalid");

    writer.writeBits(FORMAT_VERSION, FORMAT_VERSION_BITS);

    if (value.mode === "expression_to_truth_table") {
      writer.writeBits(TransferMode.ExpressionToTruthTable, TRANSFER_MODE_BITS);
      writeUtf8String(writer, value.expression.trim());
      return `${TRANSFER_PREFIX}${writer.toBase64Url()}`;
    }

    if (value.mode === "truth_table_to_dnf") {
      validateTruthTable(value.variableCount, value.resultValues);
      writer.writeBits(TransferMode.TruthTableToDnf, TRANSFER_MODE_BITS);
      writer.writeVarUint(value.variableCount);
      for (const resultValue of value.resultValues) {
        writer.writeBit(resultValue ? 1 : 0);
      }

      return `${TRANSFER_PREFIX}${writer.toBase64Url()}`;
    }

    validateExerciseAttempt(value);
    writer.writeBits(TransferMode.ExerciseAttempt, TRANSFER_MODE_BITS);
    writer.writeVarUint(value.truthTableAnswers.length);
    for (const answer of value.truthTableAnswers) {
      writer.writeBits(answer === null ? 0 : answer ? 2 : 1, 2);
    }
    writeUtf8String(writer, value.dnfAnswer);
    writeUtf8String(writer, value.simplificationAnswer);

    return `${TRANSFER_PREFIX}${writer.toBase64Url()}`;
  },

  importValue(serializedValue) {
    const normalizedValue = serializedValue.trim();
    if (!normalizedValue.startsWith(TRANSFER_PREFIX)) {
      throw new Error("dnf_transfer_payload_invalid");
    }

    const reader = BitReader.fromBase64Url(
      normalizedValue.slice(TRANSFER_PREFIX.length),
      "dnf_transfer_payload_invalid",
    );
    const version = reader.readBits(FORMAT_VERSION_BITS);
    if (version !== FORMAT_VERSION) {
      throw new Error("dnf_transfer_payload_invalid");
    }

    const mode = reader.readBits(TRANSFER_MODE_BITS) as TransferMode;
    if (mode === TransferMode.ExpressionToTruthTable) {
      const expression = readUtf8String(reader);
      reader.assertOnlyPaddingRemains();
      return {
        mode: "expression_to_truth_table",
        expression: expression.trim(),
      };
    }

    if (mode === TransferMode.TruthTableToDnf) {
      const variableCount = reader.readVarUint();
      validateVariableCount(variableCount, "dnf_transfer_payload_invalid");
      const resultValues = Array.from(
        { length: getExpectedResultCount(variableCount) },
        () => reader.readBit() === 1,
      );

      reader.assertOnlyPaddingRemains();
      validateTruthTable(variableCount, resultValues);
      return {
        mode: "truth_table_to_dnf",
        variableCount,
        resultValues,
      };
    }

    if (mode === TransferMode.ExerciseAttempt) {
      const answerCount = reader.readVarUint();
      if (answerCount > MAX_TRUTH_TABLE_ANSWERS) {
        throw new Error("dnf_transfer_payload_invalid");
      }

      const truthTableAnswers = Array.from({ length: answerCount }, () => {
        const answer = reader.readBits(2);
        if (answer === 0) return null;
        if (answer === 1) return false;
        if (answer === 2) return true;
        throw new Error("dnf_transfer_payload_invalid");
      });
      const dnfAnswer = readUtf8String(reader);
      const simplificationAnswer = readUtf8String(reader);

      reader.assertOnlyPaddingRemains();
      const value: DnfExerciseTransferValue = {
        mode: "exercise_attempt",
        truthTableAnswers,
        dnfAnswer,
        simplificationAnswer,
      };
      validateExerciseAttempt(value);
      return value;
    }

    throw new Error("dnf_transfer_payload_invalid");
  },
};

export const dnfExpressionTransferCodec: ISimulatorTransferCodec<string> = {
  exportValue(expression) {
    return dnfTransferCodec.exportValue({
      mode: "expression_to_truth_table",
      expression,
    });
  },

  async importValue(serializedValue) {
    const value = await dnfTransferCodec.importValue(serializedValue);
    if (value.mode !== "expression_to_truth_table") {
      throw new Error("dnf_transfer_mode_invalid");
    }

    return value.expression;
  },
};

export const dnfTruthTableTransferCodec: ISimulatorTransferCodec<DnfTruthTableTransferDraft> =
  {
    exportValue(value) {
      return dnfTransferCodec.exportValue({
        mode: "truth_table_to_dnf",
        ...value,
      });
    },

    async importValue(serializedValue) {
      const value = await dnfTransferCodec.importValue(serializedValue);
      if (value.mode !== "truth_table_to_dnf") {
        throw new Error("dnf_transfer_mode_invalid");
      }

      return {
        variableCount: value.variableCount,
        resultValues: value.resultValues,
      };
    },
  };

export const dnfExerciseTransferCodec: ISimulatorTransferCodec<DnfExerciseTransferDraft> =
  {
    exportValue(value) {
      return dnfTransferCodec.exportValue({
        mode: "exercise_attempt",
        ...value,
      });
    },

    async importValue(serializedValue) {
      const value = await dnfTransferCodec.importValue(serializedValue);
      if (value.mode !== "exercise_attempt") {
        throw new Error("dnf_transfer_mode_invalid");
      }

      return {
        truthTableAnswers: value.truthTableAnswers,
        dnfAnswer: value.dnfAnswer,
        simplificationAnswer: value.simplificationAnswer,
      };
    },
  };

function writeUtf8String(writer: BitWriter, value: string): void {
  const bytes = textEncoder.encode(value);
  if (bytes.length > MAX_TEXT_BYTES) {
    throw new Error("dnf_transfer_value_invalid");
  }

  writer.writeVarUint(bytes.length);
  for (const byte of bytes) {
    writer.writeBits(byte, 8);
  }
}

function readUtf8String(reader: BitReader): string {
  const byteLength = reader.readVarUint();
  if (byteLength > MAX_TEXT_BYTES) {
    throw new Error("dnf_transfer_payload_invalid");
  }

  const bytes = Uint8Array.from({ length: byteLength }, () =>
    reader.readBits(8),
  );

  try {
    return textDecoder.decode(bytes);
  } catch {
    throw new Error("dnf_transfer_payload_invalid");
  }
}

function validateExerciseAttempt(value: DnfExerciseTransferValue): void {
  if (
    value.truthTableAnswers.length > MAX_TRUTH_TABLE_ANSWERS ||
    value.truthTableAnswers.some(
      (answer) => answer !== null && answer !== true && answer !== false,
    )
  ) {
    throw new Error("dnf_transfer_value_invalid");
  }

  writeUtf8String(new BitWriter("dnf_transfer_value_invalid"), value.dnfAnswer);
  writeUtf8String(
    new BitWriter("dnf_transfer_value_invalid"),
    value.simplificationAnswer,
  );
}

function validateTruthTable(
  variableCount: number,
  resultValues: boolean[],
): void {
  if (
    !isSupportedVariableCount(variableCount) ||
    resultValues.length !== getExpectedResultCount(variableCount) ||
    resultValues.some((value) => typeof value !== "boolean")
  ) {
    throw new Error("dnf_transfer_value_invalid");
  }
}

function getExpectedResultCount(variableCount: number): number {
  validateVariableCount(variableCount, "dnf_transfer_value_invalid");

  return 2 ** variableCount;
}

function validateVariableCount(
  variableCount: number,
  errorMessage: string,
): void {
  if (!isSupportedVariableCount(variableCount)) {
    throw new Error(errorMessage);
  }
}

function isSupportedVariableCount(variableCount: number): boolean {
  return (
    Number.isInteger(variableCount) &&
    variableCount >= MIN_VARIABLE_COUNT &&
    variableCount <= MAX_VARIABLE_COUNT
  );
}
