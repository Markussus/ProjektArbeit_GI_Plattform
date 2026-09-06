export type TeaVmImports = Record<string, Record<string, unknown>>;

export interface OutputScheduler {
  setTimeout(callback: () => void, delay: number): number;
  clearTimeout(timeoutId: number): void;
  now?(): number;
}

export interface BufferedWorkerOutputOptions {
  stream: "stdout" | "stderr";
  requestId: string;
  postMessage: (message: unknown) => void;
  scheduler?: OutputScheduler;
  flushDelay?: number;
  now?: () => number;
}

export interface BufferedWorkerOutput {
  writeCharacter(charCode: number): void;
  flush(): void;
  dispose(): void;
  getOutput(): string;
}

export function createBufferedWorkerOutput({
  stream,
  requestId,
  postMessage,
  scheduler,
  flushDelay = 50,
  now,
}: BufferedWorkerOutputOptions): BufferedWorkerOutput {
  let output = "";
  let buffer = "";
  let timeoutId: number | undefined;
  let firstCharTime: number | undefined;

  const getNow =
    now ??
    (scheduler?.now
      ? () => scheduler.now!()
      : typeof performance !== "undefined" &&
          typeof performance.now === "function"
        ? () => performance.now()
        : () => Date.now());

  const flush = () => {
    if (timeoutId !== undefined && scheduler) {
      scheduler.clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    firstCharTime = undefined;

    if (buffer) {
      postMessage({ type: stream, requestId, data: buffer });
      buffer = "";
    }
  };

  return {
    writeCharacter(charCode) {
      const nextCharacter = String.fromCharCode(charCode);
      output += nextCharacter;
      buffer += nextCharacter;

      const currentTime = getNow();
      if (firstCharTime === undefined) {
        firstCharTime = currentTime;
        if (scheduler) {
          timeoutId = scheduler.setTimeout(flush, flushDelay);
        }
      } else if (currentTime - firstCharTime >= flushDelay) {
        flush();
      }
    },
    flush,
    dispose() {
      flush();
    },
    getOutput: () => output,
  };
}

export function installTeaVmConsole(
  imports: TeaVmImports,
  stdout: BufferedWorkerOutput,
  stderr: BufferedWorkerOutput,
): void {
  const teavmConsole = (imports.teavmConsole ??= {});
  teavmConsole.putcharStdout = stdout.writeCharacter;
  teavmConsole.putcharStderr = stderr.writeCharacter;
}
