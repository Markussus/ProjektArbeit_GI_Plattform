import type { ReactNode } from "react";
import { byteToBinary, byteToHex, bytesToHex } from "./encodingFormatUtils";

export interface Utf8BitSegment {
  type: "control" | "payload";
  bits: string;
}

interface Utf8DecodeCharResult {
  codePoint: number;
  bytesUsed: string[];
  nextIndex: number;
}

export function getCodePoint(char: string): number {
  return char.codePointAt(0) ?? 0;
}

export function getUtf8Bytes(codePoint: number): number[] {
  if (codePoint <= 0x7f) {
    return [codePoint];
  } else if (codePoint <= 0x7ff) {
    return [0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f)];
  } else if (codePoint <= 0xffff) {
    return [
      0xe0 | (codePoint >> 12),
      0x80 | ((codePoint >> 6) & 0x3f),
      0x80 | (codePoint & 0x3f),
    ];
  } else if (codePoint <= 0x10ffff) {
    return [
      0xf0 | (codePoint >> 18),
      0x80 | ((codePoint >> 12) & 0x3f),
      0x80 | ((codePoint >> 6) & 0x3f),
      0x80 | (codePoint & 0x3f),
    ];
  }
  return [];
}

export function displayChar(char: string): string {
  const code = char.codePointAt(0) ?? 0;
  if (code < 0x20 || (code >= 0x7f && code < 0xa0)) {
    return `\\x${code.toString(16).toUpperCase().padStart(2, "0")}`;
  }
  return char;
}

export function displayText(text: string): string {
  return Array.from(text).map(displayChar).join("");
}

export function getUtf8BitSegments(
  binary: string,
  byteType: "single" | "lead" | "cont",
  byteCount: number,
): Utf8BitSegment[] {
  const controlLengths: Record<string, number> = {
    "1": 1,
    "2-lead": 3,
    "2-cont": 2,
    "3-lead": 4,
    "3-cont": 2,
    "4-lead": 5,
    "4-cont": 2,
  };
  const key = byteCount === 1 ? "1" : `${byteCount}-${byteType}`;
  const controlLen = controlLengths[key] ?? 0;
  const payloadLen = 8 - controlLen;
  return [
    { type: "control", bits: binary.slice(0, controlLen) },
    {
      type: "payload",
      bits: binary.slice(controlLen, controlLen + payloadLen),
    },
  ];
}

export function getUtf8PatternDisplay(byteCount: number): ReactNode {
  const patterns: Record<number, { control: string; payload: string }[]> = {
    1: [{ control: "0", payload: "xxxxxxx" }],
    2: [
      { control: "110", payload: "xxxxx" },
      { control: "10", payload: "xxxxxx" },
    ],
    3: [
      { control: "1110", payload: "xxxx" },
      { control: "10", payload: "xxxxxx" },
      { control: "10", payload: "xxxxxx" },
    ],
    4: [
      { control: "11110", payload: "xxx" },
      { control: "10", payload: "xxxxxx" },
      { control: "10", payload: "xxxxxx" },
      { control: "10", payload: "xxxxxx" },
    ],
  };
  const bytes = patterns[byteCount] ?? [];
  return (
    <span className="font-mono">
      {bytes.map((b, i) => (
        <span key={i}>
          {i > 0 && <span className="text-muted-foreground"> </span>}
          <span className="font-bold text-red-500 dark:text-red-400">
            {b.control}
          </span>
          <span className="text-blue-500 dark:text-blue-400">{b.payload}</span>
        </span>
      ))}
    </span>
  );
}

function parseHexInput(hexString: string): {
  bytes: number[];
  valid: boolean;
} {
  const hexBytes = hexString.trim().split(/\s+/);
  const bytes: number[] = [];
  for (const hex of hexBytes) {
    const val = parseInt(hex, 16);
    if (isNaN(val) || val > 0xff) {
      return { bytes: [], valid: false };
    }
    bytes.push(val);
  }
  return { bytes, valid: true };
}

const LEAD_MASKS: Record<number, number> = {
  2: 0x1f,
  3: 0x0f,
  4: 0x07,
};

const MIN_CODE_POINTS: Record<number, number> = {
  2: 0x80,
  3: 0x800,
  4: 0x10000,
};

const MAX_CODE_POINTS: Record<number, number> = {
  2: 0x7ff,
  3: 0xffff,
  4: 0x10ffff,
};

function areContinuationBytesValid(
  bytes: number[],
  startIndex: number,
  count: number,
): boolean {
  for (let j = 1; j <= count; j++) {
    if ((bytes[startIndex + j] & 0xc0) !== 0x80) {
      return false;
    }
  }
  return true;
}

function computeMultiByteCodePoint(
  bytes: number[],
  startIndex: number,
  byteCount: number,
): number {
  const payloadMask = LEAD_MASKS[byteCount];
  let codePoint = bytes[startIndex] & payloadMask;
  for (let j = 1; j < byteCount; j++) {
    codePoint = (codePoint << 6) | (bytes[startIndex + j] & 0x3f);
  }
  return codePoint;
}

