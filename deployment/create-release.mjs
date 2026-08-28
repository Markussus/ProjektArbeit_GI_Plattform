import { spawnSync } from "node:child_process";
import { access, chmod, copyFile, mkdir, rm, stat } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createInterface } from "node:readline/promises";

/* ============================================================
 * Project structure
 *
 * Project-Root/
 * ├── App/
 * │   ├── package.json
 * │   └── dist/
 * ├── Deployment/
 * │   ├── create-release.mjs
 * │   ├── start.cmd
 * │   ├── start.sh
 * │   ├── serve.py
 * │   └── releases/
 * └── Docs/
 * ============================================================ */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const deploymentDir = __dirname;
const repositoryRoot = path.resolve(deploymentDir, "..");
const appDir = path.join(repositoryRoot, "App");
const distDir = path.join(appDir, "dist");
const releasesDir = path.join(deploymentDir, "releases");

const appPackageJson = path.join(appDir, "package.json");

const launcherFiles = ["start.cmd", "start.sh", "serve.py"];

const npmExecPath = process.env.npm_execpath;

function runNpm(args, options = {}) {
  if (!npmExecPath) {
    throw new Error(
      "npm execution path is unavailable. Start the release builder with 'npm run release'.",
    );
  }

  return run(process.execPath, [npmExecPath, ...args], options);
}

/* ============================================================
 * Load dependencies from App/node_modules
 *
 * create-release.mjs lives outside App/, therefore a normal
 * import of "archiver" would not reliably find App/node_modules.
 * ============================================================ */

const requireFromApp = createRequire(appPackageJson);
const archiverPath = requireFromApp.resolve("archiver");
const { ZipArchive } = await import(pathToFileURL(archiverPath).href);

/* ============================================================
 * Console utilities
 * ============================================================ */

function printStep(message) {
  console.log();
  console.log("============================================================");
  console.log(message);
  console.log("============================================================");
  console.log();
}

/* ============================================================
 * Process execution
 * ============================================================ */

