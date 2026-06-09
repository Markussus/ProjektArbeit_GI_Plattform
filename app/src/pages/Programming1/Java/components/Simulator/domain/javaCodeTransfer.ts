import {
  decodeBase64Bytes,
  encodeBase64Bytes,
  fromBase64Url,
  toBase64Url,
} from "@/lib/utils";
import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";

const DIRECT_TOKEN_PREFIX = "A";
const DEFLATED_TOKEN_PREFIX = "B";
const DEFLATED_UTF8_PREFIX = "C";

const MAX_SOURCE_BYTES = 10_000_000;
const MAX_PAYLOAD_CHARACTERS = 15_000_000;
const MAX_ENCODED_BYTES = 11_000_000;
const VALIDATION_YIELD_INTERVAL = 32_768;
const TOKENIZATION_YIELD_INTERVAL = 4_096;

/*
 * Byte layout:
 * 0x00-0x7f: allowed ASCII bytes
 * 0x80-0x90: fixed non-ASCII character tokens
 * 0x91-0xff: Java dictionary tokens
 *
 * Dictionary indexes are format IDs. Keep existing entries in place; append new
 * entries only, so previously generated strings retain their meaning.
 */
const SPECIAL_CHARACTER_TOKEN_START = 0x80;
const JAVA_DICTIONARY_TOKEN_START = 0x91;

const SPECIAL_CHARACTERS = [
  "ä",
  "Ä",
  "ö",
  "Ö",
  "ü",
  "Ü",
  "ß",
  "€",
  "“",
  "”",
  "„",
  "‘",
  "’",
  "–",
  "—",
  "…",
  "\u00a0",
] as const;

const JAVA_DICTIONARY = [
  "BufferedReader br = new BufferedReader(new InputStreamReader(System.in));",
  "public static void main(String[] args)",
  "public static void main(String args[])",
  "Scanner scanner = new Scanner(System.in);",
  "Scanner sc = new Scanner(System.in);",
  "import java.util.ArrayList;",
  "import java.util.Collections;",
  "import java.util.Scanner;",
  "import java.util.Arrays;",
  "new BufferedReader(new InputStreamReader(System.in))",
  "System.out.println",
  "System.out.print",
  "private static final ",
  "protected static ",
  "public static ",
  "private static ",
  "import java.util.",
  "import java.io.",
  "new Scanner(System.in)",
  "Integer.parseInt",
  "Double.parseDouble",
  "Long.parseLong",
  "Collections.sort",
  "StringBuilder",
  "String[] args",
  "static void main",
  "throws IOException",
  "throws Exception",
  "public class ",
  "Arrays.toString",
  "System.currentTimeMillis",
  "System.in",
  "Arrays.sort",
  "Math.max",
  "Math.min",
  "Math.sqrt",
  "ArrayList<",
  "HashMap<",
  "HashSet<",
  "LinkedList<",
  "BufferedReader",
  "InputStreamReader",
  "IOException",
  "Exception",
  "@Override",
  "static final ",
  "implements ",
  "protected ",
  "interface ",
  "private ",
  "public ",
  "static ",
  "final ",
  "extends ",
  "class ",
  "return ",
  "switch ",
  "continue;",
  "break;",
  "finally ",
  "catch ",
  "while ",
  "else ",
  "case ",
  "for ",
  "if ",
  "try ",
  "new ",
  "String",
  "boolean",
  "double",
  "float",
  "long",
  "int",
  "char",
  "byte",
  "void",
  "null",
  "true",
  "false",
  "List<",
  "Map<",
  "Set<",
] as const;

const specialCharacterTokens = new Map<string, number>(
  SPECIAL_CHARACTERS.map((character, index) => [
    character,
    SPECIAL_CHARACTER_TOKEN_START + index,
  ]),
);

const dictionaryMatchOrder = JAVA_DICTIONARY.map((entry, index) => ({
  entry,
  token: JAVA_DICTIONARY_TOKEN_START + index,
})).sort(
  (left, right) =>
    right.entry.length - left.entry.length || left.token - right.token,
);
const dictionaryMatchesByFirstCharacter = new Map<
  string,
  typeof dictionaryMatchOrder
