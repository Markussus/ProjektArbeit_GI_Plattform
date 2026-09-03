export type TeaVmImports = Record<string, Record<string, unknown>>;

interface OutputScheduler {
  setTimeout(callback: () => void, delay: number): number;
  clearTimeout(timeoutId: number): void;
}

interface BufferedWorkerOutputOptions {
  stream: "stdout" | "stderr";
  requestId: string;
  postMessage: (message: unknown) => void;
  scheduler: OutputScheduler;
  flushDelay?: number;
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
}: BufferedWorkerOutputOptions): BufferedWorkerOutput {
  let output = "";
  let buffer = "";
  let timeoutId: number | undefined;

  const flush = () => {
    if (buffer) {
      postMessage({ type: stream, requestId, data: buffer });
      buffer = "";
    }
    timeoutId = undefined;
  };

  return {
    writeCharacter(charCode) {
      const nextCharacter = String.fromCharCode(charCode);
      output += nextCharacter;
      buffer += nextCharacter;
      timeoutId ??= scheduler.setTimeout(flush, flushDelay);
    },
    flush,
    dispose() {
      if (timeoutId !== undefined) {
        scheduler.clearTimeout(timeoutId);
      }
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
