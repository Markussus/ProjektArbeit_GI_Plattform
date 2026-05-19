import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cloneJson<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

export function encodeBase64Bytes(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

export function decodeBase64Bytes(value: string): Uint8Array {
  const binary = atob(value);

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function encodeBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  return encodeBase64Bytes(bytes);
}

export function decodeBase64Utf8(value: string): string {
  const bytes = decodeBase64Bytes(value);
  return new TextDecoder().decode(bytes);
}

export function toBase64Url(value: string): string {
  return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

export function fromBase64Url(value: string): string {
  const paddedValue = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  return paddedValue;
}

export async function gzipCompressToBase64Url(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const compressedBytes = await readStreamFully(
    new Blob([toArrayBuffer(bytes)])
      .stream()
      .pipeThrough(new CompressionStream("gzip")),
  );

  return toBase64Url(encodeBase64Bytes(compressedBytes));
}

export async function gzipDecompressFromBase64Url(
  value: string,
): Promise<string> {
  const compressedBytes = decodeBase64Bytes(fromBase64Url(value));
  const decompressedBytes = await readStreamFully(
    new Blob([toArrayBuffer(compressedBytes)])
      .stream()
      .pipeThrough(new DecompressionStream("gzip")),
  );

  return new TextDecoder().decode(decompressedBytes);
}

async function readStreamFully(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    chunks.push(value);
    totalLength += value.length;
  }

  const mergedBytes = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    mergedBytes.set(chunk, offset);
    offset += chunk.length;
  }

  return mergedBytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}
