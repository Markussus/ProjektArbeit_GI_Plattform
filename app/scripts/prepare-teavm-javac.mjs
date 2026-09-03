import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  COMPILER_ARTIFACT_BASE_URL,
  COMPILER_ARTIFACTS,
} from "./../src/pages/Programming1/Java/pins_compiler/teavm-javac-artifacts.mjs";

export { COMPILER_ARTIFACT_BASE_URL, COMPILER_ARTIFACTS };

/**
 * Computes the SHA-256 hash of a file on disk.
 *
 * @param {string} filePath
 * @returns {Promise<string>} Hex-encoded SHA-256 hash
 */
export async function calculateFileSha256(filePath) {
  const fileBuffer = await fs.promises.readFile(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

/**
 * Checks if all required compiler artifacts exist locally and match their expected SHA-256 hashes.
 *
 * @param {string} targetDir
 * @param {readonly typeof COMPILER_ARTIFACTS} [artifacts=COMPILER_ARTIFACTS]
 * @returns {Promise<{ valid: true } | { valid: false, reason: "missing" | "mismatch", fileName: string, expected?: string, actual?: string }>}
 */
export async function verifyLocalArtifacts(
  targetDir,
  artifacts = COMPILER_ARTIFACTS,
) {
  for (const artifact of artifacts) {
    const filePath = path.join(targetDir, artifact.fileName);

    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        reason: "missing",
        fileName: artifact.fileName,
      };
    }

    const actualSha256 = await calculateFileSha256(filePath);
    if (actualSha256.toLowerCase() !== artifact.sha256.toLowerCase()) {
      return {
        valid: false,
        reason: "mismatch",
        fileName: artifact.fileName,
        expected: artifact.sha256,
        actual: actualSha256,
      };
    }
  }

  return { valid: true };
}

/**
 * Downloads a single artifact from the given base URL, verifies its SHA-256 checksum,
 * and writes it to targetDir.
 *
 * @param {string} baseUrl
 * @param {{ fileName: string, sha256: string }} artifact
 * @param {string} targetDir
 * @returns {Promise<{ fileName: string, size: number, sha256: string }>}
 */
export async function downloadAndVerifyArtifact(baseUrl, artifact, targetDir) {
  const url = `${baseUrl.replace(/\/+$/, "")}/${artifact.fileName}`;
  console.log(
    `[prepare-teavm-javac] Downloading ${artifact.fileName} from ${url}...`,
  );

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download ${artifact.fileName} from ${url}: HTTP ${response.status} ${response.statusText}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const actualSha256 = crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex")
    .toLowerCase();
  const expectedSha256 = artifact.sha256.toLowerCase();

  if (actualSha256 !== expectedSha256) {
    throw new Error(
      `SHA-256 verification failed for ${artifact.fileName}!\n` +
        `  URL:      ${url}\n` +
        `  Expected: ${expectedSha256}\n` +
        `  Actual:   ${actualSha256}\n` +
        `Aborting build.`,
    );
  }

  const destinationPath = path.join(targetDir, artifact.fileName);
  await fs.promises.writeFile(destinationPath, buffer);

  console.log(
    `[prepare-teavm-javac] Verified and saved ${artifact.fileName} ` +
      `(${buffer.length} bytes, SHA-256: ${actualSha256.slice(0, 12)}...)`,
  );

  return {
    fileName: artifact.fileName,
    size: buffer.length,
    sha256: actualSha256,
  };
}

/**
 * Removes legacy .teavm-javac-commit stamp files if present in the target directory.
 *
 * @param {string} targetDir
 * @returns {Promise<void>}\n */
export async function cleanObsoleteStampFiles(targetDir) {
  const legacyStampPath = path.join(targetDir, ".teavm-javac-commit");
  if (fs.existsSync(legacyStampPath)) {
    await fs.promises.rm(legacyStampPath, { force: true });
    console.log(
      "[prepare-teavm-javac] Cleaned up obsolete legacy stamp file .teavm-javac-commit",
    );
  }
}

/**
 * Resolves the target directory for the Java compiler assets.
 *
 * @param {string} [customDir]
 * @returns {string}
 */
export function resolveTargetDir(customDir) {
  if (customDir) {
    return path.resolve(customDir);
  }
  if (process.env.TEAVM_JAVAC_OUTPUT_DIR) {
    return path.resolve(process.env.TEAVM_JAVAC_OUTPUT_DIR);
  }
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, "../public/java/compiler");
}

/**
 * Prepares the official TeaVM compiler artifacts:
 * - Checks local cache: if all artifacts exist and match SHA-256, preparation is skipped.
 * - Otherwise downloads all artifacts, validates SHA-256 hashes, and saves them to targetDir.
 *
 * @param {object} [options]
 * @param {string} [options.targetDir]
 * @param {string} [options.baseUrl]
 * @param {readonly typeof COMPILER_ARTIFACTS} [options.artifacts]
 * @param {boolean} [options.force]
 * @returns {Promise<{ skipped: boolean, targetDir: string, artifacts: readonly any[] }>}
 */
export async function prepareCompilerArtifacts(options = {}) {
  const targetDir = resolveTargetDir(options.targetDir);
  const baseUrl =
    options.baseUrl ||
    process.env.TEAVM_JAVAC_BASE_URL ||
    COMPILER_ARTIFACT_BASE_URL;
  const artifacts = options.artifacts || COMPILER_ARTIFACTS;
  const force = Boolean(options.force);

  await fs.promises.mkdir(targetDir, { recursive: true });
  await cleanObsoleteStampFiles(targetDir);

  if (!force) {
    const cacheStatus = await verifyLocalArtifacts(targetDir, artifacts);
    if (cacheStatus.valid) {
      console.log(
        `[prepare-teavm-javac] All ${artifacts.length} compiler artifacts are already present and verified by SHA-256 in ${targetDir}. Skipping download.`,
      );
      return { skipped: true, targetDir, artifacts };
    }

    if (cacheStatus.reason === "missing") {
      console.log(
        `[prepare-teavm-javac] Artifact "${cacheStatus.fileName}" is missing in ${targetDir}. Preparing official TeaVM compiler artifacts...`,
      );
    } else {
      console.log(
        `[prepare-teavm-javac] Artifact "${cacheStatus.fileName}" SHA-256 mismatch in ${targetDir} ` +
          `(expected: ${cacheStatus.expected}, actual: ${cacheStatus.actual}). Preparing official TeaVM compiler artifacts...`,
      );
    }
  }

  for (const artifact of artifacts) {
    await downloadAndVerifyArtifact(baseUrl, artifact, targetDir);
  }

  const finalCheck = await verifyLocalArtifacts(targetDir, artifacts);
  if (!finalCheck.valid) {
    throw new Error(
      `Artifact verification failed after download for ${finalCheck.fileName}!`,
    );
  }

  console.log(
    `[prepare-teavm-javac] Successfully prepared and verified all ${artifacts.length} compiler artifacts in ${targetDir}.`,
  );

  return { skipped: false, targetDir, artifacts };
}

const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  prepareCompilerArtifacts()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(`[prepare-teavm-javac] ERROR: ${error.message}`);
      process.exit(1);
    });
}
