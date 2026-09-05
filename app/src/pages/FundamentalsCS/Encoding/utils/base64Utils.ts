const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export interface EncodingStep {
  index: number;
  char: string;
  ascii: number;
  hex: string;
  binary: string;
}

export interface GroupStep {
  index: number;
  bits: string;
  decimal: number;
  base64Char: string;
}

export interface DecodeStep {
  index: number;
  base64Char: string;
  decimal: number;
  bits: string;
}

export interface DecodeByteStep {
  index: number;
  bits: string;
  decimal: number;
  char: string;
}

export function buildEncodingSteps(inputValue: string): EncodingStep[] {
  return Array.from(inputValue).map((char, i) => ({
    index: i,
    char,
    ascii: char.charCodeAt(0),
    hex: char.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"),
    binary: char.charCodeAt(0).toString(2).padStart(8, "0"),
  }));
}

function textToBinaryString(text: string): string {
  return Array.from(text)
    .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("");
}

export function buildGroupSteps(binaryString: string): GroupStep[] {
  const padded = binaryString.padEnd(
    Math.ceil(binaryString.length / 6) * 6,
    "0",
  );
  const groups: GroupStep[] = [];
  for (let i = 0; i < padded.length; i += 6) {
    const bits = padded.slice(i, i + 6);
    const decimal = parseInt(bits, 2);
    groups.push({
      index: groups.length,
      bits,
      decimal,
      base64Char: BASE64_CHARS[decimal],
    });
  }
  const paddingCount = (4 - (groups.length % 4)) % 4;
  for (let i = 0; i < paddingCount; i++) {
    groups.push({
      index: groups.length,
      bits: "======",
      decimal: -1,
      base64Char: "=",
    });
  }
  return groups;
}

export function encodeBase64(inputValue: string): string {
  const binaryString = textToBinaryString(inputValue);
  const padded = binaryString.padEnd(
    Math.ceil(binaryString.length / 6) * 6,
    "0",
  );
  let encoded = "";
  for (let i = 0; i < padded.length; i += 6) {
    const bits = padded.slice(i, i + 6);
    encoded += BASE64_CHARS[parseInt(bits, 2)];
  }
  const paddingCount = (4 - (encoded.length % 4)) % 4;
  return encoded + "=".repeat(paddingCount);
}

export function cleanBase64Input(inputValue: string): string {
  return inputValue.replace(/=/g, "");
}

export function buildDecodeSteps(cleanInput: string): DecodeStep[] {
  const steps: DecodeStep[] = [];
  for (const char of cleanInput) {
    const idx = BASE64_CHARS.indexOf(char);
    if (idx === -1) break;
    steps.push({
      index: steps.length,
      base64Char: char,
      decimal: idx,
      bits: idx.toString(2).padStart(6, "0"),
    });
  }
  return steps;
}

function base64ToBinaryString(cleanInput: string): string | null {
  let binaryString = "";
  for (const char of cleanInput) {
    const idx = BASE64_CHARS.indexOf(char);
    if (idx === -1) return null;
    binaryString += idx.toString(2).padStart(6, "0");
  }
  return binaryString;
}

export function buildDecodeByteSteps(cleanInput: string): {
  steps: DecodeByteStep[];
  valid: boolean;
} {
  const binaryString = base64ToBinaryString(cleanInput);
  if (binaryString === null) return { steps: [], valid: false };
  const steps: DecodeByteStep[] = [];
  for (let i = 0; i < binaryString.length; i += 8) {
    const bits = binaryString.slice(i, i + 8);
    if (bits.length < 8) break;
    const decimal = parseInt(bits, 2);
    steps.push({
      index: steps.length,
      bits,
      decimal,
      char: String.fromCharCode(decimal),
    });
  }
  return { steps, valid: true };
}

export function decodeBase64(inputValue: string): string | null {
  const clean = cleanBase64Input(inputValue);
  const binaryString = base64ToBinaryString(clean);
  if (binaryString === null) return null;
  let decoded = "";
  for (let i = 0; i < binaryString.length; i += 8) {
    const byte = binaryString.slice(i, i + 8);
    if (byte.length < 8) break;
    decoded += String.fromCharCode(parseInt(byte, 2));
  }
  return decoded;
}
