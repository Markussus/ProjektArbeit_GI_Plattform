import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const HOST = "127.0.0.1";
const isWindows = process.platform === "win32";
const nodeBinDir = path.dirname(process.execPath);
const npmCli = isWindows
  ? path.join(nodeBinDir, "node_modules", "npm", "bin", "npm-cli.js")
  : null;
const npxCli = isWindows
  ? path.join(nodeBinDir, "node_modules", "npm", "bin", "npx-cli.js")
  : null;

const tasks = {
  e2e: {
    env: (baseUrl) => ({
      PLAYWRIGHT_BASE_URL: baseUrl,
      PLAYWRIGHT_MANAGED_PREVIEW: "1",
    }),
    command: [
      isWindows ? process.execPath : "npx",
      isWindows && npxCli
        ? [npxCli, "playwright", "test", "tests/e2e", "--project=chromium"]
        : ["playwright", "test", "tests/e2e", "--project=chromium"],
    ],
  },
  lhci: {
    env: (baseUrl) => ({
      LHCI_BASE_URL: baseUrl,
    }),
    steps: [
      [
        isWindows ? process.execPath : "npm",
        isWindows && npmCli
          ? [npmCli, "run", "lhci:config"]
          : ["run", "lhci:config"],
      ],
      [
        isWindows ? process.execPath : "npm",
        isWindows && npmCli
          ? [npmCli, "run", "lighthouse:ci"]
          : ["run", "lighthouse:ci"],
      ],
    ],
  },
};

function getPreviewCommand(port) {
  if (isWindows && npmCli) {
    return [
      process.execPath,
      [npmCli, "run", "preview:ci", "--", "--port", String(port)],
    ];
  }

  return ["npm", ["run", "preview:ci", "--", "--port", String(port)]];
}

function getTaskName() {
  const taskArg = process.argv
    .slice(2)
    .find((arg) => arg.startsWith("--task="));
  return taskArg?.split("=")[1];
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.on("error", reject);
    server.listen(0, HOST, () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Failed to resolve a free port.")));
        return;
      }

      server.close((closeError) => {
        if (closeError) {
          reject(closeError);
          return;
        }

        resolve(address.port);
      });
    });
  });
}

function spawnCommand(command, args, extraEnv = {}) {
  return spawn(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: false,
    env: {
      ...process.env,
      ...extraEnv,
    },
  });
}

async function waitForServer(url, timeoutMs = 120_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      // Server is not ready yet.
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for preview server at ${url}.`);
}

async function runStep(command, args, extraEnv = {}) {
  const child = spawnCommand(command, args, extraEnv);

  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(
          new Error(
            `Command exited via signal ${signal}: ${command} ${args.join(" ")}`,
          ),
        );
        return;
      }

      resolve(code ?? 1);
    });
  });
}

function terminateChild(child) {
  if (!child || child.killed) {
    return;
  }

  if (isWindows) {
    const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
      shell: false,
    });

    killer.unref();
    return;
  }

  child.kill("SIGTERM");
}

async function main() {
  const taskName = getTaskName();
  const task = taskName ? tasks[taskName] : null;

  if (!task) {
    console.error(
      "Usage: node scripts/run-preview-command.mjs --task=e2e|lhci",
    );
    return 1;
  }

  const port = await getFreePort();
  const baseUrl = `http://${HOST}:${port}`;
  const sharedEnv = {
    BASE_URL: baseUrl,
    PORT: String(port),
  };
  const [previewCommand, previewArgs] = getPreviewCommand(port);
  const preview = spawnCommand(previewCommand, previewArgs, sharedEnv);

  try {
    await waitForServer(baseUrl);

    const taskEnv = {
      ...sharedEnv,
      ...task.env(baseUrl),
    };

    if ("steps" in task) {
      for (const [command, args] of task.steps) {
        const exitCode = await runStep(command, args, taskEnv);

        if (exitCode !== 0) {
          return exitCode;
        }
      }

      return 0;
    }

    const [command, args] = task.command;
    return await runStep(command, args, taskEnv);
  } finally {
    terminateChild(preview);
  }
}

main()
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
