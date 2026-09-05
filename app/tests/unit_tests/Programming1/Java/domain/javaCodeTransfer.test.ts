import { describe, expect, it } from "vitest";
import { encodeBase64Bytes, toBase64Url } from "@/lib/utils";
import { javaCodeTransferCodec } from "@/pages/Programming1/Java/components/Simulator/domain/javaCodeTransfer";

describe("Java code transfer codec", () => {
  it("round-trips a simple Java program", async () => {
    const sourceCode = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}
`;

    await expectRoundTrip(sourceCode);
  });

  it("round-trips Java code with imports", async () => {
    const sourceCode = `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int x = sc.nextInt();
        System.out.println(x);
    }
}
`;

    await expectRoundTrip(sourceCode);
  });

  it("round-trips allowed non-ASCII characters exactly", async () => {
    const sourceCode = `public class Main {\r
    public static void main(String[] args) {\r
        // Größe prüfen\u00a0– exakt\r
        System.out.println("Müller kostet 10 €");\r
    }\r
}\r
`;

    await expectRoundTrip(sourceCode);
  });

  it("rejects unsupported Unicode with the affected character", async () => {
    await expect(
      javaCodeTransferCodec.exportValue('System.out.println("Hi 😀");'),
    ).rejects.toThrow(/😀.*U\+1F600/u);
  });

  it("can choose the direct token stream for a small snippet", async () => {
    const exportedValue = await javaCodeTransferCodec.exportValue("x");

    expect(exportedValue[0]).toBe("A");
    await expect(
      javaCodeTransferCodec.importValue(exportedValue),
    ).resolves.toBe("x");
  });

  it("chooses a compressed candidate for repetitive source code", async () => {
    const sourceCode = `public class Main {
  public static void main(String[] args) {
${'    System.out.println("Hello World");\n'.repeat(100)}  }
}
`;

    const exportedValue = await javaCodeTransferCodec.exportValue(sourceCode);

    expect(["B", "C"]).toContain(exportedValue[0]);
    await expect(
      javaCodeTransferCodec.importValue(exportedValue),
    ).resolves.toBe(sourceCode);
  });

  it("keeps the browser responsive while exporting 60,000 lines", async () => {
    const sourceCode = "System.out.println(1);\n".repeat(60_000);
    let timerWasProcessed = false;
    const timerId = setTimeout(() => {
      timerWasProcessed = true;
    }, 10);

    const exportedValue = await javaCodeTransferCodec.exportValue(sourceCode);
    clearTimeout(timerId);

    expect(timerWasProcessed).toBe(true);
    await expect(
      javaCodeTransferCodec.importValue(exportedValue),
    ).resolves.toBe(sourceCode);
  }, 30_000);

  it.each([
    {
      prefix: "A",
      createPayload: async () => Uint8Array.of("x".charCodeAt(0)),
    },
    {
      prefix: "B",
      createPayload: async () => compressRaw(Uint8Array.of("x".charCodeAt(0))),
    },
    {
      prefix: "C",
      createPayload: async () => compressRaw(new TextEncoder().encode("x")),
    },
  ])("imports the $prefix algorithm", async ({ prefix, createPayload }) => {
    const payload = await createPayload();
    const serializedValue = `${prefix}${toBase64Url(
      encodeBase64Bytes(payload),
    )}`;

    await expect(
      javaCodeTransferCodec.importValue(serializedValue),
    ).resolves.toBe("x");
  });

  it("accepts pasted transfer strings with surrounding whitespace", async () => {
    const exportedValue = await javaCodeTransferCodec.exportValue("class A {}");

    await expect(
      javaCodeTransferCodec.importValue(` \n${exportedValue}\n `),
    ).resolves.toBe("class A {}");
  });

  it("rejects unknown prefixes", async () => {
    await expect(javaCodeTransferCodec.importValue("X")).rejects.toThrow(
      /Unbekanntes Prefix/u,
    );
  });

  it("rejects malformed and non-canonical Base64URL payloads", async () => {
    await expect(javaCodeTransferCodec.importValue("A*")).rejects.toThrow(
      /Base64URL-Payload/u,
    );
    await expect(javaCodeTransferCodec.importValue("AeA==")).rejects.toThrow(
      /Base64URL-Payload/u,
    );
  });

  it("rejects truncated Raw-Deflate payloads", async () => {
    const compressed = await compressRaw(
      new TextEncoder().encode("class A {}"),
    );
    const truncated = compressed.slice(0, Math.max(0, compressed.length - 2));

    await expect(
      javaCodeTransferCodec.importValue(
        `C${toBase64Url(encodeBase64Bytes(truncated))}`,
      ),
    ).rejects.toThrow(/Raw-Deflate-Payload/u);
  });

  it("rejects unknown dictionary tokens", async () => {
    await expect(
      javaCodeTransferCodec.importValue(
        `A${toBase64Url(encodeBase64Bytes(Uint8Array.of(0xff)))}`,
      ),
    ).rejects.toThrow(/Unbekanntes Dictionary-Token/u);
  });
});

async function expectRoundTrip(sourceCode: string): Promise<void> {
  const exportedValue = await javaCodeTransferCodec.exportValue(sourceCode);
  const importedValue = await javaCodeTransferCodec.importValue(exportedValue);

  expect(exportedValue).toMatch(/^[ABC][A-Za-z0-9_-]*$/u);
  expect(importedValue).toBe(sourceCode);
}

async function compressRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const reader = new Blob([toArrayBuffer(bytes)])
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"))
    .getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      chunks.push(value);
      totalLength += value.length;
    }
  }

  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}