function run(command, args = [], options = {}) {
  const cwd = options.cwd ?? repositoryRoot;

  const result = spawnSync(command, args, {
    cwd,
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    if (options.capture && result.stderr) {
      console.error(result.stderr.trim());
    }

    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }

  if (options.capture) {
    return result.stdout.trim();
  }

  return "";
}

function commandExists(command) {
  const result = spawnSync(command, ["--version"], {
    stdio: "ignore",
    shell: false,
  });

  return result.status === 0;
}

/* ============================================================
 * Git helpers
 * ============================================================ */

function getCurrentBranch() {
  const branch = run("git", ["branch", "--show-current"], {
    capture: true,
    cwd: repositoryRoot,
  });

  if (!branch) {
    throw new Error(
      "Detached HEAD detected. Checkout a normal branch before creating a release.",
    );
  }

  return branch;
}

function ensureWorkingTreeClean() {
  const status = run("git", ["status", "--porcelain"], {
    capture: true,
    cwd: repositoryRoot,
  });

  if (status) {
    console.error();
    console.error("Uncommitted or untracked changes found:");
    console.error();
    console.error(status);

    throw new Error(
      "The working tree is not clean. Commit or discard all changes before creating a release.",
    );
  }
}

function ensureRepositoryIsReleaseReady() {
  printStep("Checking Git repository");

  /*
   * No modified, staged or untracked files are allowed.
   */
  ensureWorkingTreeClean();

  const branch = getCurrentBranch();

  console.log(`Current branch: ${branch}`);

  /*
   * Determine the remote belonging to the current branch.
   *
   * This is normally "origin", but we do not hardcode it.
   */
  let remote;

  try {
    remote = run("git", ["config", "--get", `branch.${branch}.remote`], {
      capture: true,
      cwd: repositoryRoot,
    });
  } catch {
    throw new Error(
      `Branch '${branch}' has no configured remote. Push the branch first.`,
    );
  }

  if (!remote || remote === ".") {
    throw new Error(
      `Branch '${branch}' has no usable remote branch. Push it to GitLab first.`,
    );
  }

  /*
   * Make sure an upstream branch exists.
   */
  let upstream;

  try {
    upstream = run(
      "git",
      ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"],
      {
        capture: true,
        cwd: repositoryRoot,
      },
    );
  } catch {
    throw new Error(
      `Branch '${branch}' has no upstream branch. Push the branch to GitLab first.`,
    );
  }

  console.log(`Remote branch:  ${upstream}`);

  console.log();
  console.log("Fetching latest GitLab state...");

  /*
   * Update the remote branch and all tags.
   */
  run("git", ["fetch", remote, "--tags", "--prune"], {
    cwd: repositoryRoot,
  });

  const localCommit = run("git", ["rev-parse", "HEAD"], {
    capture: true,
    cwd: repositoryRoot,
  });

  const remoteCommit = run("git", ["rev-parse", "@{u}"], {
    capture: true,
    cwd: repositoryRoot,
  });

  /*
   * Local HEAD must be exactly the same commit as the
   * current remote branch.
   */
  if (localCommit !== remoteCommit) {
    const counts = run(
      "git",
      ["rev-list", "--left-right", "--count", "HEAD...@{u}"],
      {
        capture: true,
        cwd: repositoryRoot,
      },
    );

    const [ahead, behind] = counts.split(/\s+/).map(Number);

    if (ahead > 0 && behind > 0) {
      throw new Error(
        `The local branch has diverged from '${upstream}'. ` +
        `Local commits ahead: ${ahead}, remote commits ahead: ${behind}.`,
      );
    }

    if (ahead > 0) {
      throw new Error(
        `There are ${ahead} unpushed commit(s) on '${branch}'. Push them before creating a release.`,
      );
    }

    if (behind > 0) {
      throw new Error(
        `Branch '${branch}' is ${behind} commit(s) behind '${upstream}'. Pull the latest changes before creating a release.`,
      );
    }

    throw new Error("The local HEAD does not match the remote branch.");
  }

  console.log();
  console.log("Repository state:");
  console.log(`  Branch: ${branch}`);
  console.log(`  Remote: ${upstream}`);
  console.log(`  Commit: ${localCommit.slice(0, 8)}`);
  console.log();
  console.log("✓ Working tree is clean");
  console.log("✓ All local commits are pushed");
  console.log("✓ Local branch matches GitLab");

  return {
    branch,
    upstream,
    remote,
    commit: localCommit,
  };
}

/* ============================================================
 * Validate project structure
 * ============================================================ */

async function validateProjectStructure() {
  try {
    await access(appPackageJson);
  } catch {
    throw new Error(
      "App/package.json was not found. Expected project structure: <root>/App/package.json",
    );
  }

  for (const file of launcherFiles) {
    const source = path.join(deploymentDir, file);

    try {
      await access(source);
    } catch {
      throw new Error(
        `Required deployment file is missing: Deployment/${file}`,
      );
    }
  }
}

/* ============================================================
 * Build
 * ============================================================ */

async function buildApplication() {
  printStep("Building application");
  console.log(`App directory: ${appDir}`);
  console.log(`Build output:  ${distDir}`);
  console.log();

  /*
   * Remove old build completely.
   */
  await rm(distDir, {
    recursive: true,
    force: true,
  });

  /*
   * IMPORTANT:
   * npm runs from App/, because package.json lives there.
   */
  runNpm(["run", "build"], {
    cwd: appDir,
  });

  /*
   * Verify that App/dist was actually produced.
   */
  try {
    const info = await stat(distDir);

    if (!info.isDirectory()) {
      throw new Error();
    }
  } catch {
    throw new Error("Build finished but App/dist was not created.");
  }

  console.log();
  console.log("✓ Production build created in App/dist");
}

/* ============================================================
 * Add launcher files to App/dist
 * ============================================================ */

async function copyDeploymentFiles() {
  printStep("Adding local launcher files");

  for (const file of launcherFiles) {
    const source = path.join(deploymentDir, file);

    const target = path.join(distDir, file);

    await copyFile(source, target);

    console.log(`✓ ${file}`);
  }

  /*
   * Make start.sh executable on systems that support chmod.
   */
  try {
    await chmod(path.join(distDir, "start.sh"), 0o755);
  } catch {
    // Not relevant on Windows.
  }
}

/* ============================================================
 * Version handling
 * ============================================================ */

function getVersionTags() {
  const output = run("git", ["tag", "--list", "v*", "--sort=-v:refname"], {
    capture: true,
    cwd: repositoryRoot,
  });

  if (!output) {
    return [];
  }

  /*
   * We only care about simple releases:
   * v1.0.0
   * v1.0.1
   * v1.0.2
   */
  return output
    .split(/\r?\n/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag));
}

