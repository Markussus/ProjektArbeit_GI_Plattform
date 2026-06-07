import {
  decodeBase64Utf8,
  encodeBase64Utf8,
  fromBase64Url,
  gzipCompressToBase64Url,
  gzipDecompressFromBase64Url,
  toBase64Url,
} from "@/lib/utils";
import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";
import { withDerivedAlphabets, type TMProgram } from "./tmProgram";
import { isTMProgramValid } from "./tmProgramValidation";
import type { HeadMovement, TMTransition } from "./tmTypes";

const GZIP_FORMAT_PREFIX = "tm1.";
const UTF8_FORMAT_PREFIX = "tm0.";

export const tmProgramTransferCodec: ISimulatorTransferCodec<TMProgram> = {
  async exportValue(program) {
    const serializedProgram = JSON.stringify(program);

    if (
      typeof CompressionStream === "undefined" ||
      typeof DecompressionStream === "undefined"
    ) {
      return `${UTF8_FORMAT_PREFIX}${toBase64Url(
        encodeBase64Utf8(serializedProgram),
      )}`;
    }

    return `${GZIP_FORMAT_PREFIX}${await gzipCompressToBase64Url(
      serializedProgram,
    )}`;
  },
  async importValue(serializedValue) {
    const normalizedValue = serializedValue.trim();
    let serializedProgram: string;

    if (normalizedValue.startsWith(GZIP_FORMAT_PREFIX)) {
      serializedProgram = await gzipDecompressFromBase64Url(
        normalizedValue.slice(GZIP_FORMAT_PREFIX.length),
      );
    } else if (normalizedValue.startsWith(UTF8_FORMAT_PREFIX)) {
      serializedProgram = decodeBase64Utf8(
        fromBase64Url(normalizedValue.slice(UTF8_FORMAT_PREFIX.length)),
      );
    } else {
      throw new Error("tm_transfer_prefix_invalid");
    }

    return restoreImportedProgram(serializedProgram);
  },
};

function restoreImportedProgram(serializedProgram: string): TMProgram {
  const parsedProgram: unknown = JSON.parse(serializedProgram);

  if (!isTMProgramShape(parsedProgram)) {
    throw new Error("tm_transfer_shape_invalid");
  }

  const program = withDerivedAlphabets(parsedProgram);
  if (!isTMProgramValid(program)) {
    throw new Error("tm_transfer_program_invalid");
  }

  return program;
}

function isTMProgramShape(value: unknown): value is TMProgram {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isStringArray(value.states) &&
    isStringArray(value.inputAlphabet) &&
    isStringArray(value.tapeAlphabet) &&
    typeof value.blankSymbol === "string" &&
    typeof value.initialState === "string" &&
    isStringArray(value.haltStates) &&
    isTransitionTable(value.transitions) &&
    isStringArray(value.initialTape)
  );
}

function isTransitionTable(value: unknown): value is TMProgram["transitions"] {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every((stateTransitions) => {
    if (!isRecord(stateTransitions)) {
      return false;
    }

    return Object.values(stateTransitions).every(isTMTransition);
  });
}

function isTMTransition(value: unknown): value is TMTransition {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.nextState === "string" &&
    typeof value.writeSymbol === "string" &&
    isHeadMovement(value.movement)
  );
}

function isHeadMovement(value: unknown): value is HeadMovement {
  return value === "L" || value === "R" || value === "N";
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
