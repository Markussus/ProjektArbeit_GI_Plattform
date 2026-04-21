import { spawnSync } from "node:child_process";
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

stage("verify");
run("node", ["--version"]);
runNpm(["--version"]);
runNpm(["ci", "--cache", ".npm", "--prefer-offline"]);
runNpx(["vite", "--version"]);
runNpx(["vitest", "--version"]);
runNpx(["playwright", "--version"]);
runNpx(["lhci", "--version"]);

stage("quality");
runNpm(["ci", "--cache", ".npm", "--prefer-offline"]);
runNpm(["run", "format:check"]);
runNpm(["run", "lint"]);

stage("unit");
runNpm(["ci", "--cache", ".npm", "--prefer-offline"]);
runNpm(["run", "test"]);

stage("build");
runNpm(["ci", "--cache", ".npm", "--prefer-offline"]);
runNpm(["run", "build"]);

stage("lighthouse");
runNpm(["ci", "--cache", ".npm", "--prefer-offline"]);
runNpm(["run", "lhci:ci"]);

stage("e2e");
runNpm(["ci", "--cache", ".npm", "--prefer-offline"]);
runNpm(["run", "e2e:ci"]);