function decodeMultiByteUtf8Char(
  bytes: number[],
  startIndex: number,
  byteCount: number,
): Utf8DecodeCharResult | null {
  if (startIndex + byteCount - 1 >= bytes.length) return null;
  if (!areContinuationBytesValid(bytes, startIndex, byteCount - 1)) return null;
  const codePoint = computeMultiByteCodePoint(bytes, startIndex, byteCount);
  if (
    codePoint < MIN_CODE_POINTS[byteCount] ||
    codePoint > MAX_CODE_POINTS[byteCount]
  ) {
    return null;
  }
  return {
    codePoint,
    bytesUsed: Array.from({ length: byteCount }, (_, j) =>
      byteToHex(bytes[startIndex + j]),
    ),
    nextIndex: startIndex + byteCount,
  };
}

function decodeUtf8Char(
  bytes: number[],
  startIndex: number,
): Utf8DecodeCharResult | null {
  const byte = bytes[startIndex];

  if ((byte & 0x80) === 0) {
    return {
      codePoint: byte,
      bytesUsed: [byteToHex(byte)],
      nextIndex: startIndex + 1,
    };
  }

  if ((byte & 0xe0) === 0xc0) {
    return decodeMultiByteUtf8Char(bytes, startIndex, 2);
  }

  if ((byte & 0xf0) === 0xe0) {
    return decodeMultiByteUtf8Char(bytes, startIndex, 3);
  }

  if ((byte & 0xf8) === 0xf0) {
    return decodeMultiByteUtf8Char(bytes, startIndex, 4);
  }

  return null;
}

export function decodeUtf8(hexString: string): string {
  const { bytes, valid } = parseHexInput(hexString);
  if (!valid || bytes.length === 0) return "";
  let result = "";
  let i = 0;
  while (i < bytes.length) {
    const decoded = decodeUtf8Char(bytes, i);
    if (!decoded) return "";
    result += String.fromCodePoint(decoded.codePoint);
    i = decoded.nextIndex;
  }
  return result;
}

export interface Utf8DecodeByteInfo {
  index: number;
  hexByte: string;
  binary: string;
  byteType: "lead" | "cont" | "single";
  byteCount: number;
}

export function getUtf8DecodeByteSteps(
  hexString: string,
): Utf8DecodeByteInfo[] {
  const hexBytes = hexString.trim().split(/\s+/);
  const steps: Utf8DecodeByteInfo[] = [];
  let expectedContinuations = 0;
  for (let i = 0; i < hexBytes.length; i++) {
    const val = parseInt(hexBytes[i], 16);
    if (isNaN(val) || val > 0xff) break;
    const binary = byteToBinary(val);
    if (expectedContinuations > 0) {
      steps.push({
        index: i,
        hexByte: hexBytes[i].toUpperCase().padStart(2, "0"),
        binary,
        byteType: "cont",
        byteCount: 0,
      });
      expectedContinuations--;
    } else if ((val & 0x80) === 0) {
      steps.push({
        index: i,
        hexByte: hexBytes[i].toUpperCase().padStart(2, "0"),
        binary,
        byteType: "single",
        byteCount: 1,
      });
    } else if ((val & 0xe0) === 0xc0) {
      steps.push({
        index: i,
        hexByte: hexBytes[i].toUpperCase().padStart(2, "0"),
        binary,
        byteType: "lead",
        byteCount: 2,
      });
      expectedContinuations = 1;
    } else if ((val & 0xf0) === 0xe0) {
      steps.push({
        index: i,
        hexByte: hexBytes[i].toUpperCase().padStart(2, "0"),
        binary,
        byteType: "lead",
        byteCount: 3,
      });
      expectedContinuations = 2;
    } else if ((val & 0xf8) === 0xf0) {
      steps.push({
        index: i,
        hexByte: hexBytes[i].toUpperCase().padStart(2, "0"),
        binary,
        byteType: "lead",
        byteCount: 4,
      });
      expectedContinuations = 3;
    }
  }
  return steps;
}

export interface Utf8DecodeCharStep {
  index: number;
  codePoint: number;
  codePointHex: string;
  char: string;
  bytesUsed: string[];
}

export function getUtf8DecodeCharSteps(
  hexString: string,
): Utf8DecodeCharStep[] {
  const { bytes, valid } = parseHexInput(hexString);
  if (!valid || bytes.length === 0) return [];
  const steps: Utf8DecodeCharStep[] = [];
  let i = 0;
  while (i < bytes.length) {
    const decoded = decodeUtf8Char(bytes, i);
    if (!decoded) break;
    steps.push({
      index: steps.length,
      codePoint: decoded.codePoint,
      codePointHex: `U+${decoded.codePoint.toString(16).toUpperCase().padStart(4, "0")}`,
      char: String.fromCodePoint(decoded.codePoint),
      bytesUsed: decoded.bytesUsed,
    });
    i = decoded.nextIndex;
  }
  return steps;
}

export function encodeUtf8ToHex(inputValue: string): string {
  const allBytes: number[] = [];
  for (const char of Array.from(inputValue)) {
    const codePoint = getCodePoint(char);
    allBytes.push(...getUtf8Bytes(codePoint));
  }
  return bytesToHex(allBytes);
}
