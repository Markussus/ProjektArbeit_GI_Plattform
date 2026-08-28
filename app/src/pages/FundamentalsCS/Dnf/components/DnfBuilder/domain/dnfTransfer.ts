import { BitReader, BitWriter } from "@/lib/trainingCenter/bitStream";
import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";
import type { TruthTableAnswer } from "./dnfExerciseCheck";

const TRANSFER_PREFIX = "D";
const FORMAT_VERSION = 3;
const FORMAT_VERSION_BITS = 3;
const TRANSFER_MODE_BITS = 2;
const MAX_TEXT_BYTES = 100_000;
const MAX_TRUTH_TABLE_ANSWERS = 256;
const MIN_VARIABLE_COUNT = 1;
// Matches MAX_DNF_VARIABLE_COUNT — see dnfAnalysis.ts for the rationale.
// Only a validation bound (the count is varuint-encoded), so changing it keeps
// the transfer format intact and just accepts or rejects different payloads.
const MAX_VARIABLE_COUNT = 4;

const TransferMode = {
  ExpressionToTruthTable: 0,
  TruthTableToDnf: 1,
  ExerciseAttempt: 2,
} as const;
type TransferMode = (typeof TransferMode)[keyof typeof TransferMode];

export interface DnfAttemptTransferDraft {
  truthTableAnswers: TruthTableAnswer[];
  dnfAnswer: string;
  simplificationAnswer: string;
}

export interface DnfExpressionTransferValue extends DnfAttemptTransferDraft {
  mode: "expression_to_truth_table";
  expression: string;
  committed: boolean;
}

export interface DnfTruthTableTransferValue extends DnfAttemptTransferDraft {
  mode: "truth_table_to_dnf";
  variableCount: number;
  resultValues: boolean[];
  committed: boolean;
}

export interface DnfExerciseTransferValue extends DnfAttemptTransferDraft {
  mode: "exercise_attempt";
}

export type DnfTransferValue =
  | DnfExpressionTransferValue
  | DnfTruthTableTransferValue
  | DnfExerciseTransferValue;

export type DnfTruthTableTransferDraft = Omit<
  DnfTruthTableTransferValue,
  "mode"
>;

export type DnfExpressionTransferDraft = Omit<
  DnfExpressionTransferValue,
  "mode"
>;

export type DnfExerciseTransferDraft = Omit<DnfExerciseTransferValue, "mode">;

export function createDnfAttemptDraft(
  attempt?: DnfAttemptTransferDraft,
): DnfAttemptTransferDraft {
  return {
    truthTableAnswers: [...(attempt?.truthTableAnswers ?? [])],
    dnfAnswer: attempt?.dnfAnswer ?? "",
    simplificationAnswer: attempt?.simplificationAnswer ?? "",
  };
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: true });

export const dnfTransferCodec: ISimulatorTransferCodec<DnfTransferValue> = {
  exportValue(value) {
    const writer = new BitWriter("dnf_transfer_value_invalid");

    writer.writeBits(FORMAT_VERSION, FORMAT_VERSION_BITS);

    if (value.mode === "expression_to_truth_table") {
      validateAttempt(value);
      writer.writeBits(TransferMode.ExpressionToTruthTable, TRANSFER_MODE_BITS);
      writeUtf8String(writer, value.expression.trim());
      writer.writeBit(value.committed ? 1 : 0);
      writeAttempt(writer, value);
      return `${TRANSFER_PREFIX}${writer.toBase64Url()}`;
    }

    if (value.mode === "truth_table_to_dnf") {
      validateTruthTable(value.variableCount, value.resultValues);
      validateAttempt(value);
      writer.writeBits(TransferMode.TruthTableToDnf, TRANSFER_MODE_BITS);
      writer.writeVarUint(value.variableCount);
      for (const resultValue of value.resultValues) {
        writer.writeBit(resultValue ? 1 : 0);
      }
      writer.writeBit(value.committed ? 1 : 0);
      writeAttempt(writer, value);

      return `${TRANSFER_PREFIX}${writer.toBase64Url()}`;
    }

    validateAttempt(value);
    writer.writeBits(TransferMode.ExerciseAttempt, TRANSFER_MODE_BITS);
    writeAttempt(writer, value);

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
      const committed = reader.readBit() === 1;
      const attempt = readAttempt(reader);
      reader.assertOnlyPaddingRemains();
      return {
        mode: "expression_to_truth_table",
        expression: expression.trim(),
        committed,
        ...attempt,
      };
    }

    if (mode === TransferMode.TruthTableToDnf) {
      const variableCount = reader.readVarUint();
      validateVariableCount(variableCount, "dnf_transfer_payload_invalid");
      const resultValues = Array.from(
        { length: getExpectedResultCount(variableCount) },
        () => reader.readBit() === 1,
      );

      const committed = reader.readBit() === 1;
      const attempt = readAttempt(reader);
      reader.assertOnlyPaddingRemains();
      validateTruthTable(variableCount, resultValues);
      return {
        mode: "truth_table_to_dnf",
        variableCount,
        resultValues,
        committed,
        ...attempt,
      };
    }

    if (mode === TransferMode.ExerciseAttempt) {
      const attempt = readAttempt(reader);

      reader.assertOnlyPaddingRemains();
      const value: DnfExerciseTransferValue = {
        mode: "exercise_attempt",
        ...attempt,
      };
      validateAttempt(value);
      return value;
    }

    throw new Error("dnf_transfer_payload_invalid");
  },
};

export const dnfExpressionTransferCodec: ISimulatorTransferCodec<DnfExpressionTransferDraft> =
  {
    exportValue(value) {
      return dnfTransferCodec.exportValue({
        mode: "expression_to_truth_table",
        ...value,
      });
    },

    async importValue(serializedValue) {
      const value = await dnfTransferCodec.importValue(serializedValue);
      if (value.mode !== "expression_to_truth_table") {
        throw new Error("dnf_transfer_mode_invalid");
      }

      return {
        expression: value.expression,
        committed: value.committed,
        ...createDnfAttemptDraft(value),
      };
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
        committed: value.committed,
        ...createDnfAttemptDraft(value),
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

      return createDnfAttemptDraft(value);
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

function writeAttempt(writer: BitWriter, value: DnfAttemptTransferDraft): void {
  writer.writeVarUint(value.truthTableAnswers.length);
  for (const answer of value.truthTableAnswers) {
    writer.writeBits(answer === null ? 0 : answer ? 2 : 1, 2);
  }
  writeUtf8String(writer, value.dnfAnswer);
  writeUtf8String(writer, value.simplificationAnswer);
}

function readAttempt(reader: BitReader): DnfAttemptTransferDraft {
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

  return {
    truthTableAnswers,
    dnfAnswer: readUtf8String(reader),
    simplificationAnswer: readUtf8String(reader),
  };
}

function validateAttempt(value: DnfAttemptTransferDraft): void {
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