function suggestNextVersion(tags) {
  if (tags.length === 0) {
    return "v1.0.0";
  }

  const match = tags[0].match(/^v(\d+)\.(\d+)\.(\d+)$/);

  if (!match) {
    return "v1.0.0";
  }

  const major = Number(match[1]);

  const minor = Number(match[2]);

  const patch = Number(match[3]);

  /*
   * Simple numbering:
   * v1.0.0
   * v1.0.1
   * v1.0.2
   * ...
   */
  return `v${major}.${minor}.${patch + 1}`;
}

function normalizeVersion(input) {
  const value = input.trim();

  if (/^\d+\.\d+\.\d+$/.test(value)) {
    return `v${value}`;
  }

  if (/^v\d+\.\d+\.\d+$/.test(value)) {
    return value;
  }

  throw new Error("Invalid version. Use a version such as v1.0.0 or 1.0.0.");
}

function ensureTagDoesNotExist(tag) {
  const existing = run("git", ["tag", "--list", tag], {
    capture: true,
    cwd: repositoryRoot,
  });

  if (existing === tag) {
    throw new Error(`Git tag '${tag}' already exists.`);
  }
}

/* ============================================================
 * Create ZIP
 * ============================================================ */

async function createZip(zipPath) {
  printStep("Creating release ZIP");

  await mkdir(releasesDir, {
    recursive: true,
  });

  /*
   * Remove an old local ZIP with the same name if present.
   */
  await rm(zipPath, {
    force: true,
  });

  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);

    const archive = new ZipArchive({
      zlib: {
        level: 9,
      },
    });

    output.on("close", () => {
      const sizeMb = archive.pointer() / 1024 / 1024;

      console.log(`✓ ${path.basename(zipPath)}`);
      console.log(`  Size: ${sizeMb.toFixed(2)} MB`);

      resolve();
    });

    archive.on("warning", (error) => {
      if (error.code === "ENOENT") {
        console.warn(error.message);
        return;
      }

      reject(error);
    });

    archive.on("error", reject);

    archive.pipe(output);

    /*
     * IMPORTANT:
     *
     * Only the CONTENTS of App/dist are placed in the ZIP.
     *
     * ZIP:
     * ├── index.html
     * ├── assets/
     * ├── start.cmd
     * ├── start.sh
     * └── serve.py
     *
     * There is NO App/dist/ directory inside the ZIP.
     */
    archive.directory(distDir, false);

    archive.finalize();
  });
}

/* ============================================================
 * Release Notes
 * ============================================================ */

function createReleaseNotes({ tag, branch, commit, previousTag }) {
  const lines = [
    `Portable build of the GI Training Center ${tag}.`,
    "",
    `Branch: \`${branch}\``,
    `Commit: \`${commit.slice(0, 8)}\``,
  ];

  if (previousTag) {
    lines.push(`Previous release: \`${previousTag}\``);
  }

  return lines.join("\n");
}

/* ============================================================
 * User input
 * ============================================================ */

async function askQuestion(question) {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    return await readline.question(question);
  } finally {
    readline.close();
  }
}

/* ============================================================
 * Main
 * ============================================================ */

