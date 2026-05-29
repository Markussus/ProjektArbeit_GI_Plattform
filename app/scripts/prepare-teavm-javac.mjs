import {
  access,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(appDir, "..");

const TEAVM_JAVAC_REPO_URL = "https://github.com/konsoletyper/teavm-javac.git";
const TEAVM_JAVAC_COMMIT = "7e4a44cf521694a4e326e33850dd8aec165eb5c9";
const OPENJDK_REVISION = "6c48f4ed707bf0b15f9b6098de30db8aae6fa40f";
const OFFICIAL_PLAYGROUND_BASE_URL = "https://teavm.org/playground/3";
const OFFICIAL_ARTIFACTS = [
  {
    fileName: "compiler.wasm",
    sha256: "7f3828e4b7bddf5504dadebfc4016e40f4441e15ee0519071781813ba2ed3a4c",
  },
  {
    fileName: "compiler.wasm-runtime.js",
    sha256: "9ff6a6771f698be00ab9d5c7b46d904350a8d4115dc0b409553f31ed66688a55",
  },
  {
    fileName: "compile-classlib-teavm.bin",
    sha256: "e80ae10423a39290c5f20b6bb6da34d21c3ad0a75cd8dbdda4998d2813045e15",
  },
  {
    fileName: "runtime-classlib-teavm.bin",
    sha256: "ea670e71967eda93828cb894c1741a8ed2e94b3422eb99cb9eccec0de67daaa8",
  },
  {
    fileName: "worker.js",
    sha256: "20045d5e753b14774e0b6ee65541cff6a15f6747813227ed665152613f08810a",
  },
];

const thirdPartyDir = path.join(repoRoot, "third_party");
const sourceDir = path.join(thirdPartyDir, "teavm-javac-src");
const outputDir = path.join(appDir, "public", "java", "compiler");
const distZipPath = path.join(
  sourceDir,
  "compiler",
  "build",
  "distributions",
  "dist.zip",
);
const stampPath = path.join(outputDir, ".teavm-javac-commit");
const requiredDistFiles = [
  "compiler.wasm",
  "compiler.wasm-runtime.js",
  "compile-classlib-teavm.bin",
  "runtime-classlib-teavm.bin",
];
const requiredOutputFiles = OFFICIAL_ARTIFACTS.map(({ fileName }) => fileName);

async function main() {
  await mkdir(thirdPartyDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });

  await ensureCommand("git", ["--version"], {
    errorMessage:
      "Git was not found. Please install Git and make sure it is available in PATH.",
  });
  await ensureCommand("java", ["-version"], {
    errorMessage:
      "Java/JDK was not found. Please install a compatible JDK, preferably JDK 25 for the current teavm-javac version.",
  });
  await warnIfJavaVersionIsNot25();

  await ensureSourceRepository();
  await ensureGradleWrapper();

  if (await canSkipBuild()) {
    console.log(
      `teavm-javac artifacts are already prepared at commit ${TEAVM_JAVAC_COMMIT}.`,
    );
    return;
  }

  await buildCompilerDistribution();
  await copyOfficialArtifacts();
  await writeFile(stampPath, `${TEAVM_JAVAC_COMMIT}\n`, "utf8");

  console.log(
    `Prepared teavm-javac ${TEAVM_JAVAC_COMMIT} (OpenJDK ${OPENJDK_REVISION}) into ${path.relative(appDir, outputDir)} using pinned official TeaVM playground artifacts.`,
  );
}

async function ensureSourceRepository() {
  if (!(await pathExists(sourceDir))) {
    await run("git", ["clone", TEAVM_JAVAC_REPO_URL, sourceDir], {
      cwd: repoRoot,
    });
  }

  const gitDir = path.join(sourceDir, ".git");
  if (!(await pathExists(gitDir))) {
    throw new Error(
      `Expected ${sourceDir} to be a Git repository, but .git was not found.`,
    );
  }

  const remoteUrl = await capture("git", ["remote", "get-url", "origin"], {
    cwd: sourceDir,
  });
  if (remoteUrl.trim() !== TEAVM_JAVAC_REPO_URL) {
    throw new Error(
      `Unexpected teavm-javac remote URL. Expected ${TEAVM_JAVAC_REPO_URL}, found ${remoteUrl.trim()}.`,
    );
  }

  await run("git", ["fetch", "--all", "--tags"], { cwd: sourceDir });
  await run("git", ["checkout", TEAVM_JAVAC_COMMIT], { cwd: sourceDir });
}

async function ensureGradleWrapper() {
  const wrapperPath =
    process.platform === "win32"
      ? path.join(sourceDir, "gradlew.bat")
      : path.join(sourceDir, "gradlew");

  if (!(await pathExists(wrapperPath))) {
    throw new Error(
      "Gradle wrapper was not found in teavm-javac. Expected ./gradlew or gradlew.bat.",
    );
  }
}

