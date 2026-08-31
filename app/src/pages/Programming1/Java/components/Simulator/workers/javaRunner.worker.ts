import { JAVA_COMPILER_ASSET_URLS } from "../domain/javaCompilerAssets";
import type {
  JavaExecutionArtifacts,
  JavaExecutionIssue,
  JavaWorkerCompileAndRunRequest,
  JavaWorkerRequest,
} from "../domain/javaExecution";
import {
  buildWorkerErrorFromEvent,
  createExecutableSource,
  createWorkerError,
  getErrorMessage,
  inferCompilationCategory,
  inferCompilationMessage,
  mapDiagnostic,
  normalizeWorkerError,
  type UpstreamWorkerMessage,
} from "./javaRunnerHelpers";

interface JavaWorkerScope {
  onmessage:
    ((event: MessageEvent<JavaWorkerRequest>) => void | Promise<void>) | null;
  postMessage: (message: unknown) => void;
}

interface RuntimeLoaderModule {
  load(
    source: string | Int8Array,
    options?: {
      stackDeobfuscator?: {
        enabled?: boolean;
        path?: string;
      };
      installImports?: (
        imports: Record<string, Record<string, unknown>>,
      ) => void;
    },
  ): Promise<{
    exports: {
      main(args: string[]): void;
    };
  }>;
}

interface PendingCompilation {
  requestId: string;
  diagnostics: JavaExecutionIssue[];
  resolve: (result: UpstreamWorkerMessage) => void;
  reject: (error: unknown) => void;
}

const workerScope = self as unknown as JavaWorkerScope;
const LOAD_REQUEST_ID = "__load-classlib__";

let compilerWorker: Worker | null = null;
let compilerReady = false;
let compilerReadyPromise: Promise<void> | null = null;
let resolveCompilerReady: (() => void) | null = null;
let rejectCompilerReady: ((error: unknown) => void) | null = null;
let pendingCompilation: PendingCompilation | null = null;

workerScope.onmessage = async (event: MessageEvent<JavaWorkerRequest>) => {
  const message = event.data;

  if (message.type === "preload-compiler") {
    await preloadCompiler(message.requestId);
  } else if (message.type === "compile-and-run") {
    await compileAndRun(message);
  } else if (message.type === "stop") {
    disposeCompilerWorker();
  }
};

async function preloadCompiler(requestId?: string): Promise<void> {
  workerScope.postMessage({ type: "compiler-loading", requestId });

  try {
    await ensureCompilerReady();
    workerScope.postMessage({ type: "compiler-ready", requestId });
  } catch (error) {
    workerScope.postMessage({
      type: "compiler-load-error",
      requestId,
      error: getErrorMessage(error),
    });
  }
}

async function compileAndRun(
  message: JavaWorkerCompileAndRunRequest,
): Promise<void> {
  const { requestId, sourceCode, mainClass, stdin } = message;

  try {
    await ensureCompilerReady();
    workerScope.postMessage({ type: "compile-started", requestId });

    const executableSource = createExecutableSource(sourceCode, stdin);
    const compilation = await compileSource(requestId, executableSource);
    const diagnostics = compilation.diagnostics;

    assertCompilationSuccessful(compilation.result, diagnostics);

    const generatedScript = copyByteArray(compilation.result.script!);
    const artifacts: JavaExecutionArtifacts = {
      generatedFiles: [{ path: "app.wasm", size: generatedScript.byteLength }],
      mainClass: mainClass ?? "Main",
    };

    workerScope.postMessage({ type: "compile-finished", requestId, artifacts });
    workerScope.postMessage({ type: "run-started", requestId });

    const { stdout, stderr } = await runGeneratedProgram(
      generatedScript,
      requestId,
      artifacts,
    );

    workerScope.postMessage({
      type: "success",
      requestId,
      stdout,
      stderr,
      artifacts,
    });
  } catch (error) {
    postCompilationError(requestId, error);
  }
}