>();
for (const dictionaryMatch of dictionaryMatchOrder) {
  const firstCharacter = dictionaryMatch.entry[0];
  if (firstCharacter === undefined) {
    continue;
  }

  const matches = dictionaryMatchesByFirstCharacter.get(firstCharacter) ?? [];
  matches.push(dictionaryMatch);
  dictionaryMatchesByFirstCharacter.set(firstCharacter, matches);
}

const textEncoder = new TextEncoder();
const specialCharacterBytes = SPECIAL_CHARACTERS.map((character) =>
  textEncoder.encode(character),
);
const dictionaryEntryBytes = JAVA_DICTIONARY.map((entry) =>
  textEncoder.encode(entry),
);

assertTokenLayout();

export const javaCodeTransferCodec: ISimulatorTransferCodec<string> = {
  async exportValue(sourceCode) {
    await yieldToMainThread();
    await validateSourceCodeForExport(sourceCode);

    const utf8Bytes = textEncoder.encode(sourceCode);
    assertSourceSize(utf8Bytes.length);

    const tokenBytes = await tokenizeSourceCode(sourceCode);
    const candidates = [createCandidate(DIRECT_TOKEN_PREFIX, tokenBytes)];

    if (supportsRawDeflate()) {
      const [deflatedTokens, deflatedUtf8] = await Promise.all([
        compressRaw(tokenBytes),
        compressRaw(utf8Bytes),
      ]);

      candidates.push(
        createCandidate(DEFLATED_TOKEN_PREFIX, deflatedTokens),
        createCandidate(DEFLATED_UTF8_PREFIX, deflatedUtf8),
      );
    }

    return candidates.reduce((shortest, candidate) =>
      candidate.length < shortest.length ? candidate : shortest,
    );
  },

  async importValue(serializedValue) {
    const normalizedValue = serializedValue.trim();

    if (normalizedValue.length < 1) {
      throw new Error(
        "Java-Import fehlgeschlagen: Der Export-String ist leer.",
      );
    }
    if (normalizedValue.length > MAX_PAYLOAD_CHARACTERS + 1) {
      throw new Error(
        "Java-Import fehlgeschlagen: Der Export-String ist zu groß.",
      );
    }

    const prefix = normalizedValue[0];
    const encodedPayload = normalizedValue.slice(1);
    const payload = decodePayload(encodedPayload);

    if (prefix === DIRECT_TOKEN_PREFIX) {
      return decodeTokenStream(payload);
    }

    if (prefix !== DEFLATED_TOKEN_PREFIX && prefix !== DEFLATED_UTF8_PREFIX) {
      throw new Error(
        `Java-Import fehlgeschlagen: Unbekanntes Prefix "${prefix}".`,
      );
    }
    if (!supportsRawDeflate()) {
      throw new Error(
        "Java-Import fehlgeschlagen: Raw-Deflate wird in dieser Umgebung nicht unterstützt.",
      );
    }

    let decompressed: Uint8Array;
    try {
      decompressed = await decompressRaw(payload);
    } catch {
      throw new Error(
        "Java-Import fehlgeschlagen: Der Raw-Deflate-Payload ist ungültig.",
      );
    }

    if (prefix === DEFLATED_TOKEN_PREFIX) {
      return decodeTokenStream(decompressed);
    }

    return decodeUtf8Source(decompressed);
  },
};

function createCandidate(prefix: string, payload: Uint8Array): string {
  return `${prefix}${toBase64Url(encodeBase64Bytes(payload))}`;
}

async function validateSourceCodeForExport(sourceCode: string): Promise<void> {
  const unsupportedCharacters = new Set<string>();
  let inspectedCharacters = 0;

  for (const character of sourceCode) {
    const codePoint = character.codePointAt(0);
    if (
      codePoint === undefined ||
      (!isAllowedAscii(codePoint) && !specialCharacterTokens.has(character))
    ) {
      unsupportedCharacters.add(character);
    }

    inspectedCharacters += character.length;
    if (inspectedCharacters >= VALIDATION_YIELD_INTERVAL) {
      inspectedCharacters = 0;
      await yieldToMainThread();
    }
  }

  if (unsupportedCharacters.size > 0) {
    throwUnsupportedCharacters(unsupportedCharacters);
  }
}

