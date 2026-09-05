import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const nodeBinDir = path.dirname(process.execPath);
const npmCli =
  process.platform === "win32"
    ? path.join(nodeBinDir, "node_modules", "npm", "bin", "npm-cli.js")
    : null;
const npxCli =
  process.platform === "win32"
    ? path.join(nodeBinDir, "node_modules", "npm", "bin", "npx-cli.js")
    : null;

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: false,
    env: {
      ...process.env,
      NPM_CONFIG_CACHE: ".npm",
      CI: "true",
    },
  });

  if (result.error) {
    console.error(`Failed to run: ${command} ${args.join(" ")}`);
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runNpm(args) {
  if (process.platform === "win32" && npmCli) {
    run(process.execPath, [npmCli, ...args]);
    return;
  }

  run("npm", args);
}

function runNpx(args) {
  if (process.platform === "win32" && npxCli) {
    run(process.execPath, [npxCli, ...args]);
    return;
  }

  run("npx", args);
}

function stage(name) {
  console.log(`\n=== ${name} ===`);
}

function ensureDependenciesInstalled() {
  const nodeModulesDir = path.join(process.cwd(), "node_modules");
  const viteBin = path.join(
    nodeModulesDir,
    ".bin",
    process.platform === "win32" ? "vite.cmd" : "vite",
  );

  if (fs.existsSync(nodeModulesDir) && fs.existsSync(viteBin)) {
    return;
  }

  console.error("Missing local dependencies in node_modules.");
  console.error("Run `npm ci --cache .npm --prefer-offline` once, then retry.");
  process.exit(1);
}

stage("verify");
run("node", ["--version"]);
runNpm(["--version"]);
ensureDependenciesInstalled();
runNpx(["vite", "--version"]);
runNpx(["vitest", "--version"]);
runNpx(["playwright", "--version"]);
runNpx(["lhci", "--version"]);

stage("java compiler");
runNpm(["run", "prepare:java-compiler"]);

stage("quality");
runNpm(["run", "format:check"]);
runNpm(["run", "lint"]);

stage("unit");
runNpm(["run", "test"]);

stage("build");
runNpm(["run", "build:app"]);

stage("lighthouse");
runNpm(["run", "lhci:ci"]);

stage("e2e");
runNpm(["run", "e2e:ci"]);