function assertCompilationSuccessful(
  result: UpstreamWorkerMessage,
  diagnostics: JavaExecutionIssue[],
): void {
  if (result.status !== "successful" || !result.script) {
    throw createWorkerError(
      inferCompilationCategory(diagnostics),
      inferCompilationMessage(diagnostics),
      diagnostics,
      null,
    );
  }
}

function postCompilationError(requestId: string, error: unknown): void {
  const normalized = normalizeWorkerError(error);
  workerScope.postMessage({
    type: "error",
    requestId,
    errorCategory: normalized.errorCategory,
    message: normalized.message,
    diagnostics: normalized.diagnostics,
    artifacts: normalized.artifacts ?? null,
  });
}

async function ensureCompilerReady(): Promise<void> {
  if (compilerReady && compilerWorker) {
    return;
  }

  if (compilerReadyPromise) {
    return compilerReadyPromise;
  }

  compilerReadyPromise = new Promise<void>((resolve, reject) => {
    resolveCompilerReady = resolve;
    rejectCompilerReady = reject;

    try {
      compilerWorker = new Worker(
        absoluteAssetUrl(JAVA_COMPILER_ASSET_URLS.upstreamWorker),
      );
      compilerWorker.onmessage = handleCompilerWorkerMessage;
      compilerWorker.onerror = handleCompilerWorkerError;
    } catch (error) {
      reject(error);
    }
  }).catch((error) => {
    disposeCompilerWorker();
    throw createWorkerError(
      "compiler-load",
      `Compiler could not be loaded. ${getErrorMessage(error)}`,
      [
        {
          code: "compiler_worker_load_failed",
          stage: "compiler-load",
          severity: "error",
          message: `worker.js could not be loaded. ${getErrorMessage(error)}`,
        },
      ],
    );
  });

  return compilerReadyPromise;
}

function handleClasslibInitialization(): void {
  compilerWorker?.postMessage({
    command: "load-classlib",
    id: LOAD_REQUEST_ID,
    url: absoluteAssetUrl(JAVA_COMPILER_ASSET_URLS.compileClasslib),
    runtimeUrl: absoluteAssetUrl(JAVA_COMPILER_ASSET_URLS.runtimeClasslib),
  });
}

function handleClasslibReady(messageId?: string): void {
  if (messageId === LOAD_REQUEST_ID) {
    compilerReady = true;
    resolveCompilerReady?.();
    clearReadyPromise();
  }
}

function handleCompilerDiagnostic(message: UpstreamWorkerMessage): void {
  if (pendingCompilation && message.id === pendingCompilation.requestId) {
    pendingCompilation.diagnostics.push(mapDiagnostic(message));
  }
}

function handleCompilationComplete(message: UpstreamWorkerMessage): void {
  if (pendingCompilation && message.id === pendingCompilation.requestId) {
    const current = pendingCompilation;
    pendingCompilation = null;
    current.resolve(message);
  }
}

const messageHandlers: Record<
  string,
  (message: UpstreamWorkerMessage) => void
> = {
  initialized: () => handleClasslibInitialization(),
  ok: (message) => handleClasslibReady(message.id),
  "compiler-diagnostic": (message) => handleCompilerDiagnostic(message),
  diagnostic: (message) => handleCompilerDiagnostic(message),
  "compilation-complete": (message) => handleCompilationComplete(message),
};

function handleCompilerWorkerMessage(
  event: MessageEvent<UpstreamWorkerMessage>,
): void {
  const handler = messageHandlers[event.data.command];
  handler?.(event.data);
}

function handleCompilerWorkerError(event: ErrorEvent): void {
  const workerError = buildWorkerErrorFromEvent(event, compilerReady);

  if (pendingCompilation) {
    const current = pendingCompilation;
    pendingCompilation = null;
    current.reject(workerError);
  } else if (rejectCompilerReady) {
    rejectCompilerReady(workerError);
  }

  disposeCompilerWorker();
}