function validateSourceCode(sourceCode: string): void {
  const unsupportedCharacters = new Set<string>();

  for (const character of sourceCode) {
    const codePoint = character.codePointAt(0);
    if (
      codePoint === undefined ||
      (!isAllowedAscii(codePoint) && !specialCharacterTokens.has(character))
    ) {
      unsupportedCharacters.add(character);
    }
  }

  if (unsupportedCharacters.size > 0) {
    throwUnsupportedCharacters(unsupportedCharacters);
  }
}

async function tokenizeSourceCode(sourceCode: string): Promise<Uint8Array> {
  const tokens: number[] = [];
  let offset = 0;
  let processedCharacters = 0;

  while (offset < sourceCode.length) {
    const matches = dictionaryMatchesByFirstCharacter.get(
      sourceCode[offset] ?? "",
    );
    const dictionaryMatch = matches?.find(({ entry }) =>
      sourceCode.startsWith(entry, offset),
    );

    if (dictionaryMatch) {
      tokens.push(dictionaryMatch.token);
      offset += dictionaryMatch.entry.length;
      processedCharacters += dictionaryMatch.entry.length;
    } else {
      const codePoint = sourceCode.codePointAt(offset);
      if (codePoint === undefined) {
        throw new Error("java_transfer_source_invalid");
      }

      if (isAllowedAscii(codePoint)) {
        tokens.push(codePoint);
        offset++;
        processedCharacters++;
      } else {
        const character = String.fromCodePoint(codePoint);
        const specialToken = specialCharacterTokens.get(character);
        if (specialToken === undefined) {
          throw new Error("java_transfer_source_invalid");
        }

        tokens.push(specialToken);
        offset += character.length;
        processedCharacters += character.length;
      }
    }

    if (processedCharacters >= TOKENIZATION_YIELD_INTERVAL) {
      processedCharacters = 0;
      await yieldToMainThread();
    }
  }

  return Uint8Array.from(tokens);
}

function decodeTokenStream(tokenStream: Uint8Array): string {
  const outputBytes: number[] = [];

  for (const token of tokenStream) {
    if (token < SPECIAL_CHARACTER_TOKEN_START) {
      if (!isAllowedAscii(token)) {
        throw new Error(
          `Java-Import fehlgeschlagen: Ungültiges ASCII-Byte 0x${token.toString(16).padStart(2, "0")} im Tokenstream.`,
        );
      }
      outputBytes.push(token);
    } else if (token < JAVA_DICTIONARY_TOKEN_START) {
      const bytes =
        specialCharacterBytes[token - SPECIAL_CHARACTER_TOKEN_START];
      if (bytes === undefined) {
        throw new Error(
          `Java-Import fehlgeschlagen: Unbekanntes Sonderzeichen-Token 0x${token.toString(16)}.`,
        );
      }
      outputBytes.push(...bytes);
    } else {
      const bytes = dictionaryEntryBytes[token - JAVA_DICTIONARY_TOKEN_START];
      if (bytes === undefined) {
        throw new Error(
          `Java-Import fehlgeschlagen: Unbekanntes Dictionary-Token 0x${token.toString(16)}.`,
        );
      }
      outputBytes.push(...bytes);
    }

    assertSourceSize(outputBytes.length);
  }

  return decodeUtf8Source(Uint8Array.from(outputBytes));
}

function decodeUtf8Source(bytes: Uint8Array): string {
  assertSourceSize(bytes.length);

  let sourceCode: string;
  try {
    sourceCode = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(
      "Java-Import fehlgeschlagen: Der Payload enthält ungültiges UTF-8.",
    );
  }

  validateSourceCode(sourceCode);
  return sourceCode;
}

