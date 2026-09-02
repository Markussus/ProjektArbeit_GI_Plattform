import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  COMPILER_ARTIFACT_BASE_URL,
  COMPILER_ARTIFACTS,
} from "../../../src/pages/Programming1/Java/pins_compiler/teavm-javac-artifacts.mjs";
import {
  calculateFileSha256,
  cleanObsoleteStampFiles,
  downloadAndVerifyArtifact,
  prepareCompilerArtifacts,
  verifyLocalArtifacts,
} from "../../../scripts/prepare-teavm-javac.mjs";

interface TestArtifact {
  fileName: string;
  sha256: string;
}

describe("teavm-javac artifacts configuration", () => {
  it("defines the official base URL and exactly 5 required artifacts", () => {
    expect(COMPILER_ARTIFACT_BASE_URL).toBe("https://teavm.org/playground/3");
    expect(COMPILER_ARTIFACTS).toHaveLength(5);

    const fileNames = COMPILER_ARTIFACTS.map((a) => a.fileName);
    expect(fileNames).toEqual([
      "compiler.wasm",
      "compiler.wasm-runtime.js",
      "compile-classlib-teavm.bin",
      "runtime-classlib-teavm.bin",
      "worker.js",
    ]);

    for (const artifact of COMPILER_ARTIFACTS) {
      expect(artifact.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("contains the exact pinned SHA-256 hashes required by the project", () => {
    const expected = {
      "compiler.wasm":
        "7f3828e4b7bddf5504dadebfc4016e40f4441e15ee0519071781813ba2ed3a4c",
      "compiler.wasm-runtime.js":
        "9ff6a6771f698be00ab9d5c7b46d904350a8d4115dc0b409553f31ed66688a55",
      "compile-classlib-teavm.bin":
        "e80ae10423a39290c5f20b6bb6da34d21c3ad0a75cd8dbdda4998d2813045e15",
      "runtime-classlib-teavm.bin":
        "ea670e71967eda93828cb894c1741a8ed2e94b3422eb99cb9eccec0de67daaa8",
      "worker.js":
        "20045d5e753b14774e0b6ee65541cff6a15f6747813227ed665152613f08810a",
    };

    for (const artifact of COMPILER_ARTIFACTS) {
      expect(artifact.sha256).toBe(
        expected[artifact.fileName as keyof typeof expected],
      );
    }
  });
});

describe("prepare-teavm-javac logic", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "teavm-test-"));
  });

  afterEach(async () => {
    if (fs.existsSync(tempDir)) {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  it("calculates SHA-256 hash of a file correctly", async () => {
    const testFile = path.join(tempDir, "sample.txt");
    await fs.promises.writeFile(testFile, "Hello World");
    const hash = await calculateFileSha256(testFile);
    expect(hash).toBe(
      "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    );
  });

  it("verifyLocalArtifacts identifies missing files in empty directory", async () => {
    const result = await verifyLocalArtifacts(tempDir);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("missing");
      expect(result.fileName).toBe("compiler.wasm");
    }
  });

  it("verifyLocalArtifacts identifies manipulated files with hash mismatch", async () => {
    for (const artifact of COMPILER_ARTIFACTS) {
      await fs.promises.writeFile(
        path.join(tempDir, artifact.fileName),
        "corrupted-content",
      );
    }

    const result = await verifyLocalArtifacts(tempDir);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("mismatch");
      expect(result.fileName).toBe("compiler.wasm");
      expect(result.expected).toBe(
        "7f3828e4b7bddf5504dadebfc4016e40f4441e15ee0519071781813ba2ed3a4c",
      );
      expect(result.actual).not.toBe(result.expected);
    }
  });

  it("verifyLocalArtifacts returns valid when mock artifacts match hashes", async () => {
    const mockContent = "artifact-content";
    const hash = crypto
      .createHash("sha256")
      .update(Buffer.from(mockContent))
      .digest("hex");

    const mockArtifacts: TestArtifact[] = [
      { fileName: "file1.bin", sha256: hash },
      { fileName: "file2.bin", sha256: hash },
    ];

    await fs.promises.writeFile(path.join(tempDir, "file1.bin"), mockContent);
    await fs.promises.writeFile(path.join(tempDir, "file2.bin"), mockContent);

    const result = await verifyLocalArtifacts(
      tempDir,
      mockArtifacts as unknown as typeof COMPILER_ARTIFACTS,
    );
    expect(result.valid).toBe(true);
  });

  it("downloadAndVerifyArtifact throws when HTTP status is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      }),
    );

    await expect(
      downloadAndVerifyArtifact(
        "https://example.com",
        { fileName: "test.bin", sha256: "dummy" },
        tempDir,
      ),
    ).rejects.toThrow(/Failed to download test\.bin/);
  });

  it("downloadAndVerifyArtifact throws and aborts when SHA-256 does not match", async () => {
    const downloadedContent = Uint8Array.from([1, 2, 3, 4]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => downloadedContent.buffer.slice(0),
      }),
    );

    await expect(
      downloadAndVerifyArtifact(
        "https://example.com",
        {
          fileName: "test.bin",
          sha256:
            "0000000000000000000000000000000000000000000000000000000000000000",
        },
        tempDir,
      ),
    ).rejects.toThrow(/SHA-256 verification failed for test\.bin/);

    expect(fs.existsSync(path.join(tempDir, "test.bin"))).toBe(false);
  });

  it("downloadAndVerifyArtifact writes file on successful hash match", async () => {
    const rawBytes = new Uint8Array([10, 20, 30, 40, 50]);
    const expectedHash = crypto
      .createHash("sha256")
      .update(rawBytes)
      .digest("hex");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => rawBytes.buffer.slice(0),
      }),
    );

    const res = await downloadAndVerifyArtifact(
      "https://example.com",
      { fileName: "good.bin", sha256: expectedHash },
      tempDir,
    );

    expect(res.size).toBe(rawBytes.length);
    expect(res.sha256).toBe(expectedHash);
    expect(fs.existsSync(path.join(tempDir, "good.bin"))).toBe(true);
    const saved = await fs.promises.readFile(path.join(tempDir, "good.bin"));
    expect(new Uint8Array(saved)).toEqual(rawBytes);
  });

  it("cleanObsoleteStampFiles removes legacy .teavm-javac-commit if present", async () => {
    const stamp = path.join(tempDir, ".teavm-javac-commit");
    await fs.promises.writeFile(stamp, "some-commit");
    expect(fs.existsSync(stamp)).toBe(true);

    await cleanObsoleteStampFiles(tempDir);
    expect(fs.existsSync(stamp)).toBe(false);
  });

  it("prepareCompilerArtifacts skips download when cache is valid", async () => {
    const content = Buffer.from("cached-data");
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    const mockArtifacts: TestArtifact[] = [
      { fileName: "cached.bin", sha256: hash },
    ];

    await fs.promises.writeFile(path.join(tempDir, "cached.bin"), content);

    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await prepareCompilerArtifacts({
      targetDir: tempDir,
      artifacts: mockArtifacts as unknown as typeof COMPILER_ARTIFACTS,
    });

    expect(result.skipped).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("prepareCompilerArtifacts downloads missing artifacts cleanly", async () => {
    const rawBytes = new Uint8Array([42, 43, 44]);
    const hash = crypto.createHash("sha256").update(rawBytes).digest("hex");
    const mockArtifacts: TestArtifact[] = [
      { fileName: "downloaded.bin", sha256: hash },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => rawBytes.buffer.slice(0),
      }),
    );

    const result = await prepareCompilerArtifacts({
      targetDir: tempDir,
      artifacts: mockArtifacts as unknown as typeof COMPILER_ARTIFACTS,
    });

    expect(result.skipped).toBe(false);
    expect(fs.existsSync(path.join(tempDir, "downloaded.bin"))).toBe(true);
  });
});