function compileSource(requestId: string, sourceCode: string) {
  if (!compilerWorker) {
    throw createWorkerError("compiler-load", "Compiler could not be loaded.");
  }

  if (pendingCompilation) {
    throw createWorkerError(
      "unknown",
      "Another Java compilation is already running.",
    );
  }

  return new Promise<{
    result: UpstreamWorkerMessage;
    diagnostics: JavaExecutionIssue[];
  }>((resolve, reject) => {
    const diagnostics: JavaExecutionIssue[] = [];
    pendingCompilation = {
      requestId,
      diagnostics,
      resolve: (result) => resolve({ result, diagnostics }),
      reject,
    };

    compilerWorker?.postMessage({
      command: "compile",
      id: requestId,
      text: sourceCode,
    });
  });
}

async function runGeneratedProgram(
  wasmModule: Int8Array,
  requestId: string,
  artifacts: JavaExecutionArtifacts,
): Promise<{ stdout: string; stderr: string }> {
  let stdout = "";
  let stderr = "";

  let stdoutBuffer = "";
  let stderrBuffer = "";
  let stdoutTimeout: number | undefined;
  let stderrTimeout: number | undefined;

  const flushStdout = () => {
    if (stdoutBuffer) {
      workerScope.postMessage({
        type: "stdout",
        requestId,
        data: stdoutBuffer,
      });
      stdoutBuffer = "";
    }
    stdoutTimeout = undefined;
  };

  const flushStderr = () => {
    if (stderrBuffer) {
      workerScope.postMessage({
        type: "stderr",
        requestId,
        data: stderrBuffer,
      });
      stderrBuffer = "";
    }
    stderrTimeout = undefined;
  };

  try {
    const runtimeModule = (await import(
      /* @vite-ignore */ absoluteAssetUrl(
        JAVA_COMPILER_ASSET_URLS.compilerRuntime,
      )
    )) as RuntimeLoaderModule;

    const loaded = await runtimeModule.load(wasmModule, {
      stackDeobfuscator: { enabled: false },
      installImports(imports) {
        const teavmConsole = (imports.teavmConsole ??= {});
        teavmConsole.putcharStdout = (charCode: number) => {
          const next = String.fromCharCode(charCode);
          stdout += next;
          stdoutBuffer += next;
          if (stdoutTimeout === undefined) {
            stdoutTimeout = self.setTimeout(flushStdout, 50);
          }
        };
        teavmConsole.putcharStderr = (charCode: number) => {
          const next = String.fromCharCode(charCode);
          stderr += next;
          stderrBuffer += next;
          if (stderrTimeout === undefined) {
            stderrTimeout = self.setTimeout(flushStderr, 50);
          }
        };
      },
    });

    loaded.exports.main([]);
  } catch (error) {
    throw createWorkerError(
      "runtime",
      `WebAssembly execution failed. Reason: ${getErrorMessage(error)}`,
      [
        {
          code: "wasm_runtime_failed",
          stage: "runtime",
          severity: "error",
          message: getErrorMessage(error),
        },
      ],
      artifacts,
    );
  } finally {
    if (stdoutTimeout !== undefined) self.clearTimeout(stdoutTimeout);
    flushStdout();
    if (stderrTimeout !== undefined) self.clearTimeout(stderrTimeout);
    flushStderr();
  }

  return { stdout, stderr };
}

function disposeCompilerWorker(): void {
  if (compilerWorker) {
    compilerWorker.terminate();
    compilerWorker = null;
  }

  compilerReady = false;

  if (pendingCompilation) {
    pendingCompilation.reject(
      createWorkerError("stopped", "Execution was stopped manually."),
    );
    pendingCompilation = null;
  }

  if (rejectCompilerReady) {
    rejectCompilerReady(
      createWorkerError("stopped", "Compiler loading was stopped."),
    );
  }

  clearReadyPromise();
}

function clearReadyPromise(): void {
  compilerReadyPromise = null;
  resolveCompilerReady = null;
  rejectCompilerReady = null;
}

function absoluteAssetUrl(pathname: string): string {
  return new URL(pathname, self.location.origin).toString();
}

function copyByteArray(bytes: Int8Array): Int8Array {
  return new Int8Array(bytes);
}