async function canSkipBuild() {
  if (!(await pathExists(stampPath))) {
    return false;
  }

  const stamp = (await readFile(stampPath, "utf8")).trim();
  if (stamp !== TEAVM_JAVAC_COMMIT) {
    return false;
  }

  const head = (
    await capture("git", ["rev-parse", "HEAD"], {
      cwd: sourceDir,
    })
  ).trim();
  if (head !== TEAVM_JAVAC_COMMIT) {
    return false;
  }

  for (const fileName of requiredOutputFiles) {
    const outputFile = path.join(outputDir, fileName);
    if (!(await pathExists(outputFile))) {
      return false;
    }
  }

  return outputMatchesOfficialArtifacts();
}

async function buildCompilerDistribution() {
  const gradleCommand = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
  await run(
    gradleCommand,
    [":compiler:build", ":compiler:createDist"],
    { cwd: sourceDir },
  );

  if (!(await pathExists(distZipPath))) {
    throw new Error(
      `Expected ${distZipPath} after the Gradle build, but it was not generated.`,
    );
  }
}

async function copyOfficialArtifacts() {
  const extractDir = await mkdtemp(path.join(tmpdir(), "teavm-javac-dist-"));

  try {
    await unzip(distZipPath, extractDir);

    for (const fileName of requiredDistFiles) {
      const sourceFile = path.join(extractDir, fileName);
      if (!(await pathExists(sourceFile))) {
        throw new Error(`Missing artifact in dist.zip: ${fileName}`);
      }
    }
  } finally {
    await rm(extractDir, { recursive: true, force: true });
  }

  for (const artifact of OFFICIAL_ARTIFACTS) {
    await downloadOfficialArtifact(artifact);
  }
}

async function outputMatchesOfficialArtifacts() {
  for (const artifact of OFFICIAL_ARTIFACTS) {
    const outputFile = path.join(outputDir, artifact.fileName);
    const hash = await hashFile(outputFile);
    if (hash !== artifact.sha256) {
      return false;
    }
  }

  return true;
}

async function downloadOfficialArtifact(artifact) {
  const response = await fetch(
    `${OFFICIAL_PLAYGROUND_BASE_URL}/${artifact.fileName}`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to download ${artifact.fileName} from ${OFFICIAL_PLAYGROUND_BASE_URL}. HTTP ${response.status}.`,
    );
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const hash = createHash("sha256").update(bytes).digest("hex");

  if (hash !== artifact.sha256) {
    throw new Error(
      `Hash mismatch for ${artifact.fileName}. Expected ${artifact.sha256}, received ${hash}.`,
    );
  }

  await writeFile(path.join(outputDir, artifact.fileName), bytes);
}

async function hashFile(targetPath) {
  const content = await readFile(targetPath);
  return createHash("sha256").update(content).digest("hex");
}

async function ensureCommand(command, args, { errorMessage }) {
  try {
    await run(command, args, { cwd: repoRoot, quiet: true });
  } catch (error) {
    throw new Error(errorMessage, { cause: error });
  }
}

async function warnIfJavaVersionIsNot25() {
  const versionText = await capture("java", ["-version"], {
    cwd: repoRoot,
  });
  const match = versionText.match(/version \"(\d+)(?:\.\d+)?/);
  const majorVersion = match ? Number(match[1]) : null;

  if (majorVersion !== 25) {
    console.warn(
      `Warning: detected Java ${majorVersion ?? "unknown"}. teavm-javac currently targets JDK 25, so builds with other JDK versions may fail or produce invalid compiler artifacts.`,
    );
  }
}

async function unzip(zipPath, destinationDir) {
  if (process.platform === "win32") {
    await run(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        `Expand-Archive -LiteralPath '${escapeForSingleQuotedPowershell(zipPath)}' -DestinationPath '${escapeForSingleQuotedPowershell(destinationDir)}' -Force`,
      ],
      { cwd: repoRoot, quiet: true },
    );
    return;
  }

  await run("unzip", ["-o", zipPath, "-d", destinationDir], {
    cwd: repoRoot,
    quiet: true,
  });
}

function escapeForSingleQuotedPowershell(value) {
  return value.replace(/'/g, "''");
}

async function pathExists(targetPath) {
  try {
    await access(targetPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function capture(command, args, options) {
  const chunks = [];
  const errorChunks = [];

  await run(command, args, {
    ...options,
    onStdout: (chunk) => chunks.push(chunk),
    onStderr: (chunk) => errorChunks.push(chunk),
    quiet: true,
  });

  return chunks.join("").trim() || errorChunks.join("").trim();
}

async function run(command, args, options) {
  const { cwd, quiet = false, onStdout, onStderr } = options;

  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32" && command.endsWith(".bat"),
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      onStdout?.(text);
      if (!quiet) {
        process.stdout.write(text);
      }
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      onStderr?.(text);
      if (!quiet) {
        process.stderr.write(text);
      }
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `Command failed (${command} ${args.join(" ")}):\n${stdout}${stderr}`,
        ),
      );
    });
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
