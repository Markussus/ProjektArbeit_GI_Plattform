import {
  decodeBase64Utf8,
  encodeBase64Utf8,
  fromBase64Url,
  gzipCompressToBase64Url,
  gzipDecompressFromBase64Url,
  toBase64Url,
} from "@/lib/utils";
import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";

const GZIP_FORMAT_PREFIX = "j1.";
const UTF8_FORMAT_PREFIX = "j0.";

export const javaCodeTransferCodec: ISimulatorTransferCodec<string> = {
  async exportValue(sourceCode) {
    const normalizedSourceCode = collectExportData(sourceCode);

    if (
      typeof CompressionStream === "undefined" ||
      typeof DecompressionStream === "undefined"
    ) {
      return `${UTF8_FORMAT_PREFIX}${toBase64Url(
        encodeBase64Utf8(normalizedSourceCode),
      )}`;
    }

    return `${GZIP_FORMAT_PREFIX}${await gzipCompressToBase64Url(
      normalizedSourceCode,
    )}`;
  },
  async importValue(serializedValue) {
    const normalizedValue = serializedValue.trim();

    if (normalizedValue.startsWith(GZIP_FORMAT_PREFIX)) {
      return restoreImportedData(
        await gzipDecompressFromBase64Url(
          normalizedValue.slice(GZIP_FORMAT_PREFIX.length),
        ),
      );
    }

    if (normalizedValue.startsWith(UTF8_FORMAT_PREFIX)) {
      return restoreImportedData(
        decodeBase64Utf8(
          fromBase64Url(normalizedValue.slice(UTF8_FORMAT_PREFIX.length)),
        ),
      );
    }

    throw new Error("java_transfer_prefix_invalid");
  },
};

function collectExportData(sourceCode: string) {
  return sourceCode;
}

function restoreImportedData(serializedValue: string) {
  return serializedValue;
}