async function main() {
  console.log();
  console.log("============================================================");
  console.log("GI Training Center - Release Builder");
  console.log("============================================================");
  console.log();
  printStep("Checking environment");

  if (!commandExists("git")) {
    throw new Error("Git was not found.");
  }

  if (!npmExecPath) {
    throw new Error("npm execution path was not found. Start this script with 'npm run release'.",);
  }

  if (!commandExists("glab")) {
    throw new Error(
      "GitLab CLI (glab) was not found. Install glab and authenticate first.",
    );
  }

  await validateProjectStructure();

  console.log("✓ Git available");
  console.log("✓ npm available");
  console.log("✓ glab available");
  console.log("✓ App/package.json found");
  console.log("✓ Deployment files available");

  /*
   * Git repository check
   */
  const repository = ensureRepositoryIsReleaseReady();

  /*
   * GitLab authentication
   */
  printStep("Checking GitLab authentication");

  run("glab", ["auth", "status"], {
    cwd: repositoryRoot,
  });

  /*
   * Build App
   */
  await buildApplication();

  /*
   * Copy:
   *
   * Deployment/start.cmd
   * Deployment/start.sh
   * Deployment/serve.py
   *
   * into:
   *
   * App/dist/
   */
  await copyDeploymentFiles();

  /*
   * Run the Git cleanliness check again.
   *
   * App/dist and Deployment/releases should be ignored by Git.
   *
   * If the build unexpectedly modified tracked source files,
   * the release is aborted here.
   */
  ensureWorkingTreeClean();

  /*
   * Determine version
   */
  printStep("Selecting release version");

  const tags = getVersionTags();

  const previousTag = tags[0] ?? null;

  const suggestedVersion = suggestNextVersion(tags);

  console.log(`Latest release: ${previousTag ?? "none"}`);
  console.log(`Suggested:      ${suggestedVersion}`);
  console.log();

  const enteredVersion = await askQuestion(
    `Release version [${suggestedVersion}]: `,
  );

  const tag = normalizeVersion(enteredVersion.trim() || suggestedVersion);

  ensureTagDoesNotExist(tag);

  /*
   * ZIP destination:
   *
   * Deployment/releases/
   */
  const zipName = `GI-TrainingCenter-${tag}.zip`;

  const zipPath = path.join(releasesDir, zipName);

  await createZip(zipPath);

  /*
   * Final Summary
   */
  printStep("RELEASE SUMMARY");

  console.log(`Branch:           ${repository.branch}`);
  console.log(`Remote branch:    ${repository.upstream}`);
  console.log(`Commit:           ${repository.commit.slice(0, 8)}`);
  console.log(`Previous release: ${previousTag ?? "none"}`);
  console.log(`New release:      ${tag}`);
  console.log(`Build source:     App/dist`);
  console.log(`ZIP:              Deployment/releases/${zipName}`);
  console.log();
  console.log("The following actions will be performed:");
  console.log(`  1. Create Git tag ${tag}`);
  console.log(`  2. Push tag ${tag} to GitLab`);
  console.log(`  3. Create GitLab Release ${tag}`);
  console.log(`  4. Upload ${zipName}`);
  console.log();

  /*
   * Explicit confirmation required.
   *
   * Just pressing Enter means NO.
   */
  const answer = await askQuestion("Publish this release? [y/N]: ");

  const confirmed =
    answer.trim().toLowerCase() === "y" ||
    answer.trim().toLowerCase() === "yes";

  if (!confirmed) {
    console.log();
    console.log("Release cancelled.");
    console.log();
    console.log("No Git tag was created.");
    console.log("Nothing was uploaded to GitLab.");
    console.log();
    console.log("The locally generated ZIP remains available at:");
    console.log(`Deployment/releases/${zipName}`);
    return;
  }

  /*
   * Create annotated Git tag
   */
  printStep(`Creating Git tag ${tag}`);

  run("git", ["tag", "-a", tag, "-m", `GI Training Center ${tag}`], {
    cwd: repositoryRoot,
  });

  /*
   * Push tag using the same remote as the current branch.
   */
  printStep(`Pushing ${tag} to GitLab`);

  try {
    run("git", ["push", repository.remote, tag], {
      cwd: repositoryRoot,
    });
  } catch (error) {
    console.error();
    console.error("The Git tag was created locally but could not be pushed.");
    console.error();
    console.error("Remove the local tag with:");
    console.error(`git tag -d ${tag}`);

    throw error;
  }

  /*
   * Release Notes
   */
  const notes = createReleaseNotes({
    tag,
    branch: repository.branch,
    commit: repository.commit,
    previousTag,
  });

  /*
   * Create GitLab Release and upload ZIP.
   */
  printStep("Creating GitLab Release");

  try {
    run(
      "glab",
      [
        "release",
        "create",
        tag,

        `${zipPath}#GI Training Center ${tag}#package`,

        "--name",
        `GI Training Center ${tag}`,

        "--notes",
        notes,

        "--use-package-registry",

        "--package-name",
        "gi-training-center",
      ],
      {
        cwd: repositoryRoot,
      },
    );
  } catch (error) {
    console.error();
    console.error(`Git tag '${tag}' was pushed successfully,`);
    console.error("but creation of the GitLab Release failed.");
    console.error();
    console.error("The ZIP is still available locally:");
    console.error(`Deployment/releases/${zipName}`);
    console.error();
    console.error("The Git tag already exists on GitLab.");
    console.error("You can retry only the release upload manually.");

    throw error;
  }

  /*
   * Finished
   */
  printStep("RELEASE COMPLETED");
  console.log(`Release: ${tag}`);
  console.log(`Branch:  ${repository.branch}`);
  console.log(`Commit:  ${repository.commit.slice(0, 8)}`);
  console.log(`Asset:   ${zipName}`);
  console.log();
  console.log("The release ZIP has been uploaded successfully.");
  console.log();
}

main().catch((error) => {
  console.error();
  console.error(`RELEASE FAILED: ${error.message}`);
  console.error();
  process.exit(1);
});