function decodePayload(encodedPayload: string): Uint8Array {
  if (
    encodedPayload.length > MAX_PAYLOAD_CHARACTERS ||
    !/^[A-Za-z0-9_-]*$/u.test(encodedPayload) ||
    encodedPayload.length % 4 === 1
  ) {
    throw new Error(
      "Java-Import fehlgeschlagen: Der Base64URL-Payload ist ungültig.",
    );
  }

  let bytes: Uint8Array;
  try {
    bytes = decodeBase64Bytes(fromBase64Url(encodedPayload));
  } catch {
    throw new Error(
      "Java-Import fehlgeschlagen: Der Base64URL-Payload ist ungültig.",
    );
  }

  if (
    bytes.length > MAX_ENCODED_BYTES ||
    toBase64Url(encodeBase64Bytes(bytes)) !== encodedPayload
  ) {
    throw new Error(
      "Java-Import fehlgeschlagen: Der Base64URL-Payload ist nicht kanonisch oder zu groß.",
    );
  }

  return bytes;
}

async function compressRaw(bytes: Uint8Array): Promise<Uint8Array> {
  return readStreamFully(
    new Blob([toArrayBuffer(bytes)])
      .stream()
      .pipeThrough(new CompressionStream("deflate-raw")),
    MAX_ENCODED_BYTES,
  );
}

async function decompressRaw(bytes: Uint8Array): Promise<Uint8Array> {
  return readStreamFully(
    new Blob([toArrayBuffer(bytes)])
      .stream()
      .pipeThrough(new DecompressionStream("deflate-raw")),
    MAX_SOURCE_BYTES,
  );
}

async function readStreamFully(
  stream: ReadableStream<Uint8Array>,
  maximumLength: number,
): Promise<Uint8Array> {
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

    totalLength += value.length;
    if (totalLength > maximumLength) {
      await reader.cancel();
      throw new Error("java_transfer_size_limit_exceeded");
    }
    chunks.push(value);
  }

  const mergedBytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    mergedBytes.set(chunk, offset);
    offset += chunk.length;
  }

  return mergedBytes;
}

function supportsRawDeflate(): boolean {
  if (
    typeof CompressionStream === "undefined" ||
    typeof DecompressionStream === "undefined"
  ) {
    return false;
  }

  try {
    new CompressionStream("deflate-raw");
    new DecompressionStream("deflate-raw");
    return true;
  } catch {
    return false;
  }
}

function isAllowedAscii(codePoint: number): boolean {
  return (
    codePoint === 0x09 ||
    codePoint === 0x0a ||
    codePoint === 0x0d ||
    (codePoint >= 0x20 && codePoint <= 0x7e)
  );
}

function formatUnsupportedCharacter(character: string): string {
  const codePoint = character.codePointAt(0);
  const displayCharacter =
    character === "\n"
      ? "\\n"
      : character === "\r"
        ? "\\r"
        : character === "\t"
          ? "\\t"
          : character;

  return `"${displayCharacter}" (U+${(codePoint ?? 0)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0")})`;
}

function throwUnsupportedCharacters(
  unsupportedCharacters: ReadonlySet<string>,
): never {
  const formattedCharacters = Array.from(unsupportedCharacters, (character) =>
    formatUnsupportedCharacter(character),
  ).join(", ");

  throw new Error(
    `Export nicht möglich: Der Code enthält nicht unterstützte Zeichen. Entferne oder ersetze: ${formattedCharacters}.`,
  );
}

function assertSourceSize(byteLength: number): void {
  if (byteLength > MAX_SOURCE_BYTES) {
    throw new Error(
      `Java-Transfer fehlgeschlagen: Der Java-Code überschreitet das Limit von ${MAX_SOURCE_BYTES} UTF-8-Bytes.`,
    );
  }
}

function assertTokenLayout(): void {
  if (
    SPECIAL_CHARACTER_TOKEN_START + SPECIAL_CHARACTERS.length !==
      JAVA_DICTIONARY_TOKEN_START ||
    JAVA_DICTIONARY_TOKEN_START + JAVA_DICTIONARY.length > 0x100 ||
    new Set(SPECIAL_CHARACTERS).size !== SPECIAL_CHARACTERS.length ||
    new Set(JAVA_DICTIONARY).size !== JAVA_DICTIONARY.length ||
    JAVA_DICTIONARY.some((entry) =>
      Array.from(entry).some(
        (character) => !isAllowedAscii(character.codePointAt(0) ?? -1),
      ),
    )
  ) {
    throw new Error("java_transfer_token_layout_invalid");
  }
}

function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}
